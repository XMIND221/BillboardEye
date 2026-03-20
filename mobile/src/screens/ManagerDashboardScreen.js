import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl, ScrollView } from "react-native";
import { getProjets, getProjetReport } from "../services/api";
import { theme } from "../theme";

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
      {!!error && <Text style={styles.error}>{error}</Text>}
      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.accent} style={styles.loader} />
      ) : (
        <>
          <View style={styles.card}>
            <Text style={styles.label}>Campagnes actives</Text>
            <Text style={styles.value}>{stats.activeCampaigns}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.label}>Progression globale</Text>
            <Text style={styles.value}>
              {stats.completedPanels} / {stats.totalPanels} panneaux
            </Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>{progress}%</Text>
          </View>
          <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate("ManagerCreateCampaign")} activeOpacity={0.85}>
            <Text style={styles.primaryText}>Créer une campagne</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate("ManagerCampaigns")} activeOpacity={0.85}>
            <Text style={styles.secondaryText}>Voir les campagnes</Text>
          </TouchableOpacity>
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
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
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
    height: 6,
    backgroundColor: "rgba(255,255,255,0.1)",
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
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.lg,
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  secondaryButton: {
    marginTop: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.accent,
    borderRadius: theme.radius.lg,
    paddingVertical: 16,
    alignItems: "center",
  },
  secondaryText: {
    color: theme.colors.accent,
    fontWeight: "700",
    fontSize: 16,
  },
  error: {
    color: theme.colors.error,
    marginBottom: theme.spacing.md,
    fontSize: 14,
  },
  loader: { marginTop: 48 },
});
