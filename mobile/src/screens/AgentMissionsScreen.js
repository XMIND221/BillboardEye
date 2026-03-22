import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { getProjets } from "../services/api";
import { parseZones } from "../services/missionStorage";
import { useAuth } from "../contexts/AuthContext";
import { theme } from "../theme";
import AppHeader from "../components/AppHeader";

const CARD_COLORS = [theme.colors.pastels.blue, theme.colors.pastels.green, theme.colors.pastels.orange, theme.colors.pastels.purple];

const FILTERS = [
  { id: "all", label: "Toutes" },
  { id: "ongoing", label: "En cours" },
  { id: "done", label: "Terminées" },
];

function missionMatchesFilter(m, filterId) {
  const s = String(m.statut || "active").toLowerCase();
  if (filterId === "all") return true;
  if (filterId === "ongoing") return s === "active" || s === "planned" || s === "draft";
  if (filterId === "done") return s === "completed" || s === "archived";
  return true;
}

export default function AgentMissionsScreen({ navigation }) {
  const { session } = useAuth();
  const userEmail = session?.user?.email?.toLowerCase() || "";
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [missions, setMissions] = useState([]);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  const goUpload = () => navigation.navigate("PanneauxTab", { screen: "UploadPanneau" });

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

  const filteredMissions = useMemo(
    () => missions.filter((m) => missionMatchesFilter(m, filter)),
    [missions, filter]
  );

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
    <View style={styles.root}>
      <AppHeader />
      <View style={styles.container}>
        <View style={styles.headBlock}>
          <Text style={styles.title}>Mes missions</Text>
          <Text style={styles.subtitle}>
            {filteredMissions.length} sur {missions.length} mission{missions.length !== 1 ? "s" : ""}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
            {FILTERS.map((f) => {
              const active = filter === f.id;
              return (
                <TouchableOpacity
                  key={f.id}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setFilter(f.id)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{f.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <TouchableOpacity style={styles.uploadChip} onPress={goUpload} activeOpacity={0.85}>
            <Text style={styles.uploadChipText}>Mode upload</Text>
          </TouchableOpacity>
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
          <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
        ) : (
          <FlatList
            data={filteredMissions}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={[styles.card, { backgroundColor: CARD_COLORS[index % CARD_COLORS.length] }]}
                onPress={() => navigation.navigate("AgentMissionDetail", { mission: item })}
                activeOpacity={0.85}
              >
                <Text style={styles.cardTitle}>{item.nom}</Text>
                <Text style={styles.cardMeta}>Client : {item.entreprise}</Text>
                <Text style={styles.cardMeta}>Statut : {item.statut || "active"}</Text>
                <Text style={styles.cardMeta}>Zones : {item.zones?.length || 0}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={styles.empty}>Aucune mission dans ce filtre.</Text>}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  container: { flex: 1, paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.md },
  headBlock: { marginBottom: theme.spacing.md },
  title: { fontSize: 22, fontWeight: "800", color: theme.colors.text },
  subtitle: { marginTop: 4, fontSize: 14, color: theme.colors.textMuted },
  chipsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    paddingRight: theme.spacing.md,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.muted,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  chipActive: {
    backgroundColor: theme.colors.primaryMuted,
    borderColor: theme.colors.primary,
  },
  chipText: { fontSize: 13, fontWeight: "600", color: theme.colors.textSecondary },
  chipTextActive: { color: theme.colors.primary },
  uploadChip: {
    alignSelf: "flex-start",
    marginTop: theme.spacing.xs,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.primaryMuted,
    borderWidth: 1,
    borderColor: "rgba(225, 29, 72, 0.25)",
  },
  uploadChipText: { color: theme.colors.primary, fontWeight: "700", fontSize: 13 },
  list: { paddingBottom: theme.spacing.xxl },
  card: {
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
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
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  retryText: { color: theme.colors.primary, fontWeight: "600", fontSize: 14 },
  loader: { marginTop: 48 },
});
