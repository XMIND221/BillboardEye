import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../theme";
import AppHeader from "../components/AppHeader";
import PanelCard from "../components/PanelCard";
import SectionHeader from "../components/manager/SectionHeader";
import ErrorBanner from "../components/manager/ErrorBanner";
import ManagerActionSheet from "../components/manager/ManagerActionSheet";
import ConfirmModal from "../components/manager/ConfirmModal";
import ManagerSearchBar from "../components/manager/ManagerSearchBar";
import ManagerChipRow from "../components/manager/ManagerChipRow";
import ManagerSortMenu from "../components/manager/ManagerSortMenu";
import { getPanneaux, getProjets, getRapport, deletePanneau } from "../services/api";
import { useToast } from "../contexts/ToastContext";
import { collectPanneauZones, getPanneauVisualTone } from "../utils/managerVisualStatus";
import { useFocusRefresh } from "../hooks/useFocusRefresh";

const enrichWithPhotos = async (panneau) => {
  if (panneau.photos?.faceA?.url || panneau.photos?.faceB?.url) return panneau;
  if (!panneau.serverId) return panneau;
  try {
    const rapport = await getRapport(panneau.serverId);
    const photos = {};
    if (rapport?.photos?.faceA?.url) photos.faceA = { url: rapport.photos.faceA.url };
    if (rapport?.photos?.faceB?.url) photos.faceB = { url: rapport.photos.faceB.url };
    return { ...panneau, photos: Object.keys(photos).length ? photos : null };
  } catch (_err) {
    return panneau;
  }
};

const STATUS_FILTER_ITEMS = [
  { key: "all", label: "Tous statuts" },
  { key: "actif", label: "Actif" },
  { key: "attente", label: "En attente" },
  { key: "termine", label: "Terminé" },
  { key: "probleme", label: "Problème" },
];

const SORT_OPTIONS = [
  { key: "date", label: "Tri : date" },
  { key: "name", label: "Tri : nom site" },
  { key: "campaign", label: "Tri : campagne" },
];
const INITIAL_ENRICH_LIMIT = 12;

const norm = (v) => String(v || "").trim().toLowerCase();
const getPanneauSortTimestamp = (item) => {
  const candidates = [item?.createdAt, item?.date];
  for (const value of candidates) {
    const t = new Date(value || 0).getTime();
    if (Number.isFinite(t) && t > 0) return t;
  }
  return 0;
};

