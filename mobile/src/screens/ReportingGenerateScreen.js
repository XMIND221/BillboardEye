import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, RefreshControl } from "react-native";
import { getProjets, getProjetPDFUrl, getProjetReport } from "../services/api";
import { theme } from "../theme";
import AppHeader from "../components/AppHeader";
import { getSelectedProject, getUserRole, saveSelectedProject } from "../services/projectStorage";
import { MANAGER_REPORT_SCREENS } from "../navigation/reportScreens";

const parseZones = (zoneStr) =>
  String(zoneStr || "")
    .split(/[;,/|]/)
    .map((z) => z.trim())
    .filter(Boolean);

export default function ReportingGenerateScreen({ navigation, route }) {
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
    try {
      setGeneratingDirect(true);
      setError("");
      const result = await getProjetPDFUrl(selectedCampaignId);
      navigation.navigate(reportScreens.Preview, {
        campaign: selectedCampaign,
        reportData,
        pdfUrl: result?.url || "",
        reportScreens,
      });
    } catch (err) {
      setError(err.message || "Génération PDF impossible.");
    } finally {
      setGeneratingDirect(false);
    }
  };

  const zones = parseZones(reportData?.projet?.zone);
  const total = reportData?.summary?.total ?? 0;
  const completed = reportData?.summary?.completed ?? 0;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

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
        <Text style={styles.title}>Rapport PDF</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        {!!error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={async () => {
                await loadCampaigns(true);
                if (selectedCampaignIdRef.current) await loadReport(selectedCampaignIdRef.current);
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.retryText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        )}

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

                <View style={styles.progressBlock}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressLabel}>Panneaux complétés</Text>
                    <Text style={styles.progressValue}>
                      {completed} / {total} ({progress}%)
                    </Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${progress}%` }]} />
                  </View>
                </View>

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

            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.secondaryActionButton, (!selectedCampaignId || !reportData) && styles.primaryButtonDisabled]}
                onPress={prepareReport}
                disabled={!selectedCampaignId || !reportData}
                activeOpacity={0.85}
              >
                <Text style={styles.secondaryActionText}>Éditer le rapport</Text>
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
                {generatingDirect ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Générer directement</Text>}
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, backgroundColor: theme.colors.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.colors.background },
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.md, paddingBottom: theme.spacing.xxl },
  title: { fontSize: 24, fontWeight: "800", color: theme.colors.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: theme.colors.textSecondary, marginBottom: theme.spacing.sm },
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
  errorCard: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  errorText: { color: theme.colors.error, fontSize: 14, marginBottom: theme.spacing.sm },
  retryButton: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.accent,
  },
  retryText: { color: theme.colors.accent, fontWeight: "600", fontSize: 14 },
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
  progressBlock: { marginTop: theme.spacing.md, marginBottom: theme.spacing.md },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  progressLabel: { color: theme.colors.textSecondary, fontSize: 13 },
  progressValue: { color: theme.colors.text, fontSize: 13, fontWeight: "700" },
  progressBar: {
    height: 8,
    backgroundColor: "rgba(0,0,0,0.08)",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: theme.colors.success, borderRadius: 4 },
  zonesPreview: { marginTop: theme.spacing.sm },
  zonesLabel: { color: theme.colors.textSecondary, fontSize: 12, marginBottom: 6 },
  zoneItem: { color: theme.colors.text, fontSize: 13, marginBottom: 2 },
  zoneMore: { color: theme.colors.textMuted, fontSize: 12, marginTop: 4 },
  actionsRow: { marginTop: theme.spacing.md, flexDirection: "row", gap: theme.spacing.sm },
  primaryActionButton: {
    flex: 1,
    backgroundColor: theme.colors.accent,
    paddingVertical: 14,
    borderRadius: theme.radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryActionButton: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 14,
    borderRadius: theme.radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryActionText: { color: theme.colors.text, fontWeight: "700", fontSize: 14 },
  primaryButtonDisabled: { opacity: 0.6 },
  primaryText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
