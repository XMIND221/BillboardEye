import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { getMissionProgress, parseZones } from "../services/missionStorage";

export default function MissionDetailScreen({ navigation, route }) {
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

  if (!mission) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>Mission introuvable.</Text>
      </View>
    );
  }

  const progressPercent =
    progress.totalZones > 0 ? Math.round((progress.completedCount / progress.totalZones) * 100) : 0;

  return (
    <View style={styles.container}>
      <Text style={[styles.statusBadge, { color: "#16A34A" }]}>🟢 En ligne</Text>

      <Text style={styles.sectionHeader}>Mission en cours</Text>
      <View style={styles.card}>
        <Text style={styles.missionName}>{mission.nom}</Text>
        <Text style={styles.metaText}>
          {progress.completedCount} / {progress.totalZones} zones complétées
        </Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
        </View>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() =>
            navigation.navigate("ZoneSelection", {
              mission,
              zones,
              suggestedZone: progress.nextZone,
            })
          }
        >
          <Text style={styles.primaryButtonText}>Continuer la mission</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionHeader}>Prochaine action</Text>
      <View style={styles.card}>
        <Text style={styles.zoneTitle}>Zone: {progress.nextZone || "Aucune (mission terminée)"}</Text>
        <View style={styles.divider} />
        <View style={styles.photoHintsRow}>
          <View style={styles.photoHintItem}>
            <Text style={styles.photoHintIcon}>📷</Text>
            <Text style={styles.photoHintLabel}>Face A</Text>
          </View>
          <View style={styles.photoHintItem}>
            <Text style={styles.photoHintIcon}>📷</Text>
            <Text style={styles.photoHintLabel}>Face B</Text>
          </View>
        </View>
        <Text style={styles.gpsHint}>📍 GPS et heure automatiques</Text>
        <TouchableOpacity
          style={[styles.secondaryButton, !progress.nextZone && styles.secondaryButtonDisabled]}
          disabled={!progress.nextZone}
          onPress={() =>
            navigation.navigate("CreatePanneau", {
              selectedProjet: mission,
              missionContext: {
                projectId: mission.id,
                missionName: mission.nom,
                zones,
                zone: progress.nextZone,
                client: mission.entreprise,
              },
            })
          }
        >
          <Text style={styles.secondaryButtonText}>Prendre photos</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionHeader}>Progression</Text>
      <View style={styles.card}>
        {zones.length === 0 ? (
          <Text style={styles.zoneRow}>Aucune zone définie</Text>
        ) : (
          zones.map((zone) => (
            <View key={zone} style={styles.zoneRowWrap}>
              <Text style={styles.zoneRow}>
                {progress.completedZones.includes(zone) ? "✔" : "☐"} {zone}
              </Text>
            </View>
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FB",
    padding: 16,
  },
  statusBadge: {
    fontWeight: "700",
    marginBottom: 12,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 8,
  },
  progressTrack: {
    marginTop: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: "#E5E7EB",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#2563EB",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  missionName: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
  },
  metaText: {
    marginTop: 6,
    color: "#4B5563",
  },
  zoneTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
  },
  divider: {
    marginVertical: 10,
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  photoHintsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  photoHintItem: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    alignItems: "center",
    paddingVertical: 10,
  },
  photoHintIcon: {
    fontSize: 20,
  },
  photoHintLabel: {
    marginTop: 2,
    color: "#374151",
    fontWeight: "800",
  },
  gpsHint: {
    color: "#6B7280",
    marginBottom: 10,
    fontWeight: "600",
  },
  zoneRowWrap: {
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  primaryButton: {
    marginTop: 12,
    backgroundColor: "#2563EB",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  secondaryButton: {
    backgroundColor: "#E5E7EB",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryButtonDisabled: {
    opacity: 0.55,
  },
  secondaryButtonText: {
    color: "#2563EB",
    fontWeight: "800",
  },
  zoneRow: {
    color: "#374151",
    fontSize: 16,
    fontWeight: "600",
  },
  error: {
    color: "#DC2626",
    fontWeight: "700",
  },
});
