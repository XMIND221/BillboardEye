import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from "react-native";
import { theme } from "../theme";
import { getMissionProgress } from "../services/missionStorage";
import { useFocusRefresh } from "../hooks/useFocusRefresh";

const ZONE_COLORS = [
  theme.colors.pastels.blue,
  theme.colors.pastels.green,
  theme.colors.pastels.orange,
  theme.colors.pastels.purple,
  theme.colors.pastels.pink,
];

export default function AgentZoneSelectionScreen({ navigation, route }) {
  const mission = route.params?.mission;
  const zones = route.params?.zones || [];
  const suggestedZone = route.params?.suggestedZone || null;
  const [completedSet, setCompletedSet] = useState(() => new Set());

  const loadProgress = useCallback(async () => {
    if (!mission?.id) return;
    const p = await getMissionProgress(mission.id, zones);
    setCompletedSet(new Set(p.completedZones || []));
  }, [mission?.id, zones]);

  useFocusRefresh(navigation, loadProgress, {
    minIntervalMs: 10000,
    runOnMount: true,
  });

  const goExecution = (zone) => {
    navigation.navigate("AgentExecution", { mission, zone, zones });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choisir une zone</Text>
      <Text style={styles.subtitle}>Puis Face A → Face B → Valider</Text>
      {!!suggestedZone && (
        <View style={styles.suggestedBadge}>
          <Text style={styles.suggestedText}>À faire ensuite : {suggestedZone}</Text>
        </View>
      )}

      <FlatList
        data={zones}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.list}
        renderItem={({ item, index }) => {
          const done = completedSet.has(item);
          return (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: ZONE_COLORS[index % ZONE_COLORS.length] }]}
              onPress={() => goExecution(item)}
              activeOpacity={0.85}
            >
              <Text style={styles.cardText}>
                {done ? "✓ " : "○ "}
                {item}
              </Text>
              {done ? <Text style={styles.doneHint}>Terminée — vous pouvez rouvrir</Text> : null}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={<Text style={styles.empty}>Aucune zone configurée</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing.lg },
  title: { fontSize: 24, fontWeight: "800", color: theme.colors.text },
  subtitle: { color: theme.colors.textSecondary, marginTop: 4, marginBottom: theme.spacing.md },
  suggestedBadge: {
    backgroundColor: theme.colors.pastels.green,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.lg,
  },
  suggestedText: { color: theme.colors.success, fontWeight: "700", fontSize: 14 },
  list: { paddingBottom: theme.spacing.xxl },
  card: {
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  cardText: { color: theme.colors.text, fontWeight: "800", fontSize: 17 },
  doneHint: { marginTop: 6, fontSize: 12, fontWeight: "600", color: theme.colors.textSecondary },
  empty: { color: theme.colors.textMuted, marginTop: theme.spacing.lg, fontSize: 15 },
});
