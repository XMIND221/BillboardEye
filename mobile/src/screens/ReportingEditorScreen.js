import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../theme";
import { previewProjetPDF } from "../services/api";
import { MANAGER_REPORT_SCREENS } from "../navigation/reportScreens";
import AccordionCard from "../components/manager/AccordionCard";
import { useToast } from "../contexts/ToastContext";

const buildPanelOverrides = (reportData) =>
  (reportData?.panneaux || []).map((p) => ({
    id: p.id,
    enabled: true,
    observationsFaceA: p.observationsFaceA || "",
    observationsFaceB: p.observationsFaceB || "",
    label: p.localisation?.adresse || "Zone",
    zoneName: p.localisation?.adresse || "",
    latitude: p.localisation?.latitude != null ? String(p.localisation.latitude) : "",
    longitude: p.localisation?.longitude != null ? String(p.localisation.longitude) : "",
  }));

function buildOverridesPayload({
  titreRapport,
  entreprise,
  duree,
  date,
  zone,
  assignedAgent,
  instructions,
  legendeVisuelle,
  legendeCarte,
  panelOverrides,
}) {
  return {
    overrides: {
      titreRapport,
      entreprise,
      duree,
      date,
      zone,
      assignedAgent,
      instructions,
      legendeVisuelle,
      legendeCarte,
      panneaux: panelOverrides.map((p, index) => ({
        id: p.id,
        enabled: p.enabled,
        order: index,
        zoneName: p.zoneName,
        latitude: p.latitude,
        longitude: p.longitude,
        observationsFaceA: p.observationsFaceA,
        observationsFaceB: p.observationsFaceB,
      })),
    },
  };
}

