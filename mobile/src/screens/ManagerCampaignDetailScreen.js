import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
  Share,
  Modal,
  TextInput,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../theme";
import { getProjetReport, getProjetPDFUrl, updateProjet } from "../services/api";
import { parseZones } from "../services/missionStorage";
import { getCampaignConfig } from "../services/campaignConfigStorage";
import { useToast } from "../contexts/ToastContext";
import { useFocusRefresh } from "../hooks/useFocusRefresh";

export default function ManagerCampaignDetailScreen({ route, navigation }) {
  const { showToast } = useToast();
  const initialCampaign = route.params?.campaign;
  const [campaign, setCampaign] = useState(initialCampaign);
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [config, setConfig] = useState(null);
  const [error, setError] = useState("");
  const [exportingPdf, setExportingPdf] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignDraft, setAssignDraft] = useState(initialCampaign?.assignedAgent || "");
  const [savingAgent, setSavingAgent] = useState(false);

  useEffect(() => {
    setCampaign(initialCampaign);
    setAssignDraft(initialCampaign?.assignedAgent || "");
  }, [initialCampaign?.id]);

  const zones = useMemo(() => parseZones(campaign?.zone), [campaign?.zone]);

  const exportPdf = useCallback(async () => {
    if (!campaign?.id) return;
    try {
      setExportingPdf(true);
      const result = await getProjetPDFUrl(campaign.id);
      if (result?.url) {
        await Linking.openURL(result.url);
        showToast("Rapport généré — ouverture du PDF");
      } else {
        showToast("PDF non disponible", "error");
      }
    } catch (e) {
      showToast(e.message || "Téléchargement impossible", "error");
    } finally {
      setExportingPdf(false);
    }
  }, [campaign?.id, showToast]);

  const sharePdf = useCallback(async () => {
    if (!campaign?.id) return;
    try {
      setExportingPdf(true);
      const result = await getProjetPDFUrl(campaign.id);
      const url = result?.url || "";
      if (!url) {
        showToast("PDF non disponible", "error");
        return;
      }
      await Share.share({
        title: `Rapport — ${campaign.nom}`,
        message: `Rapport BillboardEye — ${campaign.nom}\n${url}`,
        url,
      });
      showToast("Partage du rapport");
    } catch (e) {
      if (String(e?.message || "").includes("did not share")) return;
      showToast("Partage impossible", "error");
    } finally {
      setExportingPdf(false);
    }
  }, [campaign?.id, campaign?.nom, showToast]);

  const loadData = useCallback(async () => {
    if (!campaign?.id) {
      setError("Campagne introuvable.");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setError("");
      const [reportData, configData] = await Promise.all([
        getProjetReport(campaign.id),
        getCampaignConfig(campaign.id),
      ]);
      setReport(reportData);
      setConfig(configData);
    } catch (err) {
      setError(err.message || "Impossible de charger le détail.");
    } finally {
      setLoading(false);
    }
  }, [campaign?.id]);

  const runFocusRefresh = useFocusRefresh(navigation, loadData, {
    minIntervalMs: 15000,
    runOnMount: true,
  });

  const saveAgent = async () => {
    if (!campaign?.id) return;
    try {
      setSavingAgent(true);
      const updated = await updateProjet(campaign.id, { assignedAgent: assignDraft.trim() });
      const next = { ...campaign, ...updated };
      setCampaign(next);
      navigation.setParams({ campaign: next });
      showToast("Agent assigné");
      setAssignOpen(false);
      await runFocusRefresh(true);
    } catch (e) {
      showToast(e.message || "Enregistrement impossible", "error");
    } finally {
      setSavingAgent(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{campaign?.nom || "Campagne"}</Text>
      <Text style={styles.meta}>Client : {campaign?.entreprise || "-"}</Text>
      <Text style={styles.meta}>Zones : {zones.length}</Text>
      <Text style={styles.meta}>Agent assigné : {campaign?.assignedAgent || "—"}</Text>
      {!!error && (
        <View style={styles.errorBlock}>
          <Text style={styles.error}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => runFocusRefresh(true)} activeOpacity={0.85}>
            <Text style={styles.retryText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={styles.assignRow} onPress={() => setAssignOpen(true)} activeOpacity={0.88}>
        <Ionicons name="person-add-outline" size={20} color={theme.colors.primary} />
        <Text style={styles.assignRowText}>Assigner ou modifier l’agent</Text>
        <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.editCampaignBtn}
        onPress={() => navigation.navigate("ManagerCreateCampaign", { editCampaign: campaign })}
        activeOpacity={0.88}
      >
        <Ionicons name="create-outline" size={20} color={theme.colors.primary} />
        <Text style={styles.editCampaignText}>Modifier la campagne</Text>
      </TouchableOpacity>

      <View style={styles.pdfRow}>
        <TouchableOpacity
          style={[styles.pdfBtn, styles.pdfBtnPrimary, exportingPdf && styles.exportButtonDisabled]}
          onPress={exportPdf}
          disabled={exportingPdf}
          activeOpacity={0.85}
        >
          <Ionicons name="download-outline" size={20} color="#fff" />
          <Text style={styles.pdfBtnPrimaryText}>Télécharger PDF</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.pdfBtn, styles.pdfBtnOutline, exportingPdf && styles.exportButtonDisabled]}
          onPress={sharePdf}
          disabled={exportingPdf}
          activeOpacity={0.85}
        >
          <Ionicons name="share-outline" size={20} color={theme.colors.primary} />
          <Text style={styles.pdfBtnOutlineText}>Partager rapport</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Progression</Text>
        <Text style={styles.meta}>
          {report?.summary?.completed || 0} / {report?.summary?.total || 0} panneaux complétés
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Liste zones</Text>
        {zones.length === 0 ? (
          <Text style={styles.meta}>Aucune zone</Text>
        ) : (
          zones.map((zone) => (
            <Text key={zone} style={styles.meta}>
              - {zone}
            </Text>
          ))
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Branding rapport</Text>
        <Text style={styles.meta}>Titre : {campaign?.titreRapport || config?.reportTitle || "-"}</Text>
        <Text style={styles.meta}>Couleur : {campaign?.couleurPrincipale || config?.primaryColor || "#2563EB"}</Text>
        <Text style={styles.meta}>Durée : {campaign?.duree || config?.duration || "-"}</Text>
        <Text style={styles.meta}>Instructions : {campaign?.instructions || config?.instructions || "-"}</Text>
      </View>

      <Modal visible={assignOpen} transparent animationType="fade" onRequestClose={() => setAssignOpen(false)}>
        <Pressable style={styles.modalBg} onPress={() => setAssignOpen(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Agent terrain</Text>
            <Text style={styles.modalHint}>Email ou identifiant (même valeur que sur la fiche campagne)</Text>
            <TextInput
              style={styles.modalInput}
              value={assignDraft}
              onChangeText={setAssignDraft}
              placeholder="ex: agent@entreprise.com"
              placeholderTextColor={theme.colors.textMuted}
              autoCapitalize="none"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalGhost} onPress={() => setAssignOpen(false)}>
                <Text style={styles.modalGhostText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalPrimary, savingAgent && { opacity: 0.6 }]}
                onPress={saveAgent}
                disabled={savingAgent}
              >
                <Text style={styles.modalPrimaryText}>{savingAgent ? "…" : "Enregistrer"}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.background,
  },
  container: { padding: theme.spacing.md, backgroundColor: theme.colors.background, paddingBottom: theme.spacing.xxl },
  title: { fontSize: 22, color: theme.colors.text, fontWeight: "800", marginBottom: 6 },
  meta: { color: theme.colors.textSecondary, marginBottom: 4, fontSize: 14 },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginTop: theme.spacing.md,
    ...theme.shadows.sm,
  },
  sectionTitle: { color: theme.colors.text, fontWeight: "700", marginBottom: theme.spacing.sm },
  errorBlock: { marginBottom: theme.spacing.md },
  error: { color: theme.colors.error, marginTop: 6, marginBottom: theme.spacing.sm, fontSize: 14 },
  retryButton: {
    alignSelf: "flex-start",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: theme.radius.md,
    borderWidth: 2,
    borderColor: theme.colors.accent,
  },
  retryText: { color: theme.colors.accent, fontWeight: "600", fontSize: 14 },
  assignRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: theme.spacing.md,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  assignRowText: { flex: 1, fontWeight: "700", color: theme.colors.text, fontSize: 15 },
  editCampaignBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: theme.spacing.sm,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surface,
  },
  editCampaignText: { color: theme.colors.primary, fontWeight: "800", fontSize: 15 },
  pdfRow: { flexDirection: "row", gap: theme.spacing.sm, marginTop: theme.spacing.md },
  pdfBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: theme.radius.lg,
  },
  pdfBtnPrimary: { backgroundColor: theme.colors.accent },
  pdfBtnPrimaryText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  pdfBtnOutline: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  pdfBtnOutlineText: { color: theme.colors.primary, fontWeight: "800", fontSize: 14 },
  exportButtonDisabled: { opacity: 0.65 },
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: theme.spacing.lg,
  },
  modalCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalTitle: { fontSize: 18, fontWeight: "800", color: theme.colors.text, marginBottom: 8 },
  modalHint: { fontSize: 13, color: theme.colors.textMuted, marginBottom: theme.spacing.md },
  modalInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: theme.spacing.sm },
  modalGhost: { paddingVertical: 12, paddingHorizontal: 16 },
  modalGhostText: { fontWeight: "700", color: theme.colors.textSecondary },
  modalPrimary: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: theme.radius.md,
  },
  modalPrimaryText: { color: "#fff", fontWeight: "800" },
});
