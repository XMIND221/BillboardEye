import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { theme } from "../theme";
import { getMissionProgress, parseZones } from "../services/missionStorage";

export default function AgentMissionDetailScreen({ navigation, route }) {
  const mission = route.params?.mission;
  const zones = useMemo(() => parseZones(mission?.zone), [mission?.zone]);
  const [progress, setProgress] = useState({
    completedZones: [],
    completedCount: 0,
    totalZones: zones.length,
    nextZone: null,
    isDone: false,
  });

  useEffect(() => {
    const load = async () => {
      if (!mission?.id) {
        return;
      }
      const current = await getMissionProgress(mission.id, zones);
      setProgress(current);
    };
    const unsubscribe = navigation.addListener("focus", load);
    load();
    return unsubscribe;
  }, [navigation, mission?.id, zones]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{mission?.nom || "Mission"}</Text>
      <Text style={styles.meta}>Client: {mission?.entreprise || "-"}</Text>

      <View style={styles.card}>
        <Text style={styles.section}>Zones</Text>
        {zones.length === 0 ? (
          <Text style={styles.item}>Aucune zone</Text>
        ) : (
          zones.map((zone) => (
            <Text key={zone} style={styles.item}>
              {progress.completedZones.includes(zone) ? "☑" : "☐"} {zone}
            </Text>
          ))
        )}
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() =>
          navigation.navigate("AgentZoneSelection", {
            mission,
            zones,
            suggestedZone: progress.nextZone,
          })
        }
      >
        <Text style={styles.primaryText}>Commencer</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing.md },
  title: { fontSize: 22, fontWeight: "800", color: theme.colors.text, marginBottom: 4 },
  meta: { color: theme.colors.textSecondary, marginBottom: theme.spacing.md },
  card: {
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  section: { color: theme.colors.text, fontWeight: "700", marginBottom: theme.spacing.sm },
  item: { color: theme.colors.textSecondary, marginBottom: 6, fontSize: 15 },
  primaryButton: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.lg,
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
