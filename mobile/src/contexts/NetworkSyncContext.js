import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AppState, InteractionManager } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { syncOfflineData } from "../services/syncService";
import { getPendingSyncCount, getSyncStats } from "../services/offlineStorage";
import { useToast } from "./ToastContext";

const NetworkSyncContext = createContext({
  isOnline: true,
  isSyncing: false,
  pendingCount: 0,
  errorCount: 0,
  refreshQueueStats: async () => {},
  runManualSync: async () => ({ synced: false, message: "" }),
});

export function useNetworkSync() {
  return useContext(NetworkSyncContext);
}

function computeOnline(state) {
  if (!state) return true;
  if (state.isConnected === false) return false;
  if (state.isInternetReachable === false) return false;
  return true;
}

export function NetworkSyncProvider({ children }) {
  const { showToast } = useToast();
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const syncLock = useRef(false);
  const wasOffline = useRef(false);
  const debounceTimer = useRef(null);
  const lastAutoSyncRef = useRef(0);

  const refreshQueueStats = useCallback(async () => {
    try {
      const n = await getPendingSyncCount();
      const stats = await getSyncStats();
      const err = (stats.panneaux?.error || 0) + (stats.photos?.error || 0);
      setPendingCount(n);
      setErrorCount(err);
    } catch (_e) {
      setPendingCount(0);
      setErrorCount(0);
    }
  }, []);

  const runSyncInternal = useCallback(
    async ({ silent }) => {
      if (syncLock.current) {
        return { synced: false, message: "Sync déjà en cours.", counts: { panneauxSync: 0, photosSync: 0 } };
      }
      const online = computeOnline(await NetInfo.fetch());
      if (!online) {
        return { synced: false, message: "Pas de réseau.", counts: { panneauxSync: 0, photosSync: 0 } };
      }

      const pendingBefore = await getPendingSyncCount();
      if (pendingBefore === 0) {
        await refreshQueueStats();
        return { synced: false, message: "Aucune donnée en attente.", counts: { panneauxSync: 0, photosSync: 0 } };
      }

      syncLock.current = true;
      setIsSyncing(true);
      try {
        const result = await syncOfflineData();
        await refreshQueueStats();
        const uploaded = (result.counts?.panneauxSync || 0) + (result.counts?.photosSync || 0);
        if (!silent && uploaded > 0) {
          showToast(`Données synchronisées (${uploaded})`, "success");
        } else if (!silent && result.synced && uploaded === 0 && pendingBefore > 0) {
          showToast("Sync partielle — vérifiez les panneaux", "error");
        }
        return result;
      } catch (e) {
        if (!silent) showToast(e?.message || "Synchronisation impossible", "error");
        return { synced: false, message: e?.message, counts: { panneauxSync: 0, photosSync: 0 } };
      } finally {
        setIsSyncing(false);
        syncLock.current = false;
      }
    },
    [refreshQueueStats, showToast],
  );

  const runManualSync = useCallback(async () => {
    showToast("Synchronisation en cours…", "success");
    const r = await runSyncInternal({ silent: true });
    const uploaded = (r.counts?.panneauxSync || 0) + (r.counts?.photosSync || 0);
    if (uploaded > 0) {
      showToast(`Données synchronisées (${uploaded})`, "success");
    } else if (String(r.message || "").includes("Aucune")) {
      showToast("Rien à envoyer", "success");
    } else if (r.message && !String(r.message).includes("Sync déjà")) {
      showToast(r.message, "error");
    }
    return r;
  }, [runSyncInternal, showToast]);

  useEffect(() => {
    NetInfo.fetch().then((s) => {
      setIsOnline(computeOnline(s));
      if (!computeOnline(s)) wasOffline.current = true;
    });
  }, []);

  useEffect(() => {
    refreshQueueStats();
    const unsub = NetInfo.addEventListener((state) => {
      const next = computeOnline(state);
      setIsOnline(next);
      if (!next) {
        wasOffline.current = true;
      }
      if (next && wasOffline.current) {
        wasOffline.current = false;
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
          InteractionManager.runAfterInteractions(() => {
            const now = Date.now();
            if (now - lastAutoSyncRef.current < 2000) return;
            lastAutoSyncRef.current = now;
            runSyncInternal({ silent: false });
          });
        }, 700);
      }
    });

    const subApp = AppState.addEventListener("change", (next) => {
      if (next === "active") {
        refreshQueueStats();
        NetInfo.fetch().then((s) => {
          if (!computeOnline(s)) return;
          const now = Date.now();
          if (now - lastAutoSyncRef.current < 2000) return;
          lastAutoSyncRef.current = now;
          InteractionManager.runAfterInteractions(() => {
            runSyncInternal({ silent: true });
          });
        });
      }
    });

    return () => {
      unsub();
      subApp.remove();
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [refreshQueueStats, runSyncInternal]);

  const value = {
    isOnline,
    isSyncing,
    pendingCount,
    errorCount,
    refreshQueueStats,
    runManualSync,
  };

  return <NetworkSyncContext.Provider value={value}>{children}</NetworkSyncContext.Provider>;
}
