import React, { useCallback, useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { theme } from "../theme";
import { getMissionProgress, parseZones } from "../services/missionStorage";
import Button from "../components/Button";
import { useFocusRefresh } from "../hooks/useFocusRefresh";

export default function AgentMissionDetailScreen({ navigation, route }) {
  const mission = route.params?.mission;
  const zones = useMemo(() => {
    if (mission?.zones && Array.isArray(mission.zones) && mission.zones.length) {
      return mission.zones;
    }
    return parseZones(mission?.zone);
  }, [mission?.zone, mission?.zones]);
  const [progress, setProgress] = useState({
    completedZones: [],
    completedCount: 0,
    totalZones: zones.length,
    nextZone: null,
    isDone: false,
  });

  const loadProgress = useCallback(async () => {
    if (!mission?.id) return;
    const current = await getMissionProgress(mission.id, zones);
    setProgress(current);
  }, [mission?.id, zones]);

  useFocusRefresh(navigation, loadProgress, {
    minIntervalMs: 10000,
    runOnMount: true,
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{mission?.nom || "Mission"}</Text>
        <Text style={styles.meta}>Client : {mission?.entreprise || "-"}</Text>
      </View>

      {mission?.instructions ? (
        <View style={styles.card}>
          <Text style={styles.section}>Instructions terrain</Text>
          <Text style={styles.instructions}>{mission.instructions}</Text>
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.section}>Zones</Text>
        {zones.length === 0 ? (
          <Text style={styles.item}>Aucune zone</Text>
        ) : (
          zones.map((zone) => (
            <Text key={zone} style={styles.item}>
              {progress.completedZones.includes(zone) ? "✓" : "○"} {zone}
            </Text>
          ))
        )}
        {zones.length > 0 ? (
          <Text style={styles.progressLine}>
            Progression : {progress.completedCount} / {progress.totalZones} zones
          </Text>
        ) : null}
      </View>

      <Button
        title="Commencer mission"
        variant="primary"
        onPress={() =>
          navigation.navigate("AgentZoneSelection", {
            mission,
            zones,
            suggestedZone: progress.nextZone,
          })
        }
        style={styles.primaryButton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing.lg },
  header: { marginBottom: theme.spacing.lg },
  title: { fontSize: 24, fontWeight: "800", color: theme.colors.text, marginBottom: 4 },
  meta: { color: theme.colors.textSecondary, fontSize: 15 },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  section: { color: theme.colors.text, fontWeight: "700", marginBottom: theme.spacing.sm, fontSize: 16 },
  instructions: { color: theme.colors.textSecondary, fontSize: 14, lineHeight: 22 },
  item: { color: theme.colors.textSecondary, marginBottom: 8, fontSize: 15 },
  progressLine: {
    marginTop: theme.spacing.sm,
    fontSize: 15,
    fontWeight: "800",
    color: theme.colors.primary,
  },
  primaryButton: { marginTop: theme.spacing.md },
});