export default function ManagerPanneauxScreen({ navigation }) {
  const { showToast } = useToast();
  const [panneaux, setPanneaux] = useState([]);
  const [projetsById, setProjetsById] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sheetPanneau, setSheetPanneau] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [search, setSearch] = useState("");
  const [statusKey, setStatusKey] = useState("all");
  const [projetKey, setProjetKey] = useState("all");
  const [zoneKey, setZoneKey] = useState("all");
  const [sortKey, setSortKey] = useState("date");

  const load = useCallback(async () => {
    try {
      setError("");
      const [projets, panels] = await Promise.all([getProjets(), getPanneaux()]);
      const map = {};
      (projets || []).forEach((p) => {
        map[p.id] = p.nom;
      });
      setProjetsById(map);
      const baseList = (panels || []).map((item) => ({
        id: item.id,
        serverId: item.id,
        entreprise: item.entreprise,
        nomZone: item.nomZone,
        projetId: item.projetId,
        localisation: item.localisation,
        nombreFaces: item.nombreFaces,
        statut: item.statut,
        createdAt: item.createdAt,
        photos: item.photos || null,
      }));
      // First paint quickly, then enrich visible rows first.
      setPanneaux(baseList);
      const firstBatch = baseList.slice(0, INITIAL_ENRICH_LIMIT);
      const remainingBatch = baseList.slice(INITIAL_ENRICH_LIMIT);
      const enrichedFirst = await Promise.all(firstBatch.map(enrichWithPhotos));
      setPanneaux([...enrichedFirst, ...remainingBatch]);
      if (remainingBatch.length > 0) {
        setTimeout(async () => {
          try {
            const enrichedRemaining = await Promise.all(remainingBatch.map(enrichWithPhotos));
            setPanneaux([...enrichedFirst, ...enrichedRemaining]);
          } catch {
            // Keep partial enrichment if background fetch fails.
          }
        }, 0);
      }
    } catch (err) {
      setError(err.message || "Impossible de charger les panneaux.");
    }
  }, []);

  const refreshPanneaux = useCallback(async () => {
    if (panneaux.length === 0) setLoading(true);
    await load();
    setLoading(false);
  }, [load, panneaux.length]);

  const runFocusRefresh = useFocusRefresh(navigation, refreshPanneaux, {
    minIntervalMs: 20000,
    runOnMount: true,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await runFocusRefresh(true);
    setRefreshing(false);
  };

  const projetChipItems = useMemo(() => {
    const ids = [...new Set(panneaux.map((p) => p.projetId).filter(Boolean))];
    return [
      { key: "all", label: "Toutes campagnes" },
      ...ids.map((id) => ({ key: id, label: projetsById[id] || id })),
    ];
  }, [panneaux, projetsById]);

  const zoneChipItems = useMemo(() => {
    const zones = collectPanneauZones(panneaux);
    return [{ key: "all", label: "Toutes zones" }, ...zones.map((z) => ({ key: z, label: z }))];
  }, [panneaux]);

  const filteredSorted = useMemo(() => {
    let list = [...panneaux];
    const q = norm(search);
    if (q) {
      list = list.filter((p) => {
        const addr = norm(p.localisation?.adresse);
        const campaignName = norm(projetsById[p.projetId]);
        return (
          norm(p.entreprise).includes(q) ||
          norm(p.nomZone).includes(q) ||
          addr.includes(q) ||
          campaignName.includes(q)
        );
      });
    }
    if (statusKey !== "all") {
      list = list.filter((p) => getPanneauVisualTone(p) === statusKey);
    }
    if (projetKey !== "all") {
      list = list.filter((p) => p.projetId === projetKey);
    }
    if (zoneKey !== "all") {
      const zone = norm(zoneKey);
      list = list.filter((p) => norm(p.nomZone) === zone);
    }
    if (sortKey === "name") {
      list.sort((a, b) => {
        const na = (a.nomZone && String(a.nomZone).trim()) || a.entreprise || "";
        const nb = (b.nomZone && String(b.nomZone).trim()) || b.entreprise || "";
        const cmp = na.localeCompare(nb, "fr", { sensitivity: "base" });
        if (cmp !== 0) return cmp;
        return getPanneauSortTimestamp(b) - getPanneauSortTimestamp(a);
      });
    } else if (sortKey === "campaign") {
      list.sort((a, b) => {
        const cmp = String(projetsById[a.projetId] || "").localeCompare(String(projetsById[b.projetId] || ""), "fr", {
          sensitivity: "base",
        });
        if (cmp !== 0) return cmp;
        const na = (a.nomZone && String(a.nomZone).trim()) || a.entreprise || "";
        const nb = (b.nomZone && String(b.nomZone).trim()) || b.entreprise || "";
        return na.localeCompare(nb, "fr", { sensitivity: "base" });
      });
    } else {
      list.sort((a, b) => {
        const diff = getPanneauSortTimestamp(b) - getPanneauSortTimestamp(a);
        if (diff !== 0) return diff;
        const na = (a.nomZone && String(a.nomZone).trim()) || a.entreprise || "";
        const nb = (b.nomZone && String(b.nomZone).trim()) || b.entreprise || "";
        return na.localeCompare(nb, "fr", { sensitivity: "base" });
      });
    }
    return list;
  }, [panneaux, search, statusKey, projetKey, zoneKey, sortKey, projetsById]);

  const confirmDelete = async () => {
    if (!deleteTarget?.id) return;
    try {
      await deletePanneau(deleteTarget.id);
      showToast("Panneau supprimé");
      setDeleteTarget(null);
      await runFocusRefresh(true);
    } catch (e) {
      showToast(e.message || "Suppression impossible", "error");
      setDeleteTarget(null);
    }
  };

  return (
    <View style={styles.root}>
      <AppHeader />
      <View style={styles.container}>
        <SectionHeader title="Panneaux" subtitle="Inventaire synchronisé — recherche, filtres et carte." />

        <ManagerSearchBar value={search} onChangeText={setSearch} placeholder="Rechercher site, zone ou adresse…" />

        <View style={styles.toolbar}>
          <ManagerSortMenu label="Trier par" value={sortKey} options={SORT_OPTIONS} onChange={setSortKey} />
          <TouchableOpacity style={styles.mapFab} onPress={() => navigation.navigate("ManagerPanneauxMap")} activeOpacity={0.88}>
            <Ionicons name="map-outline" size={20} color={theme.colors.primary} />
            <Text style={styles.mapFabText}>Carte</Text>
          </TouchableOpacity>
        </View>

        <ManagerChipRow label="Statut" items={STATUS_FILTER_ITEMS} selectedKey={statusKey} onSelect={setStatusKey} />
        <ManagerChipRow label="Campagne" items={projetChipItems} selectedKey={projetKey} onSelect={setProjetKey} />
        <ManagerChipRow label="Zone" items={zoneChipItems} selectedKey={zoneKey} onSelect={setZoneKey} />

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate("ManagerPanneauForm")}
          activeOpacity={0.88}
        >
          <Ionicons name="add-circle-outline" size={22} color={theme.colors.primary} />
          <Text style={styles.addBtnText}>Ajouter un panneau</Text>
        </TouchableOpacity>

        <ErrorBanner message={error} onRetry={() => runFocusRefresh(true)} />
        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
        ) : (
          <FlatList
            data={filteredSorted}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
            ListEmptyComponent={
              <Text style={styles.empty}>
                {panneaux.length === 0 ? "Aucun panneau enregistré sur le serveur." : "Aucun résultat pour ces filtres."}
              </Text>
            }
            renderItem={({ item }) => (
              <PanelCard
                panneau={item}
                projetNom={projetsById[item.projetId]}
                onMenuPress={() => setSheetPanneau(item)}
              />
            )}
          />
        )}
      </View>

      <ManagerActionSheet
        visible={!!sheetPanneau}
        onClose={() => setSheetPanneau(null)}
        title={sheetPanneau?.nomZone || sheetPanneau?.entreprise}
        actions={[
          {
            key: "edit",
            label: "Modifier",
            icon: "create-outline",
            onPress: () => navigation.navigate("ManagerPanneauForm", { panneau: sheetPanneau }),
          },
          {
            key: "del",
            label: "Supprimer",
            icon: "trash-outline",
            destructive: true,
            onPress: () => setDeleteTarget(sheetPanneau),
          },
        ]}
      />

      <ConfirmModal
        visible={!!deleteTarget}
        title="Supprimer le panneau ?"
        message="Êtes-vous sûr ? Cette action est définitive."
        confirmLabel="Supprimer"
        destructive
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.canvas },
  container: { flex: 1, paddingHorizontal: theme.spacing.md },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing.xs,
    gap: theme.spacing.sm,
  },
  mapFab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surface,
  },
  mapFabText: { fontWeight: "800", color: theme.colors.primary, fontSize: 13 },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    alignSelf: "flex-start",
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.sm,
  },
  addBtnText: { color: theme.colors.primary, fontWeight: "800", fontSize: 15 },
  list: { paddingBottom: theme.spacing.xxl },
  empty: { color: theme.colors.textMuted, marginTop: theme.spacing.xl, textAlign: "center", fontSize: 15 },
  loader: { marginTop: 48 },
});
