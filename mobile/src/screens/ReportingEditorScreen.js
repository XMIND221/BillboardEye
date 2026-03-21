import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Switch, ActivityIndicator } from "react-native";
import { theme } from "../theme";
import { previewProjetPDF } from "../services/api";

export default function ReportingEditorScreen({ route, navigation }) {
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
  const [panelOverrides, setPanelOverrides] = useState(
    (reportData?.panneaux || []).map((p) => ({
      id: p.id,
      enabled: true,
      observationsFaceA: p.observationsFaceA || "",
      observationsFaceB: p.observationsFaceB || "",
      label: p.localisation?.adresse || "Zone",
      zoneName: p.localisation?.adresse || "",
      latitude: p.localisation?.latitude != null ? String(p.localisation.latitude) : "",
      longitude: p.localisation?.longitude != null ? String(p.localisation.longitude) : "",
    })),
  );

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

  const onPreview = async () => {
    if (!campaign?.id) return;
    setSaving(true);
    setError("");
    try {
      const payload = {
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
      const result = await previewProjetPDF(campaign.id, payload);
      navigation.navigate("ReportingPreview", {
        campaign: { ...campaign, entreprise },
        reportData: {
          ...reportData,
          projet: { ...(reportData?.projet || {}), titreRapport, entreprise, duree, date, zone, assignedAgent, instructions },
          panneaux: panelOverrides.filter((p) => p.enabled).map((p) => {
            const original = (reportData?.panneaux || []).find((x) => x.id === p.id) || {};
            return {
              ...original,
              localisation: { ...(original.localisation || {}), adresse: p.zoneName, latitude: p.latitude ? Number(p.latitude) : original.localisation?.latitude, longitude: p.longitude ? Number(p.longitude) : original.localisation?.longitude },
              observationsFaceA: p.observationsFaceA,
              observationsFaceB: p.observationsFaceB,
            };
          }),
          summary: { ...(reportData?.summary || {}), total: enabledCount },
        },
        pdfUrl: result?.url || "",
        editorPayload: payload,
      });
    } catch (err) {
      setError(err.message || "Impossible de générer l'aperçu.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Éditer le rapport</Text>
      <Text style={styles.subtitle}>
        Chaque champ correspond au contenu du PDF (couverture, résumé, photo pleine page, zones).
      </Text>

      {!!error && (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.blockTitle}>Couverture</Text>
        <Text style={styles.label}>Titre affiché (grand titre)</Text>
        <TextInput style={styles.input} value={titreRapport} onChangeText={setTitreRapport} />
        <Text style={styles.label}>Client (« Client : … » sur le PDF)</Text>
        <TextInput style={styles.input} value={entreprise} onChangeText={setEntreprise} />
        <Text style={styles.label}>Zone / périmètre (sous le client, optionnel)</Text>
        <TextInput style={styles.input} value={zone} onChangeText={setZone} placeholder="Ex. Île-de-France" />
        <Text style={styles.label}>Date de campagne</Text>
        <TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />
      </View>

      <View style={styles.card}>
        <Text style={styles.blockTitle}>Résumé (page statistiques)</Text>
        <Text style={styles.label}>Durée affichée sur les cartes « durée de campagne »</Text>
        <TextInput style={styles.input} value={duree} onChangeText={setDuree} placeholder="Ex. 3 mois" />
        <Text style={styles.label}>Consignes & note (bloc texte sous les chiffres)</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={instructions}
          onChangeText={setInstructions}
          multiline
          placeholder="Texte libre visible dans la section Résumé"
        />
        <Text style={styles.label}>Légende sous la carte illustrative du résumé</Text>
        <TextInput
          style={styles.input}
          value={legendeCarte}
          onChangeText={setLegendeCarte}
          placeholder="Par défaut : Distribution géographique des panneaux"
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.blockTitle}>Grande photo (avant le pied de page)</Text>
        <Text style={styles.label}>Légende sur la photo pleine largeur</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={legendeVisuelle}
          onChangeText={setLegendeVisuelle}
          multiline
          placeholder="Texte en bas de la grande image"
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.blockTitle}>Métadonnées</Text>
        <Text style={styles.label}>Agent assigné (tableau résumé / suivi)</Text>
        <TextInput style={styles.input} value={assignedAgent} onChangeText={setAssignedAgent} />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Panneaux inclus ({enabledCount})</Text>
        {panelOverrides.slice(0, visibleCount).map((p) => (
          <View key={p.id} style={styles.panelRow}>
            <View style={styles.panelHeader}>
              <Text style={styles.panelLabel} numberOfLines={1}>{p.label}</Text>
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
            />
            <View style={styles.gpsRow}>
              <TextInput
                style={[styles.input, styles.smallInput, styles.gpsInput]}
                value={p.latitude}
                onChangeText={(v) => updatePanel(p.id, { latitude: v })}
                placeholder="Latitude"
              />
              <TextInput
                style={[styles.input, styles.smallInput, styles.gpsInput]}
                value={p.longitude}
                onChangeText={(v) => updatePanel(p.id, { longitude: v })}
                placeholder="Longitude"
              />
            </View>
            <TextInput
              style={[styles.input, styles.smallInput]}
              value={p.observationsFaceA}
              onChangeText={(v) => updatePanel(p.id, { observationsFaceA: v })}
              placeholder="Observation Face A"
            />
            <TextInput
              style={[styles.input, styles.smallInput]}
              value={p.observationsFaceB}
              onChangeText={(v) => updatePanel(p.id, { observationsFaceB: v })}
              placeholder="Observation Face B"
            />
          </View>
        ))}
        {visibleCount < panelOverrides.length && (
          <TouchableOpacity style={styles.loadMoreButton} onPress={() => setVisibleCount((v) => v + 20)} activeOpacity={0.85}>
            <Text style={styles.loadMoreText}>Afficher 20 panneaux de plus</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity style={[styles.primaryButton, saving && styles.primaryButtonDisabled]} onPress={onPreview} disabled={saving} activeOpacity={0.85}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Aperçu avant téléchargement</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.md, paddingBottom: theme.spacing.xxl },
  title: { fontSize: 24, fontWeight: "800", color: theme.colors.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: theme.colors.textSecondary, marginBottom: theme.spacing.md },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  label: { fontSize: 13, color: theme.colors.textSecondary, marginBottom: 6, marginTop: 6 },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: theme.colors.text,
  },
  textarea: { minHeight: 86, textAlignVertical: "top" },
  blockTitle: { fontSize: 15, fontWeight: "800", color: theme.colors.accent, marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: theme.colors.text, marginBottom: 6 },
  hint: { fontSize: 12, color: theme.colors.textSecondary, marginBottom: 10 },
  panelRow: { borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 10, marginTop: 10 },
  panelHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  moveRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  moveButton: { paddingVertical: 6, paddingHorizontal: 10, borderWidth: 1, borderColor: theme.colors.accent, borderRadius: theme.radius.md },
  moveButtonText: { color: theme.colors.accent, fontSize: 12, fontWeight: "700" },
  gpsRow: { flexDirection: "row", gap: 8 },
  gpsInput: { flex: 1 },
  panelLabel: { flex: 1, marginRight: 8, color: theme.colors.text, fontWeight: "600" },
  smallInput: { marginBottom: 8 },
  primaryButton: { marginTop: theme.spacing.md, backgroundColor: theme.colors.accent, paddingVertical: 14, borderRadius: theme.radius.lg, alignItems: "center" },
  primaryButtonDisabled: { opacity: 0.6 },
  primaryText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  errorCard: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  errorText: { color: theme.colors.error, fontSize: 14 },
  loadMoreButton: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingVertical: 10,
    alignItems: "center",
  },
  loadMoreText: { color: theme.colors.textSecondary, fontWeight: "700" },
});
