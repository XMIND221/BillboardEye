import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl, ScrollView } from "react-native";
import { getProjets, getPanneaux } from "../services/api";
import { theme } from "../theme";
import Button from "../components/Button";
import AppHeader from "../components/AppHeader";

export default function ManagerDashboardScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    activeCampaigns: 0,
    totalPanels: 0,
  });

  const loadData = useCallback(async () => {
    try {
      setError("");
      const [campaigns, panneaux] = await Promise.all([getProjets(), getPanneaux()]);
      const visibleProjetIds = new Set((campaigns || []).map((c) => c.id));
      const scoped = (panneaux || []).filter((p) => p.projetId && visibleProjetIds.has(p.projetId));
      setStats({
        activeCampaigns: campaigns.length,
        totalPanels: scoped.length,
      });
    } catch (err) {
      setError(err.message || "Impossible de charger le dashboard.");
    }
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      (async () => {
        setLoading(true);
        await loadData();
        setLoading(false);
      })();
    });
    return unsubscribe;
  }, [loadData, navigation]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  return (
    <View style={styles.root}>
      <AppHeader />
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
        <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
      ) : (
        <>
          <View style={[styles.card, { backgroundColor: theme.colors.pastels.blue }]}>
            <Text style={styles.label}>Campagnes actives</Text>
            <Text style={styles.value}>{stats.activeCampaigns}</Text>
          </View>
          <View style={[styles.card, { backgroundColor: theme.colors.pastels.green }]}>
            <Text style={styles.label}>Panneaux enregistrés</Text>
            <Text style={styles.value}>{stats.totalPanels}</Text>
            <Text style={styles.hint}>Sur vos campagnes visibles. Détail Face A/B : onglet Rapports.</Text>
          </View>
          <Button
            title="Créer une campagne"
            variant="primary"
            onPress={() => navigation.navigate("ManagerCampaignsTab", { screen: "ManagerCreateCampaign" })}
            style={styles.primaryButton}
          />
          <Button
            title="Voir les campagnes"
            variant="secondary"
            onPress={() => navigation.navigate("ManagerCampaignsTab", { screen: "ManagerCampaigns" })}
            style={styles.secondaryButton}
          />
        </>
      )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
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
  hint: { color: theme.colors.textSecondary, fontSize: 13, marginTop: 10, lineHeight: 18 },
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