export default function ReportingEditorScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const reportScreens = route.params?.reportScreens || MANAGER_REPORT_SCREENS;
  const campaign = route.params?.campaign || null;
  const reportData = route.params?.reportData || null;

  const [titreRapport, setTitreRapport] = useState(reportData?.projet?.titreRapport || reportData?.projet?.nom || "");
  const [entreprise, setEntreprise] = useState(reportData?.projet?.entreprise || "");
  const [duree, setDuree] = useState(reportData?.projet?.duree || "");
  const [date, setDate] = useState(reportData?.projet?.date ? String(reportData.projet.date).slice(0, 10) : "");
  const [zone, setZone] = useState(reportData?.projet?.zone || "");
  const [assignedAgent, setAssignedAgent] = useState(reportData?.projet?.assignedAgent || "");
  const [instructions, setInstructions] = useState(reportData?.projet?.instructions || "");
  const [legendeVisuelle, setLegendeVisuelle] = useState(reportData?.projet?.legendeVisuelle || "");
  const [legendeCarte, setLegendeCarte] = useState(reportData?.projet?.legendeCarte || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [visibleCount, setVisibleCount] = useState(20);
  const [panelOverrides, setPanelOverrides] = useState(() => buildPanelOverrides(reportData));
  const [lastPreviewUrl, setLastPreviewUrl] = useState("");

  useEffect(() => {
    if (!campaign?.id || !reportData) return;
    setTitreRapport(reportData?.projet?.titreRapport || reportData?.projet?.nom || "");
    setEntreprise(reportData?.projet?.entreprise || "");
    setDuree(reportData?.projet?.duree || "");
    setDate(reportData?.projet?.date ? String(reportData.projet.date).slice(0, 10) : "");
    setZone(reportData?.projet?.zone || "");
    setAssignedAgent(reportData?.projet?.assignedAgent || "");
    setInstructions(reportData?.projet?.instructions || "");
    setLegendeVisuelle(reportData?.projet?.legendeVisuelle || "");
    setLegendeCarte(reportData?.projet?.legendeCarte || "");
    setPanelOverrides(buildPanelOverrides(reportData));
    setVisibleCount(20);
    setError("");
    setLastPreviewUrl("");
  }, [campaign?.id]);

  const enabledCount = useMemo(() => panelOverrides.filter((p) => p.enabled).length, [panelOverrides]);

  const updatePanel = (id, patch) => {
    setPanelOverrides((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  const movePanel = (id, direction) => {
    setPanelOverrides((prev) => {
      const idx = prev.findIndex((p) => p.id === id);
      if (idx < 0) return prev;
      const target = direction === "up" ? idx - 1 : idx + 1;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      const tmp = next[idx];
      next[idx] = next[target];
      next[target] = tmp;
      return next;
    });
  };

  const previewPayload = useCallback(() => {
    return buildOverridesPayload({
      titreRapport,
      entreprise,
      duree,
      date,
      zone,
      assignedAgent,
      instructions,
      legendeVisuelle,
      legendeCarte,
      panelOverrides,
    });
  }, [
    titreRapport,
    entreprise,
    duree,
    date,
    zone,
    assignedAgent,
    instructions,
    legendeVisuelle,
    legendeCarte,
    panelOverrides,
  ]);

  const runPreview = async () => {
    if (!campaign?.id) return;
    setSaving(true);
    setError("");
    try {
      const payload = previewPayload();
      const result = await previewProjetPDF(campaign.id, payload);
      const url = result?.url || "";
      setLastPreviewUrl(url);
      if (url) {
        showToast("Aperçu PDF prêt");
      }
      navigation.navigate(reportScreens.Preview, {
        campaign: { ...campaign, entreprise },
        reportData: {
          ...reportData,
          projet: {
            ...(reportData?.projet || {}),
            titreRapport,
            entreprise,
            duree,
            date,
            zone,
            assignedAgent,
            instructions,
            legendeVisuelle,
            legendeCarte,
          },
          panneaux: panelOverrides
            .filter((p) => p.enabled)
            .map((p) => {
              const original = (reportData?.panneaux || []).find((x) => x.id === p.id) || {};
              return {
                ...original,
                localisation: {
                  ...(original.localisation || {}),
                  adresse: p.zoneName,
                  latitude: p.latitude ? Number(p.latitude) : original.localisation?.latitude,
                  longitude: p.longitude ? Number(p.longitude) : original.localisation?.longitude,
                },
                observationsFaceA: p.observationsFaceA,
                observationsFaceB: p.observationsFaceB,
              };
            }),
          summary: { ...(reportData?.summary || {}), total: enabledCount },
        },
        pdfUrl: url,
        editorPayload: payload,
        reportScreens,
      });
    } catch (err) {
      setError(err.message || "Impossible de générer l’aperçu.");
      showToast("Aperçu impossible", "error");
    } finally {
      setSaving(false);
    }
  };

  const openLastPreview = async () => {
    if (!lastPreviewUrl) return;
    try {
      await Linking.openURL(lastPreviewUrl);
    } catch {
      showToast("Ouverture du lien impossible", "error");
    }
  };

  const inputProps = {
    placeholderTextColor: theme.colors.textMuted,
  };

  return (
    <View style={styles.root}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Personnaliser le rapport</Text>
        <Text style={styles.campaignBadge}>
          {campaign?.nom || "Campagne"} · {campaign?.entreprise || ""}
        </Text>
        <Text style={styles.subtitle}>Modifiez les blocs ci-dessous puis lancez un aperçu PDF (sans finaliser).</Text>

        {!!error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <AccordionCard title="Couverture" subtitle="Titre, client, zone, date" defaultOpen>
          <Text style={styles.label}>Titre affiché (grand titre) *</Text>
          <TextInput
            style={styles.input}
            value={titreRapport}
            onChangeText={setTitreRapport}
            placeholder="Ex. Rapport d’affichage — Janvier 2025"
            {...inputProps}
          />
          <Text style={styles.label}>Client (« Client : … »)</Text>
          <TextInput
            style={styles.input}
            value={entreprise}
            onChangeText={setEntreprise}
            placeholder="Nom affiché sur la couverture"
            {...inputProps}
          />
          <Text style={styles.label}>Zone / périmètre</Text>
          <TextInput style={styles.input} value={zone} onChangeText={setZone} placeholder="Ex. Île-de-France" {...inputProps} />
          <Text style={styles.label}>Date de campagne</Text>
          <TextInput
            style={styles.input}
            value={date}
            onChangeText={setDate}
            placeholder="AAAA-MM-JJ"
            autoCapitalize="none"
            {...inputProps}
          />
        </AccordionCard>

        <AccordionCard title="Résumé" subtitle="Durée, consignes, légende carte">
          <Text style={styles.label}>Durée (cartes « durée de campagne »)</Text>
          <TextInput style={styles.input} value={duree} onChangeText={setDuree} placeholder="Ex. 3 mois, 15 jours" {...inputProps} />
          <Text style={styles.label}>Consignes & note (sous les chiffres)</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={instructions}
            onChangeText={setInstructions}
            multiline
            placeholder="Texte libre visible dans la page Résumé"
            {...inputProps}
          />
          <Text style={styles.label}>Légende sous la carte du résumé</Text>
          <TextInput
            style={styles.input}
            value={legendeCarte}
            onChangeText={setLegendeCarte}
            placeholder="Par défaut : distribution géographique des panneaux"
            {...inputProps}
          />
        </AccordionCard>

        <AccordionCard title="Grande photo" subtitle="Légende pleine page">
          <Text style={styles.label}>Légende sous la photo</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={legendeVisuelle}
            onChangeText={setLegendeVisuelle}
            multiline
            placeholder="Texte en bas de la grande image"
            {...inputProps}
          />
        </AccordionCard>

        <AccordionCard title="Métadonnées" subtitle="Suivi & tableau">
          <Text style={styles.label}>Agent assigné</Text>
          <TextInput
            style={styles.input}
            value={assignedAgent}
            onChangeText={setAssignedAgent}
            placeholder="Email ou identifiant"
            autoCapitalize="none"
            {...inputProps}
          />
        </AccordionCard>

        <AccordionCard title={`Panneaux inclus (${enabledCount})`} subtitle="Ordre, libellés, observations">
          {panelOverrides.slice(0, visibleCount).map((p) => (
            <View key={p.id} style={styles.panelRow}>
              <View style={styles.panelHeader}>
                <Text style={styles.panelLabel} numberOfLines={1}>
                  {p.label}
                </Text>
                <Switch value={p.enabled} onValueChange={(v) => updatePanel(p.id, { enabled: v })} />
              </View>
              <View style={styles.moveRow}>
                <TouchableOpacity style={styles.moveButton} onPress={() => movePanel(p.id, "up")} activeOpacity={0.85}>
                  <Text style={styles.moveButtonText}>Monter</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.moveButton} onPress={() => movePanel(p.id, "down")} activeOpacity={0.85}>
                  <Text style={styles.moveButtonText}>Descendre</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={[styles.input, styles.smallInput]}
                value={p.zoneName}
                onChangeText={(v) => updatePanel(p.id, { zoneName: v, label: v || "Zone" })}
                placeholder="Nom de zone affiché"
                {...inputProps}
              />
              <View style={styles.gpsRow}>
                <TextInput
                  style={[styles.input, styles.smallInput, styles.gpsInput]}
                  value={p.latitude}
                  onChangeText={(v) => updatePanel(p.id, { latitude: v })}
                  placeholder="Latitude"
                  {...inputProps}
                />
                <TextInput
                  style={[styles.input, styles.smallInput, styles.gpsInput]}
                  value={p.longitude}
                  onChangeText={(v) => updatePanel(p.id, { longitude: v })}
                  placeholder="Longitude"
                  {...inputProps}
                />
              </View>
              <TextInput
                style={[styles.input, styles.smallInput]}
                value={p.observationsFaceA}
                onChangeText={(v) => updatePanel(p.id, { observationsFaceA: v })}
                placeholder="Observation Face A"
                {...inputProps}
              />
              <TextInput
                style={[styles.input, styles.smallInput]}
                value={p.observationsFaceB}
                onChangeText={(v) => updatePanel(p.id, { observationsFaceB: v })}
                placeholder="Observation Face B"
                {...inputProps}
              />
            </View>
          ))}
          {visibleCount < panelOverrides.length && (
            <TouchableOpacity style={styles.loadMoreButton} onPress={() => setVisibleCount((v) => v + 20)} activeOpacity={0.85}>
              <Text style={styles.loadMoreText}>Afficher 20 panneaux de plus</Text>
            </TouchableOpacity>
          )}
        </AccordionCard>

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        {!!lastPreviewUrl && (
          <TouchableOpacity style={styles.previewLinkRow} onPress={openLastPreview} activeOpacity={0.85}>
            <Ionicons name="document-text-outline" size={20} color={theme.colors.accent} />
            <Text style={styles.previewLinkText}>Rouvrir le dernier aperçu PDF</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={[styles.primaryButton, saving && styles.primaryButtonDisabled]} onPress={runPreview} disabled={saving} activeOpacity={0.85}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Aperçu PDF</Text>}
        </TouchableOpacity>
        <Text style={styles.footerHint}>Le PDF se met à jour à chaque aperçu — vérifiez avant la génération finale.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { flex: 1 },
  content: { padding: theme.spacing.lg, paddingBottom: theme.spacing.md },
  title: { fontSize: 24, fontWeight: "800", color: theme.colors.text, marginBottom: 4 },
  campaignBadge: { fontSize: 14, fontWeight: "700", color: theme.colors.accent, marginBottom: 8 },
  subtitle: { fontSize: 14, color: theme.colors.textSecondary, marginBottom: theme.spacing.md, lineHeight: 20 },
  label: { fontSize: 13, fontWeight: "700", color: theme.colors.textSecondary, marginBottom: 6, marginTop: 10 },
  input: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.colors.text,
  },
  textarea: { minHeight: 88, textAlignVertical: "top", paddingTop: 12 },
  panelRow: { borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 12, marginTop: 12 },
  panelHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  moveRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  moveButton: { paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: theme.colors.accent, borderRadius: theme.radius.md },
  moveButtonText: { color: theme.colors.accent, fontSize: 12, fontWeight: "800" },
  gpsRow: { flexDirection: "row", gap: 8 },
  gpsInput: { flex: 1 },
  panelLabel: { flex: 1, marginRight: 8, color: theme.colors.text, fontWeight: "700" },
  smallInput: { marginBottom: 8 },
  primaryButton: {
    backgroundColor: theme.colors.accent,
    paddingVertical: 16,
    borderRadius: theme.radius.lg,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
  },
  primaryButtonDisabled: { opacity: 0.6 },
  primaryText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  errorCard: {
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.25)",
  },
  errorText: { color: theme.colors.error, fontSize: 14, fontWeight: "600" },
  loadMoreButton: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingVertical: 12,
    alignItems: "center",
  },
  loadMoreText: { color: theme.colors.textSecondary, fontWeight: "800", fontSize: 14 },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  previewLinkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: theme.spacing.sm,
    paddingVertical: 8,
  },
  previewLinkText: { color: theme.colors.accent, fontWeight: "800", fontSize: 14 },
  footerHint: { marginTop: 10, fontSize: 11, color: theme.colors.textMuted, textAlign: "center", lineHeight: 15 },
});
