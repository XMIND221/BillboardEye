import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../theme";
import { getProjets, deleteProjet, duplicateProjet } from "../services/api";
import AppHeader from "../components/AppHeader";
import ManagerHeaderActions from "../components/ManagerHeaderActions";
import SectionHeader from "../components/manager/SectionHeader";
import ProgressBarBlock from "../components/manager/ProgressBarBlock";
import VisualStatusBadge from "../components/manager/VisualStatusBadge";
import ErrorBanner from "../components/manager/ErrorBanner";
import ManagerActionSheet from "../components/manager/ManagerActionSheet";
import ConfirmModal from "../components/manager/ConfirmModal";
import ManagerSearchBar from "../components/manager/ManagerSearchBar";
import ManagerChipRow from "../components/manager/ManagerChipRow";
import ManagerSortMenu from "../components/manager/ManagerSortMenu";
import { attachReportMetricsToCampaigns } from "../utils/campaignMetrics";
import { getCampaignVisualTone, collectCampaignZones } from "../utils/managerVisualStatus";
import { parseZones } from "../services/missionStorage";
import { useToast } from "../contexts/ToastContext";

const STATUS_FILTER_ITEMS = [
  { key: "all", label: "Tous statuts" },
  { key: "actif", label: "Actif" },
  { key: "attente", label: "En attente" },
  { key: "termine", label: "Terminé" },
  { key: "probleme", label: "Problème" },
];

const SORT_OPTIONS = [
  { key: "date", label: "Tri : date" },
  { key: "name", label: "Tri : nom (A→Z)" },
  { key: "progress", label: "Tri : progression" },
];

