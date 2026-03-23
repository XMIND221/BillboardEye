import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl, ScrollView } from "react-native";
import { getProjets, getPanneaux } from "../services/api";
import { theme } from "../theme";
import Button from "../components/Button";
import AppHeader from "../components/AppHeader";
import SectionHeader from "../components/manager/SectionHeader";
import KpiCard from "../components/manager/KpiCard";
import ProgressBarBlock from "../components/manager/ProgressBarBlock";
import ErrorBanner from "../components/manager/ErrorBanner";
import { attachReportMetricsToCampaigns } from "../utils/campaignMetrics";
import { Ionicons } from "@expo/vector-icons";
import { MANAGER_REPORT_SCREENS } from "../navigation/reportScreens";

export default function ManagerDashboardScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    activeCampaigns: 0,
    totalPanels: 0,
    avgProgress: 0,
    globalTotal: 0,
    globalCompleted: 0,
  });
  const [watchlist, setWatchlist] = useState([]);

  const loadData = useCallback(async () => {
    try {
      setError("");
      const [campaigns, panneaux] = await Promise.all([getProjets(), getPanneaux()]);
      const visibleProjetIds = new Set((campaigns || []).map((c) => c.id));
      const scoped = (panneaux || []).filter((p) => p.projetId && visibleProjetIds.has(p.projetId));

      const withMetrics = await attachReportMetricsToCampaigns(campaigns || []);
      const withData = withMetrics.filter((c) => c.total > 0);
      const avgProgress =
        withData.length > 0 ? Math.round(withData.reduce((s, c) => s + c.progress, 0) / withData.length) : 0;
      const globalTotal = withMetrics.reduce((s, c) => s + (c.total || 0), 0);
      const globalCompleted = withMetrics.reduce((s, c) => s + (c.completed || 0), 0);

      const inProgress = withMetrics.filter((c) => c.status === "En cours").slice(0, 4);

      setStats({
        activeCampaigns: (campaigns || []).length,
        totalPanels: scoped.length,
        avgProgress,
        globalTotal,
        globalCompleted,
      });
      setWatchlist(inProgress);
    } catch (err) {
      setError(err.message || "Impossible de charger le tableau de bord.");
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

  const globalPercent = useMemo(() => {
    if (stats.globalTotal <= 0) return 0;
    return Math.round((stats.globalCompleted / stats.globalTotal) * 100);
  }, [stats.globalCompleted, stats.globalTotal]);

  return (
    <View style={styles.root}>
      <AppHeader />
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.accent} />}
      >
        <SectionHeader
          title="Tableau de bord"
          subtitle="Vue d’ensemble de vos campagnes et panneaux synchronisés."
        />

        <Text style={styles.quickLabel}>Actions rapides</Text>
        <View style={styles.quickRow}>
          <TouchableOpacity
            style={styles.quickTile}
            onPress={() => navigation.navigate("ManagerCampaignsTab", { screen: "ManagerCreateCampaign" })}
            activeOpacity={0.88}
          >
            <View style={[styles.quickIcon, { backgroundColor: theme.colors.primaryMuted }]}>
              <Ionicons name="add" size={22} color={theme.colors.primary} />
            </View>
            <Text style={styles.quickText}>Campagne</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickTile}
            onPress={() => navigation.navigate("ManagerPanneauxTab", { screen: "ManagerPanneauForm" })}
            activeOpacity={0.88}
          >
            <View style={[styles.quickIcon, { backgroundColor: theme.colors.pastels.green }]}>
              <Ionicons name="add" size={22} color={theme.colors.success} />
            </View>
            <Text style={styles.quickText}>Panneau</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickTile}
            onPress={() => navigation.navigate("ManagerRapportsTab", { screen: MANAGER_REPORT_SCREENS.Generate })}
            activeOpacity={0.88}
          >
            <View style={[styles.quickIcon, { backgroundColor: theme.colors.pastels.blue }]}>
              <Ionicons name="document-text-outline" size={20} color={theme.colors.primary} />
            </View>
            <Text style={styles.quickText}>Rapport</Text>
          </TouchableOpacity>
        </View>

        <ErrorBanner message={error} onRetry={loadData} />

        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
        ) : (
          <>
            <View style={styles.kpiRow}>
              <View style={styles.kpiHalf}>
                <KpiCard label="Campagnes" value={stats.activeCampaigns} tone={0} hint="Campagnes visibles sur votre compte." />
              </View>
              <View style={styles.kpiHalf}>
                <KpiCard
                  label="Panneaux"
                  value={stats.totalPanels}
                  tone={1}
                  hint="Liés à ces campagnes (serveur)."
                />
              </View>
            </View>
            <KpiCard
              label="Progression moyenne"
              value={`${stats.avgProgress}%`}
              tone={2}
              hint="Basée sur les rapports projet (panneaux complétés / total)."
              style={styles.kpiFull}
            />

            <View style={styles.cardSurface}>
              <Text style={styles.cardTitle}>Avancement global</Text>
              <Text style={styles.cardLead}>Toutes campagnes confondues (données rapport)</Text>
              {stats.globalTotal > 0 ? (
                <ProgressBarBlock
                  label="Panneaux complétés"
                  current={stats.globalCompleted}
                  total={stats.globalTotal}
                  percent={globalPercent}
                  accentColor={theme.colors.primary}
                />
              ) : (
                <Text style={styles.muted}>Pas encore de panneaux rattachés aux rapports — les métriques apparaîtront ici.</Text>
              )}
            </View>

            <View style={styles.cardSurface}>
              <Text style={styles.cardTitle}>À suivre</Text>
              <Text style={styles.cardLead}>Campagnes encore en cours de collecte</Text>
              {watchlist.length === 0 ? (
                <Text style={styles.muted}>Rien à signaler — créez une campagne ou attendez les retours terrain.</Text>
              ) : (
                watchlist.map((c) => (
                  <View key={c.id} style={styles.watchRow}>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.watchName} numberOfLines={1}>
                        {c.nom}
                      </Text>
                      <Text style={styles.watchMeta} numberOfLines={1}>
                        {c.entreprise}
                      </Text>
                    </View>
                    <Text style={styles.watchPct}>{c.progress}%</Text>
                  </View>
                ))
              )}
            </View>

            <Button
              title="Nouvelle campagne"
              variant="primary"
              onPress={() => navigation.navigate("ManagerCampaignsTab", { screen: "ManagerCreateCampaign" })}
              style={styles.primaryButton}
            />
            <Button
              title="Voir toutes les campagnes"
              variant="secondary"
              onPress={() => navigation.navigate("ManagerCampaignsTab", { screen: "ManagerCampaigns" })}
              style={styles.secondaryButton}
            />
            <TouchableOpacity
              style={styles.linkRow}
              onPress={() => navigation.navigate("ManagerRapportsTab")}
              activeOpacity={0.85}
            >
              <Text style={styles.linkText}>Rapports PDF →</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.canvas },
  container: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
    flexGrow: 1,
  },
  quickLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: theme.colors.textMuted,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: theme.spacing.sm,
  },
  quickRow: { flexDirection: "row", gap: theme.spacing.sm, marginBottom: theme.spacing.lg },
  quickTile: {
    flex: 1,
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  quickIcon: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  quickText: { fontSize: 12, fontWeight: "800", color: theme.colors.text },
  kpiRow: { flexDirection: "row", gap: theme.spacing.sm, marginBottom: theme.spacing.sm },
  kpiHalf: { flex: 1, minWidth: 0 },
  kpiFull: { marginBottom: theme.spacing.md },
  cardSurface: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  cardTitle: { fontSize: 16, fontWeight: "800", color: theme.colors.text },
  cardLead: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 4, marginBottom: theme.spacing.sm },
  muted: { fontSize: 14, color: theme.colors.textMuted, lineHeight: 20 },
  watchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  watchName: { fontSize: 15, fontWeight: "700", color: theme.colors.text },
  watchMeta: { fontSize: 12, color: theme.colors.textMuted, marginTop: 2 },
  watchPct: { fontSize: 14, fontWeight: "800", color: theme.colors.primary, marginLeft: theme.spacing.sm },
  primaryButton: { marginTop: theme.spacing.sm },
  secondaryButton: { marginTop: theme.spacing.md },
  linkRow: { marginTop: theme.spacing.lg, alignSelf: "center", paddingVertical: 8 },
  linkText: { color: theme.colors.primary, fontWeight: "700", fontSize: 14 },
  loader: { marginTop: 48 },
});
