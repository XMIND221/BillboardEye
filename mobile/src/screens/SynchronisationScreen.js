import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { syncOfflineData } from "../services/syncService";
import { getSyncStats } from "../services/offlineStorage";

export default function SynchronisationScreen({ navigation }) {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [message, setMessage] = useState("");
  const [stats, setStats] = useState({
    panneaux: { pending: 0, synced: 0, error: 0 },
    photos: { pending: 0, synced: 0, error: 0 },
  });
  const previousOnline = useRef(true);

  const refreshStats = async () => {
    const currentStats = await getSyncStats();
    setStats(currentStats);
  };

  const runSync = async () => {
    if (isSyncing) {
      return;
    }

    setIsSyncing(true);
    setMessage("Synchronisation en cours...");
    const result = await syncOfflineData();
    await refreshStats();
    if (result.synced && (result.counts?.panneauxSync || result.counts?.photosSync)) {
      setMessage("Envoye avec succes");
    } else {
      setMessage(result.message || "Aucune donnee en attente.");
    }
    setIsSyncing(false);
  };

  useEffect(() => {
    const unsubscribeFocus = navigation.addListener("focus", refreshStats);
    return unsubscribeFocus;
  }, [navigation]);

  useEffect(() => {
    const unsubscribeNetInfo = NetInfo.addEventListener((state) => {
      const online = Boolean(state.isConnected && state.isInternetReachable !== false);
      setIsOnline(online);
      if (online && !previousOnline.current) {
        setMessage("Connexion retablie");
      }
      if (!online) {
        setMessage("Mode hors ligne");
      }
      previousOnline.current = online;
    });

    return () => unsubscribeNetInfo();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Synchronisation</Text>
      <View style={styles.networkBadge}>
        <Text style={[styles.networkText, { color: isOnline ? "#16A34A" : "#DC2626" }]}>
          {isOnline ? "🟢 En ligne" : "🔴 Hors ligne"}
        </Text>
      </View>

      <TouchableOpacity style={styles.syncButton} onPress={runSync} disabled={isSyncing}>
        {isSyncing ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.syncButtonText}>Synchroniser</Text>
        )}
      </TouchableOpacity>

      {!!message && <Text style={styles.message}>{message}</Text>}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Etat des donnees</Text>
        <Text style={styles.row}>
          Panneaux - En attente: {stats.panneaux.pending} | Sync: {stats.panneaux.synced} | Erreur:{" "}
          {stats.panneaux.error}
        </Text>
        <Text style={styles.row}>
          Photos - En attente: {stats.photos.pending} | Sync: {stats.photos.synced} | Erreur: {stats.photos.error}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FB",
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 12,
  },
  networkBadge: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  networkText: {
    fontWeight: "700",
  },
  syncButton: {
    backgroundColor: "#16A34A",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  syncButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  message: {
    marginTop: 10,
    color: "#4B5563",
    fontWeight: "600",
  },
  card: {
    marginTop: 14,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
  },
  cardTitle: {
    fontWeight: "700",
    marginBottom: 8,
  },
  row: {
    color: "#374151",
    marginBottom: 4,
  },
});
