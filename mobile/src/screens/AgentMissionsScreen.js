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
import { useAuth } from "../contexts/AuthContext";
import { theme } from "../theme";

const CARD_COLORS = [theme.colors.pastels.blue, theme.colors.pastels.green, theme.colors.pastels.orange, theme.colors.pastels.purple];

export default function AgentMissionsScreen({ navigation }) {
  const { session } = useAuth();
  const userEmail = session?.user?.email?.toLowerCase() || "";
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [missions, setMissions] = useState([]);
  const [error, setError] = useState("");

  const loadMissions = useCallback(async () => {
    try {
      setError("");
      const projects = await getProjets();
      let items = projects.map((item) => ({
        ...item,
        zones: parseZones(item.zone),
      }));
      if (userEmail) {
        items = items.filter((p) => {
          const agent = (p.assignedAgent || "").toLowerCase().trim();
          return !agent || agent === userEmail;
        });
      }
      setMissions(items);
    } catch (err) {
      setError(err.message || "Impossible de charger les missions.");
    }
  }, [userEmail]);

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
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.uploadButton} onPress={() => navigation.navigate("UploadPanneau")} activeOpacity={0.85}>
            <Text style={styles.uploadButtonText}>Mode Upload</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.panneauxButton} onPress={() => navigation.navigate("AgentPanneaux")} activeOpacity={0.85}>
            <Text style={styles.panneauxButtonText}>Mes panneaux</Text>
          </TouchableOpacity>
        </View>
      </View>
      {!!error && (
        <View style={styles.errorBlock}>
          <Text style={styles.error}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadMissions} activeOpacity={0.85}>
            <Text style={styles.retryText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      )}
      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.accent} style={styles.loader} />
      ) : (
        <FlatList
          data={missions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.accent} />}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: CARD_COLORS[index % CARD_COLORS.length] }]}
              onPress={() => navigation.navigate("AgentMissionDetail", { mission: item })}
              activeOpacity={0.85}
            >
              <Text style={styles.cardTitle}>{item.nom}</Text>
              <Text style={styles.cardMeta}>Client: {item.entreprise}</Text>
              <Text style={styles.cardMeta}>Zones : {item.zones?.length || 0}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.empty}>Aucune mission assignée.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing.lg },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: theme.spacing.lg },
  title: { fontSize: 24, fontWeight: "800", color: theme.colors.text },
  headerActions: { flexDirection: "row", gap: theme.spacing.sm },
  uploadButton: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: theme.radius.xl,
    borderWidth: 2,
    borderColor: theme.colors.accent,
    ...theme.shadows.sm,
  },
  uploadButtonText: { color: theme.colors.accent, fontWeight: "700", fontSize: 14 },
  panneauxButton: {
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: theme.radius.xl,
    ...theme.shadows.sm,
  },
  panneauxButtonText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  list: { paddingBottom: theme.spacing.xxl },
  card: {
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.md,
  },
  cardTitle: { color: theme.colors.text, fontSize: 17, fontWeight: "700", marginBottom: 6 },
  cardMeta: { color: theme.colors.textSecondary, fontSize: 14, marginBottom: 2 },
  empty: { color: theme.colors.textMuted, marginTop: theme.spacing.xl, textAlign: "center", fontSize: 15 },
  errorBlock: { marginBottom: theme.spacing.md },
  error: { color: theme.colors.error, marginBottom: theme.spacing.sm, fontSize: 14 },
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
