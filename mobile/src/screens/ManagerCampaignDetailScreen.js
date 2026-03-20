import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { theme } from "../theme";
import { getProjetReport } from "../services/api";
import { parseZones } from "../services/missionStorage";
import { getCampaignConfig } from "../services/campaignConfigStorage";

export default function ManagerCampaignDetailScreen({ route }) {
  const campaign = route.params?.campaign;
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [config, setConfig] = useState(null);
  const [error, setError] = useState("");

  const zones = useMemo(() => parseZones(campaign?.zone), [campaign?.zone]);

  const loadData = useCallback(async () => {
    if (!campaign?.id) {
      setError("Campagne introuvable.");
      return;
    }
    try {
      setError("");
      const [reportData, configData] = await Promise.all([
        getProjetReport(campaign.id),
        getCampaignConfig(campaign.id),
      ]);
      setReport(reportData);
      setConfig(configData);
    } catch (err) {
      setError(err.message || "Impossible de charger le detail.");
    } finally {
      setLoading(false);
    }
  }, [campaign?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
      <Text style={styles.meta}>Client: {campaign?.entreprise || "-"}</Text>
      <Text style={styles.meta}>Zones: {zones.length}</Text>
      <Text style={styles.meta}>Agent assigne: {campaign?.assignedAgent || "-"}</Text>
      {!!error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Progression</Text>
        <Text style={styles.meta}>
          {report?.summary?.completed || 0} / {report?.summary?.total || 0} panneaux completes
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
        <Text style={styles.meta}>Titre: {campaign?.titreRapport || config?.reportTitle || "-"}</Text>
        <Text style={styles.meta}>Couleur: {campaign?.couleurPrincipale || config?.primaryColor || "#2563EB"}</Text>
        <Text style={styles.meta}>Duree: {campaign?.duree || config?.duration || "-"}</Text>
        <Text style={styles.meta}>Instructions: {campaign?.instructions || config?.instructions || "-"}</Text>
      </View>
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
  container: { padding: theme.spacing.md, backgroundColor: theme.colors.background },
  title: { fontSize: 22, color: theme.colors.text, fontWeight: "800", marginBottom: 6 },
  meta: { color: theme.colors.textSecondary, marginBottom: 4, fontSize: 14 },
  card: {
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginTop: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sectionTitle: { color: theme.colors.text, fontWeight: "700", marginBottom: theme.spacing.sm },
  error: { color: theme.colors.error, marginTop: 6, fontSize: 14 },
});
