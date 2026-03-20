import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl, ScrollView } from "react-native";
import { getProjets, getProjetReport } from "../services/api";
import { theme } from "../theme";
import Button from "../components/Button";

export default function ManagerDashboardScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    activeCampaigns: 0,
    totalPanels: 0,
    completedPanels: 0,
  });

  const loadData = useCallback(async () => {
    try {
      setError("");
      const campaigns = await getProjets();
      const reports = await Promise.all(
        campaigns.map(async (campaign) => {
          try {
            return await getProjetReport(campaign.id);
          } catch (_error) {
            return null;
          }
        }),
      );

      const totalPanels = reports.reduce((acc, item) => acc + (item?.summary?.total || 0), 0);
      const completedPanels = reports.reduce((acc, item) => acc + (item?.summary?.completed || 0), 0);

      setStats({
        activeCampaigns: campaigns.length,
        totalPanels,
        completedPanels,
      });
    } catch (err) {
      setError(err.message || "Impossible de charger le dashboard.");
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

  const progress = stats.totalPanels > 0 ? Math.round((stats.completedPanels / stats.totalPanels) * 100) : 0;

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.accent} />}
    >
      <Text style={styles.title}>Dashboard</Text>
      {!!error && (
        <View style={styles.errorBlock}>
          <Text style={styles.error}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadData} activeOpacity={0.85}>
            <Text style={styles.retryText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      )}
      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.accent} style={styles.loader} />
      ) : (
        <>
          <View style={[styles.card, { backgroundColor: theme.colors.pastels.blue }]}>
            <Text style={styles.label}>Campagnes actives</Text>
            <Text style={styles.value}>{stats.activeCampaigns}</Text>
          </View>
          <View style={[styles.card, { backgroundColor: theme.colors.pastels.green }]}>
            <Text style={styles.label}>Progression globale</Text>
            <Text style={styles.value}>
              {stats.completedPanels} / {stats.totalPanels} panneaux
            </Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>{progress}%</Text>
          </View>
          <Button title="Créer une campagne" variant="primary" onPress={() => navigation.navigate("ManagerCreateCampaign")} style={styles.primaryButton} />
          <Button title="Voir les campagnes" variant="secondary" onPress={() => navigation.navigate("ManagerCampaigns")} style={styles.secondaryButton} />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
    flexGrow: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  card: {
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.md,
  },
  label: {
    color: theme.colors.textSecondary,
    fontWeight: "600",
    fontSize: 14,
    marginBottom: 6,
  },
  value: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: "800",
  },
  progressBar: {
    height: 8,
    backgroundColor: "rgba(0,0,0,0.1)",
    borderRadius: theme.radius.full,
    marginTop: 12,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.full,
  },
  progressText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    marginTop: 6,
  },
  primaryButton: {
    marginTop: theme.spacing.lg,
  },
  secondaryButton: {
    marginTop: theme.spacing.md,
  },
  errorBlock: { marginBottom: theme.spacing.md },
  error: {
    color: theme.colors.error,
    marginBottom: theme.spacing.sm,
    fontSize: 14,
  },
  retryButton: {
    alignSelf: "flex-start",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: theme.radius.md,
    borderWidth: 2,
    borderColor: theme.colors.accent,
  },
  retryText: { color: theme.colors.accent, fontWeight: "600", fontSize: 14 },
  loader: { marginTop: 48 },
});
