import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, RefreshControl, Linking } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { getProjets, getProjetPDFUrl, getProjetReport } from "../services/api";
import { theme } from "../theme";
import AppHeader from "../components/AppHeader";
import SectionHeader from "../components/manager/SectionHeader";
import ErrorBanner from "../components/manager/ErrorBanner";
import ProgressBarBlock from "../components/manager/ProgressBarBlock";
import StatusBadge from "../components/manager/StatusBadge";
import { getSelectedProject, getUserRole, saveSelectedProject } from "../services/projectStorage";
import {
  addReportHistoryEntry,
  getReportHistory,
  removeReportHistoryEntry,
  updateReportHistoryEntry,
} from "../services/reportHistoryStorage";
import { useToast } from "../contexts/ToastContext";
import { MANAGER_REPORT_SCREENS } from "../navigation/reportScreens";

const parseZones = (zoneStr) =>
  String(zoneStr || "")
    .split(/[;,/|]/)
    .map((z) => z.trim())
    .filter(Boolean);

export default function ReportingGenerateScreen({ navigation, route }) {
  const { showToast } = useToast();
  const preselectedCampaignId = route.params?.preselectedCampaignId;
  const reportScreens = route.params?.reportScreens || MANAGER_REPORT_SCREENS;
  const reportingUiMode = route.params?.reportingUiMode || "manager";

  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState(preselectedCampaignId || "");
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [generatingDirect, setGeneratingDirect] = useState(false);
  const [error, setError] = useState("");
  const [storageRole, setStorageRole] = useState("gestionnaire");
  const [reportHistory, setReportHistory] = useState([]);

  const selectedCampaignIdRef = useRef(selectedCampaignId);
  useEffect(() => {
    selectedCampaignIdRef.current = selectedCampaignId;
  }, [selectedCampaignId]);

  const reportSeqRef = useRef(0);

  useEffect(() => {
    if (preselectedCampaignId) {
      setSelectedCampaignId(preselectedCampaignId);
    }
  }, [preselectedCampaignId]);

  const loadCampaignsWithRoleKey = useCallback(async (roleKey, preserveSelection) => {
    try {
      setError("");
      const result = await getProjets();
      setCampaigns(result);
      const currentId = selectedCampaignIdRef.current;

      if (!preserveSelection || !currentId) {
        if (result.length > 0) {
          const preferred = await getSelectedProject(roleKey);
          const preferredId = preferred?.id && result.some((c) => c.id === preferred.id) ? preferred.id : null;
          setSelectedCampaignId(preferredId || result[0].id);
        }
      } else {
        const still = result.some((c) => c.id === currentId);
        if (!still && result.length > 0) {
          setSelectedCampaignId(result[0].id);
        }
      }
    } catch (err) {
      setError(err.message || "Impossible de charger les campagnes.");
    }
  }, []);

  const loadCampaigns = useCallback(
    async (preserveSelection) => {
      const roleKey = storageRole === "reporting" ? "reporting" : "gestionnaire";
      await loadCampaignsWithRoleKey(roleKey, preserveSelection);
    },
    [storageRole, loadCampaignsWithRoleKey],
  );

  const loadReport = useCallback(async (campaignId) => {
    const id = campaignId ?? selectedCampaignIdRef.current;
    if (!id) return;
    const seq = ++reportSeqRef.current;
    try {
      setLoadingReport(true);
      setError("");
      const report = await getProjetReport(id);
      if (seq !== reportSeqRef.current) return;
      setReportData(report);
    } catch (err) {
      if (seq !== reportSeqRef.current) return;
      setError(err.message || "Impossible de charger les données.");
    } finally {
      if (seq === reportSeqRef.current) {
        setLoadingReport(false);
      }
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const r = await getUserRole();
      const sr = r === "reporting" ? "reporting" : "gestionnaire";
      setStorageRole(sr);
      await loadCampaignsWithRoleKey(sr, false);
      setLoading(false);
    };
    init();
  }, [loadCampaignsWithRoleKey]);

  useEffect(() => {
    if (selectedCampaignId) {
      loadReport(selectedCampaignId);
    } else {
      setReportData(null);
    }
  }, [selectedCampaignId, loadReport]);

  const loadHistory = useCallback(async () => {
    const rows = await getReportHistory();
    setReportHistory(rows);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCampaigns(true);
    if (selectedCampaignIdRef.current) await loadReport(selectedCampaignIdRef.current);
    setRefreshing(false);
  };

  const selectedCampaign = useMemo(
    () => campaigns.find((item) => item.id === selectedCampaignId) || null,
    [campaigns, selectedCampaignId],
  );

  const onSelectCampaign = async (item) => {
    setSelectedCampaignId(item.id);
    await saveSelectedProject(item, storageRole);
  };

  const prepareReport = async () => {
    if (!selectedCampaignId) return;
    try {
      setError("");
      navigation.navigate(reportScreens.Editor, {
        campaign: selectedCampaign,
        reportData,
        reportScreens,
      });
    } catch (_err) {}
  };

  const generateDirect = async () => {
    if (!selectedCampaignId) return;
    const hid = `r-${Date.now()}-${selectedCampaignId}`;
    await addReportHistoryEntry({
      id: hid,
      projetId: selectedCampaignId,
      campaignName: selectedCampaign?.nom || "Campagne",
      pdfUrl: "",
      createdAt: new Date().toISOString(),
      status: "pending",
    });
    await loadHistory();
    try {
      setGeneratingDirect(true);
      setError("");
      const result = await getProjetPDFUrl(selectedCampaignId);
      const url = result?.url || "";
      await updateReportHistoryEntry(hid, { status: "generated", pdfUrl: url });
      await loadHistory();
      showToast("Rapport généré — PDF prêt");
      navigation.navigate(reportScreens.Preview, {
        campaign: selectedCampaign,
        reportData,
        pdfUrl: url,
        reportScreens,
      });
    } catch (err) {
      await updateReportHistoryEntry(hid, { status: "failed", pdfUrl: "" });
      await loadHistory();
      setError(err.message || "Génération PDF impossible.");
      showToast("Impossible de générer le PDF", "error");
    } finally {
      setGeneratingDirect(false);
    }
  };

  const openHistoryPdf = async (url) => {
    if (!url) return;
    try {
      await Linking.openURL(url);
    } catch {
      showToast("Impossible d’ouvrir le lien", "error");
    }
  };

  const removeHistoryLine = async (id) => {
    await removeReportHistoryEntry(id);
    await loadHistory();
    showToast("Rapport retiré de l’historique");
  };

  const historyStatusVariant = (s) => {
    if (s === "generated") return "success";
    if (s === "pending") return "warning";
    return "error";
  };

  const historyStatusLabel = (s) => {
    if (s === "generated") return "Généré";
    if (s === "pending") return "En attente";
    return "Échec";
  };

  const zones = parseZones(reportData?.projet?.zone);
  const total = reportData?.summary?.total ?? 0;
  const completed = reportData?.summary?.completed ?? 0;

  const subtitle =
    reportingUiMode === "standalone"
      ? "Sélectionnez une campagne autorisée pour votre compte, puis générez le PDF."
      : "Rapports et PDF — uniquement les campagnes de votre périmètre gestionnaire.";

  if (loading) {
    return (
      <View style={styles.outer}>
        <AppHeader />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.outer}>
      <AppHeader />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
      >
        <SectionHeader title="Rapport PDF" subtitle={subtitle} />

        {reportHistory.length > 0 && (
          <View style={styles.historyBlock}>
            <Text style={styles.historyTitle}>Historique des rapports</Text>
            {reportHistory.slice(0, 12).map((row) => (
              <View key={row.id} style={styles.historyRow}>
                <View style={styles.historyMain}>
                  <Text style={styles.historyName} numberOfLines={1}>
                    {row.campaignName}
                  </Text>
                  <Text style={styles.historyDate}>
                    {row.createdAt ? new Date(row.createdAt).toLocaleString("fr-FR") : ""}
                  </Text>
                  <StatusBadge variant={historyStatusVariant(row.status)}>{historyStatusLabel(row.status)}</StatusBadge>
                </View>
                <View style={styles.historyActions}>
                  {row.pdfUrl && row.status === "generated" ? (
                    <TouchableOpacity onPress={() => openHistoryPdf(row.pdfUrl)} hitSlop={10} style={styles.historyIconBtn}>
                      <Ionicons name="open-outline" size={22} color={theme.colors.primary} />
                    </TouchableOpacity>
                  ) : null}
                  <TouchableOpacity onPress={() => removeHistoryLine(row.id)} hitSlop={10} style={styles.historyIconBtn}>
                    <Ionicons name="trash-outline" size={20} color={theme.colors.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        <ErrorBanner
          message={error}
          onRetry={async () => {
            await loadCampaigns(true);
            if (selectedCampaignIdRef.current) await loadReport(selectedCampaignIdRef.current);
          }}
        />

        {campaigns.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Aucune campagne</Text>
            <Text style={styles.emptyText}>
              {reportingUiMode === "standalone"
                ? "Aucune campagne n’est disponible pour votre compte reporting."
                : "Créez une campagne dans l’onglet Campagnes pour générer des rapports."}
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.label}>Campagne</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
              {campaigns.map((item) => {
                const selected = item.id === selectedCampaignId;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.campaignChip, selected && styles.campaignChipSelected]}
                    onPress={() => onSelectCampaign(item)}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.campaignChipText, selected && styles.campaignChipTextSelected]} numberOfLines={1}>
                      {item.nom}
                    </Text>
                    <Text style={[styles.campaignChipMeta, selected && styles.campaignChipMetaSelected]} numberOfLines={1}>
                      {item.entreprise}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {loadingReport ? (
              <View style={styles.loadingCard}>
                <ActivityIndicator size="small" color={theme.colors.accent} />
                <Text style={styles.loadingText}>Chargement des données…</Text>
              </View>
            ) : reportData ? (
              <View style={styles.summaryCard}>
                <Text style={styles.sectionTitle}>Résumé — {reportData.projet?.nom || selectedCampaign?.nom || ""}</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Client</Text>
                  <Text style={styles.summaryValue}>{reportData.projet?.entreprise || "-"}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Zones</Text>
                  <Text style={styles.summaryValue}>{zones.length}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Date</Text>
                  <Text style={styles.summaryValue}>
                    {reportData.projet?.date ? new Date(reportData.projet.date).toLocaleDateString("fr-FR") : "-"}
                  </Text>
                </View>

                {total > 0 ? (
                  <ProgressBarBlock label="Panneaux complétés" current={completed} total={total} />
                ) : (
                  <Text style={styles.noProgress}>Aucun panneau dans le rapport pour cette campagne.</Text>
                )}

                {(reportData.panneaux || []).length > 0 && (
                  <View style={styles.zonesPreview}>
                    <Text style={styles.zonesLabel}>Zones avec données</Text>
                    {(reportData.panneaux || []).slice(0, 5).map((p, i) => (
                      <Text key={p.id} style={styles.zoneItem}>
                        • {p.localisation?.adresse || `Zone ${i + 1}`}
                        {p.isComplete ? " ✓" : ""}
                      </Text>
                    ))}
                    {(reportData.panneaux || []).length > 5 && (
                      <Text style={styles.zoneMore}>+ {(reportData.panneaux || []).length - 5} autres</Text>
                    )}
                  </View>
                )}
              </View>
            ) : null}

            <Text style={styles.actionsHint}>Personnalisez d’abord le contenu, ou générez directement le PDF.</Text>
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.secondaryActionButton, (!selectedCampaignId || !reportData) && styles.primaryButtonDisabled]}
                onPress={prepareReport}
                disabled={!selectedCampaignId || !reportData}
                activeOpacity={0.85}
              >
                <Text style={styles.secondaryActionText}>Personnaliser le rapport</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.primaryActionButton,
                  (generatingDirect || !selectedCampaignId || !reportData) && styles.primaryButtonDisabled,
                ]}
                onPress={generateDirect}
                disabled={generatingDirect || !selectedCampaignId || !reportData}
                activeOpacity={0.85}
              >
                {generatingDirect ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>PDF final</Text>}
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, backgroundColor: theme.colors.canvas },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.colors.canvas },
  container: { flex: 1, backgroundColor: theme.colors.canvas },
  content: { padding: theme.spacing.md, paddingBottom: theme.spacing.xxl },
  historyBlock: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  historyTitle: { fontSize: 14, fontWeight: "800", color: theme.colors.text, marginBottom: theme.spacing.sm },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  historyMain: { flex: 1, minWidth: 0 },
  historyName: { fontSize: 15, fontWeight: "700", color: theme.colors.text },
  historyDate: { fontSize: 12, color: theme.colors.textMuted, marginTop: 2, marginBottom: 6 },
  historyActions: { flexDirection: "row", alignItems: "center" },
  historyIconBtn: { padding: 6, marginLeft: 4 },
  actionsLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: theme.colors.textMuted,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  primaryFullButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.accent,
    paddingVertical: 14,
    borderRadius: theme.radius.lg,
    marginBottom: theme.spacing.sm,
  },
  noProgress: { fontSize: 13, color: theme.colors.textMuted, marginTop: theme.spacing.sm },
  label: { fontSize: 14, fontWeight: "600", color: theme.colors.textSecondary, marginBottom: theme.spacing.sm },
  chipsScroll: { marginBottom: theme.spacing.md },
  campaignChip: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginRight: theme.spacing.sm,
    borderWidth: 2,
    borderColor: theme.colors.border,
    minWidth: 140,
    ...theme.shadows.sm,
  },
  campaignChipSelected: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
  campaignChipText: { color: theme.colors.text, fontWeight: "700", fontSize: 15 },
  campaignChipTextSelected: { color: "#fff" },
  campaignChipMeta: { color: theme.colors.textMuted, fontSize: 12, marginTop: 2 },
  campaignChipMetaSelected: { color: "rgba(255,255,255,0.8)" },
  emptyCard: {
    backgroundColor: theme.colors.pastels.pink,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: theme.colors.text, marginBottom: 8 },
  emptyText: { fontSize: 14, color: theme.colors.textSecondary },
  loadingCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 12,
  },
  loadingText: { color: theme.colors.textSecondary, fontSize: 14 },
  summaryCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: theme.colors.text, marginBottom: theme.spacing.md },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  summaryLabel: { color: theme.colors.textSecondary, fontSize: 14 },
  summaryValue: { color: theme.colors.text, fontSize: 14, fontWeight: "600" },
  zonesPreview: { marginTop: theme.spacing.sm },
  zonesLabel: { color: theme.colors.textSecondary, fontSize: 12, marginBottom: 6 },
  zoneItem: { color: theme.colors.text, fontSize: 13, marginBottom: 2 },
  zoneMore: { color: theme.colors.textMuted, fontSize: 12, marginTop: 4 },
  actionsHint: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.sm,
    lineHeight: 18,
  },
  actionsRow: { flexDirection: "row", gap: theme.spacing.sm },
  primaryActionButton: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: theme.colors.accent,
    paddingVertical: 12,
    borderRadius: theme.radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryActionButton: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 12,
    borderRadius: theme.radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryActionText: { color: theme.colors.text, fontWeight: "700", fontSize: 14 },
  primaryButtonDisabled: { opacity: 0.6 },
  primaryText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