export default function ManagerCampaignsScreen({ navigation, userEmail = "", onSwitchRole, onSignOut }) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [sheetCampaign, setSheetCampaign] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [search, setSearch] = useState("");
  const [statusKey, setStatusKey] = useState("all");
  const [zoneKey, setZoneKey] = useState("all");
  const [sortKey, setSortKey] = useState("date");
  const [duplicating, setDuplicating] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setError("");
      const campaigns = await getProjets();
      const rows = await attachReportMetricsToCampaigns(campaigns || []);
      setItems(rows);
    } catch (err) {
      setError(err.message || "Impossible de charger les campagnes.");
    }
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true);
      await loadData();
      setLoading(false);
    };
    const unsubscribe = navigation.addListener("focus", bootstrap);
    bootstrap();
    return unsubscribe;
  }, [loadData, navigation]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const zoneChipItems = useMemo(() => {
    const zones = collectCampaignZones(items);
    return [{ key: "all", label: "Toutes zones" }, ...zones.map((z) => ({ key: z, label: z }))];
  }, [items]);

  const filteredSorted = useMemo(() => {
    let list = [...items];
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (i) =>
          String(i.nom || "")
            .toLowerCase()
            .includes(q) ||
          String(i.entreprise || "")
            .toLowerCase()
            .includes(q),
      );
    }
    if (statusKey !== "all") {
      list = list.filter((i) => getCampaignVisualTone(i) === statusKey);
    }
    if (zoneKey !== "all") {
      list = list.filter((i) => parseZones(i.zone).includes(zoneKey));
    }
    if (sortKey === "name") {
      list.sort((a, b) => String(a.nom || "").localeCompare(String(b.nom || ""), "fr"));
    } else if (sortKey === "progress") {
      list.sort((a, b) => (b.progress || 0) - (a.progress || 0));
    } else {
      list.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    }
    return list;
  }, [items, search, statusKey, zoneKey, sortKey]);

  const confirmDelete = async () => {
    if (!deleteTarget?.id) return;
    try {
      await deleteProjet(deleteTarget.id);
      showToast("Campagne supprimée");
      setDeleteTarget(null);
      await loadData();
    } catch (e) {
      showToast(e.message || "Suppression impossible", "error");
      setDeleteTarget(null);
    }
  };

  const runDuplicate = async (c) => {
    if (!c?.id || duplicating) return;
    try {
      setDuplicating(true);
      await duplicateProjet(c.id);
      showToast("Campagne dupliquée");
      setSheetCampaign(null);
      await loadData();
    } catch (e) {
      showToast(e.message || "Duplication impossible", "error");
    } finally {
      setDuplicating(false);
    }
  };

  return (
    <View style={styles.root}>
      <AppHeader
        rightExtra={
          <ManagerHeaderActions compact userEmail={userEmail} onSwitchRole={onSwitchRole} onSignOut={onSignOut} />
        }
      />
      <View style={styles.body}>
        <SectionHeader title="Campagnes" subtitle="Pilotage des opérations — progression et statut par campagne." />

        <ManagerSearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Rechercher une campagne ou un client…"
        />

        <View style={styles.sortRow}>
          <ManagerSortMenu label="Trier par" value={sortKey} options={SORT_OPTIONS} onChange={setSortKey} />
        </View>

        <ManagerChipRow label="Statut" items={STATUS_FILTER_ITEMS} selectedKey={statusKey} onSelect={setStatusKey} />
        <ManagerChipRow label="Zone" items={zoneChipItems} selectedKey={zoneKey} onSelect={setZoneKey} />

        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => navigation.navigate("ManagerCreateCampaign")}
          activeOpacity={0.88}
        >
          <Ionicons name="add-circle-outline" size={22} color={theme.colors.primary} />
          <Text style={styles.createBtnText}>Créer une campagne</Text>
        </TouchableOpacity>

        <ErrorBanner message={error} onRetry={loadData} />
        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.accent} style={styles.loader} />
        ) : (
          <FlatList
            data={filteredSorted}
            keyExtractor={(item) => item.id}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.accent} />}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <Text style={styles.empty}>
                {items.length === 0 ? "Aucune campagne pour l’instant." : "Aucun résultat pour ces filtres."}
              </Text>
            }
            renderItem={({ item }) => (
              <View style={styles.card}>
                <TouchableOpacity
                  style={styles.cardMain}
                  onPress={() => navigation.navigate("ManagerCampaignDetail", { campaign: item })}
                  activeOpacity={0.88}
                >
                  <View style={styles.cardTop}>
                    <View style={styles.cardTitleBlock}>
                      <Text style={styles.name} numberOfLines={2}>
                        {item.nom}
                      </Text>
                      <Text style={styles.client} numberOfLines={1}>
                        {item.entreprise}
                      </Text>
                    </View>
                    <View style={styles.cardTopRight}>
                      <VisualStatusBadge tone={getCampaignVisualTone(item)} />
                      <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} style={styles.chevron} />
                    </View>
                  </View>
                  {item.total > 0 ? (
                    <ProgressBarBlock label="Collecte terrain" current={item.completed} total={item.total} />
                  ) : (
                    <Text style={styles.noData}>Aucun panneau lié au rapport pour cette campagne.</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.kebab}
                  onPress={() => setSheetCampaign(item)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  accessibilityLabel="Actions campagne"
                >
                  <Ionicons name="ellipsis-vertical" size={22} color={theme.colors.textMuted} />
                </TouchableOpacity>
              </View>
            )}
          />
        )}
      </View>

      <ManagerActionSheet
        visible={!!sheetCampaign}
        onClose={() => !duplicating && setSheetCampaign(null)}
        title={sheetCampaign?.nom}
        actions={[
          {
            key: "edit",
            label: "Modifier",
            icon: "create-outline",
            onPress: () => navigation.navigate("ManagerCreateCampaign", { editCampaign: sheetCampaign }),
          },
          {
            key: "dup",
            label: duplicating ? "Duplication…" : "Dupliquer campagne",
            icon: "copy-outline",
            onPress: () => runDuplicate(sheetCampaign),
          },
          {
            key: "del",
            label: "Supprimer",
            icon: "trash-outline",
            destructive: true,
            onPress: () => setDeleteTarget(sheetCampaign),
          },
        ]}
      />

      <ConfirmModal
        visible={!!deleteTarget}
        title="Supprimer la campagne ?"
        message="Êtes-vous sûr ? Cette action est définitive. Les panneaux liés seront détachés de la campagne."
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
  body: { flex: 1, paddingHorizontal: theme.spacing.md, paddingTop: theme.spacing.xs },
  sortRow: { marginBottom: theme.spacing.xs },
  createBtn: {
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
  createBtnText: { color: theme.colors.primary, fontWeight: "800", fontSize: 15 },
  listContent: { paddingBottom: theme.spacing.xxl },
  card: {
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
    overflow: "hidden",
  },
  cardMain: { flex: 1, padding: theme.spacing.lg, paddingRight: 4, minWidth: 0 },
  kebab: {
    justifyContent: "center",
    paddingHorizontal: 10,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: theme.colors.border,
  },
  cardTop: { flexDirection: "row", alignItems: "flex-start", marginBottom: theme.spacing.sm },
  cardTitleBlock: { flex: 1, minWidth: 0, paddingRight: theme.spacing.sm },
  cardTopRight: { alignItems: "flex-end" },
  chevron: { marginTop: 4 },
  name: { color: theme.colors.text, fontWeight: "800", fontSize: 17, letterSpacing: -0.2 },
  client: { color: theme.colors.textSecondary, marginTop: 4, fontSize: 14 },
  noData: { fontSize: 13, color: theme.colors.textMuted, marginTop: theme.spacing.xs },
  empty: { color: theme.colors.textMuted, marginTop: theme.spacing.lg, textAlign: "center", fontSize: 15 },
  loader: { marginTop: 48 },
});
