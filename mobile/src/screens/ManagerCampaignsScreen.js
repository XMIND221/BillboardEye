import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { theme } from "../theme";
import { getProjets, getProjetReport } from "../services/api";

export default function ManagerCampaignsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    try {
      setError("");
      const campaigns = await getProjets();
      const rows = await Promise.all(
        campaigns.map(async (campaign) => {
          try {
            const report = await getProjetReport(campaign.id);
            const total = report?.summary?.total || 0;
            const completed = report?.summary?.completed || 0;
            const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
            const status = total === 0 ? "Vide" : completed >= total ? "Terminee" : "En cours";
            return { ...campaign, total, completed, progress, status };
          } catch (_error) {
            return { ...campaign, total: 0, completed: 0, progress: 0, status: "Inconnu" };
          }
        }),
      );
      setItems(rows);
    } catch (err) {
      setError(err.message || "Impossible de charger les campagnes.");
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Campagnes</Text>
      {!!error && <Text style={styles.error}>{error}</Text>}
      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.accent} style={styles.loader} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.accent} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate("ManagerCampaignDetail", { campaign: item })}
              activeOpacity={0.85}
            >
              <Text style={styles.name}>{item.nom}</Text>
              <Text style={styles.meta}>Client: {item.entreprise}</Text>
              <Text style={styles.meta}>Statut: {item.status}</Text>
              <Text style={styles.meta}>
                Progression: {item.completed}/{item.total} ({item.progress}%)
              </Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.empty}>Aucune campagne.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing.md },
  title: { fontSize: 22, fontWeight: "800", color: theme.colors.text, marginBottom: theme.spacing.md },
  card: {
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  name: { color: theme.colors.text, fontWeight: "700", fontSize: 16, marginBottom: 6 },
  meta: { color: theme.colors.textSecondary, marginBottom: 2, fontSize: 14 },
  empty: { color: theme.colors.textMuted, marginTop: theme.spacing.lg },
  error: { color: theme.colors.error, marginBottom: theme.spacing.md, fontSize: 14 },
  loader: { marginTop: 48 },
});
