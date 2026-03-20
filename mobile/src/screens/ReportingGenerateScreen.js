import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from "react-native";

const REPORT_TEMPLATES = [
  { id: "1", name: "Begué", colors: ["#E0F2F1", "#2c7a7b", "#1A237E"] },
  { id: "2", name: "Classique", colors: ["#EFF6FF", "#2563EB", "#1E293B"] },
  { id: "3", name: "Élégant", colors: ["#FEF3C7", "#B91C1C", "#4C1D95"] },
  { id: "4", name: "Moderne", colors: ["#FFF7ED", "#EA580C", "#0F172A"] },
  { id: "5", name: "Précis", colors: ["#ECFDF5", "#059669", "#111827"] },
];
import { getProjets, getProjetPDFUrl, getProjetReport } from "../services/api";
import { theme } from "../theme";
import Button from "../components/Button";
import { getSelectedProject } from "../services/projectStorage";

const parseZones = (zoneStr) =>
  String(zoneStr || "")
    .split(/[;,/|]/)
    .map((z) => z.trim())
    .filter(Boolean);

export default function ReportingGenerateScreen({ navigation, route }) {
  const preselectedCampaignId = route.params?.preselectedCampaignId;
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState(preselectedCampaignId || "");
  const [selectedTemplateId, setSelectedTemplateId] = useState("1");
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadCampaigns = async () => {
    try {
      setError("");
      const result = await getProjets();
      setCampaigns(result);
      if (!selectedCampaignId && result.length > 0) {
        const selectedProject = await getSelectedProject();
        setSelectedCampaignId(selectedProject?.id || result[0].id);
      }
    } catch (err) {
      setError(err.message || "Impossible de charger les campagnes.");
    }
  };

  const loadReport = async () => {
    if (!selectedCampaignId) return;
    try {
      setLoadingReport(true);
      setError("");
      const report = await getProjetReport(selectedCampaignId);
      setReportData(report);
    } catch (err) {
      setError(err.message || "Impossible de charger les données.");
    } finally {
      setLoadingReport(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await loadCampaigns();
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (selectedCampaignId) {
      loadReport();
    } else {
      setReportData(null);
    }
  }, [selectedCampaignId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCampaigns();
    if (selectedCampaignId) await loadReport();
    setRefreshing(false);
  };

  const selectedCampaign = useMemo(
    () => campaigns.find((item) => item.id === selectedCampaignId) || null,
    [campaigns, selectedCampaignId],
  );

  const generatePdf = async () => {
    if (!selectedCampaignId) return;
    try {
      setGenerating(true);
      setError("");
      const result = await getProjetPDFUrl(selectedCampaignId, selectedTemplateId);
      navigation.navigate("ReportingPreview", {
        campaign: selectedCampaign,
        reportData,
        pdfUrl: result?.url || "",
      });
    } catch (err) {
      setError(err.message || "Génération PDF impossible.");
    } finally {
      setGenerating(false);
    }
  };

  const zones = parseZones(reportData?.projet?.zone);
  const total = reportData?.summary?.total ?? 0;
  const completed = reportData?.summary?.completed ?? 0;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.accent} />
      }
    >
      <Text style={styles.title}>Rapport PDF</Text>
      <Text style={styles.subtitle}>Sélectionnez une campagne et un template, puis générez le rapport</Text>

      <Text style={styles.label}>Template du rapport</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.templatesScroll}>
        {REPORT_TEMPLATES.map((t) => {
          const selected = t.id === selectedTemplateId;
          return (
            <TouchableOpacity
              key={t.id}
              style={[styles.templateCard, selected && styles.templateCardSelected]}
              onPress={() => setSelectedTemplateId(t.id)}
              activeOpacity={0.85}
            >
              <View style={styles.templateColors}>
                {t.colors.map((c, i) => (
                  <View key={i} style={[styles.templateColorDot, { backgroundColor: c }]} />
                ))}
              </View>
              <Text style={[styles.templateName, selected && styles.templateNameSelected]}>{t.name}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <TouchableOpacity
        style={styles.templatePreviewButton}
        onPress={() => navigation.navigate("ReportingTemplatePreview")}
        activeOpacity={0.85}
      >
        <Text style={styles.templatePreviewText}>Aperçu des pages</Text>
      </TouchableOpacity>

      {!!error && (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={async () => { await loadCampaigns(); if (selectedCampaignId) await loadReport(); }} activeOpacity={0.85}>
            <Text style={styles.retryText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      )}

      {campaigns.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Aucune campagne</Text>
          <Text style={styles.emptyText}>Créez une campagne dans le mode Gestionnaire pour générer des rapports.</Text>
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
                  onPress={() => setSelectedCampaignId(item.id)}
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
              <Text style={styles.loadingText}>Chargement des données...</Text>
            </View>
          ) : reportData ? (
            <View style={styles.summaryCard}>
              <Text style={styles.sectionTitle}>Résumé</Text>
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

          <TouchableOpacity
            style={[styles.primaryButton, (generating || !selectedCampaignId) && styles.primaryButtonDisabled]}
            onPress={generatePdf}
            disabled={generating || !selectedCampaignId}
            activeOpacity={0.85}
          >
            {generating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryText}>Générer le PDF</Text>
            )}
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.colors.background },
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.md, paddingBottom: theme.spacing.xxl },
  title: { fontSize: 24, fontWeight: "800", color: theme.colors.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: theme.colors.textSecondary, marginBottom: theme.spacing.sm },
  templatesScroll: { marginBottom: theme.spacing.sm },
  templateCard: {
    width: 100,
    padding: theme.spacing.md,
    marginRight: theme.spacing.sm,
    borderRadius: theme.radius.lg,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: "center",
  },
  templateCardSelected: { borderColor: theme.colors.accent, backgroundColor: theme.colors.primaryLight },
  templateColors: { flexDirection: "row", gap: 6, marginBottom: 8 },
  templateColorDot: { width: 20, height: 20, borderRadius: 10 },
  templateName: { fontSize: 13, fontWeight: "700", color: theme.colors.text },
  templateNameSelected: { color: theme.colors.accent },
  templatePreviewButton: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: theme.spacing.lg,
  },
  templatePreviewText: { color: theme.colors.textMuted, fontWeight: "600", fontSize: 13 },
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
    backgroundColor: theme.colors.primaryLight,
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
  primaryButton: { marginTop: theme.spacing.md },
  primaryButtonDisabled: { opacity: 0.6 },
});
