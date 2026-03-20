import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { getProjets } from "../services/api";
import { parseZones } from "../services/missionStorage";
import { theme } from "../theme";

export default function AgentMissionsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [missions, setMissions] = useState([]);
  const [error, setError] = useState("");

  const loadMissions = useCallback(async () => {
    try {
      setError("");
      const projects = await getProjets();
      setMissions(
        projects.map((item) => ({
          ...item,
          zones: parseZones(item.zone),
        })),
      );
    } catch (err) {
      setError(err.message || "Impossible de charger les missions.");
    }
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true);
      await loadMissions();
      setLoading(false);
    };
    const unsubscribe = navigation.addListener("focus", bootstrap);
    bootstrap();
    return unsubscribe;
  }, [loadMissions, navigation]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMissions();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Missions</Text>
        <TouchableOpacity style={styles.panneauxButton} onPress={() => navigation.navigate("AgentPanneaux")} activeOpacity={0.85}>
          <Text style={styles.panneauxButtonText}>Mes panneaux</Text>
        </TouchableOpacity>
      </View>
      {!!error && <Text style={styles.error}>{error}</Text>}
      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.accent} style={styles.loader} />
      ) : (
        <FlatList
          data={missions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.accent} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate("AgentMissionDetail", { mission: item })}
              activeOpacity={0.85}
            >
              <Text style={styles.cardTitle}>{item.nom}</Text>
              <Text style={styles.cardMeta}>Client: {item.entreprise}</Text>
              <Text style={styles.cardMeta}>Zones: {item.zones?.length || 0}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.empty}>Aucune mission assignée.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing.md },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: theme.spacing.md },
  title: { fontSize: 22, fontWeight: "800", color: theme.colors.text },
  panneauxButton: {
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: theme.radius.md,
  },
  panneauxButtonText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  list: { paddingBottom: theme.spacing.xl },
  card: {
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  cardTitle: { color: theme.colors.text, fontSize: 16, fontWeight: "700", marginBottom: 6 },
  cardMeta: { color: theme.colors.textSecondary, fontSize: 14, marginBottom: 2 },
  empty: { color: theme.colors.textMuted, marginTop: theme.spacing.lg, textAlign: "center" },
  error: { color: theme.colors.error, marginBottom: theme.spacing.md, fontSize: 14 },
  loader: { marginTop: 48 },
});
