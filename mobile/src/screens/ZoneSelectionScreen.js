import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import * as Location from "expo-location";

const getBestZoneMatch = (zones, reverseGeocodeResult) => {
  if (!zones.length || !reverseGeocodeResult) {
    return null;
  }

  const source = [
    reverseGeocodeResult.city,
    reverseGeocodeResult.district,
    reverseGeocodeResult.region,
    reverseGeocodeResult.street,
    reverseGeocodeResult.name,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return zones.find((zone) => source.includes(zone.toLowerCase())) || zones[0];
};

export default function ZoneSelectionScreen({ navigation, route }) {
  const mission = route.params?.mission;
  const zones = useMemo(() => route.params?.zones || [], [route.params?.zones]);
  const [selectedZone, setSelectedZone] = useState(route.params?.suggestedZone || "");
  const [loadingGps, setLoadingGps] = useState(false);
  const [hint, setHint] = useState("");

  const pickWithGps = async () => {
    try {
      setLoadingGps(true);
      setHint("");
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setHint("Permission GPS refusée. Choisis manuellement.");
        return;
      }

      const position = await Location.getCurrentPositionAsync({});
      const reverse = await Location.reverseGeocodeAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      const suggestion = getBestZoneMatch(zones, reverse?.[0]);
      if (suggestion) {
        setSelectedZone(suggestion);
        setHint(`Zone suggérée: ${suggestion}`);
      } else {
        setHint("Aucune zone correspondante trouvée.");
      }
    } catch (_error) {
      setHint("Impossible de suggérer la zone automatiquement.");
    } finally {
      setLoadingGps(false);
    }
  };

  const startFieldMode = () => {
    if (!selectedZone || !mission) {
      return;
    }

    navigation.navigate("CreatePanneau", {
      selectedProjet: mission,
      missionContext: {
        projectId: mission.id,
        missionName: mission.nom,
        zones,
        zone: selectedZone,
        client: mission.entreprise,
      },
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sélection de zone</Text>
      <Text style={styles.subtitle}>Mission: {mission?.nom}</Text>

      <TouchableOpacity style={styles.primaryButton} onPress={pickWithGps} disabled={loadingGps}>
        <Text style={styles.primaryButtonText}>
          {loadingGps ? "Analyse GPS..." : "Utiliser ma position GPS"}
        </Text>
      </TouchableOpacity>

      <Text style={styles.manualTitle}>Choisir manuellement</Text>
      <View style={styles.card}>
        {zones.length === 0 ? (
          <Text style={styles.zoneRow}>Aucune zone disponible</Text>
        ) : (
          zones.map((zone) => (
            <TouchableOpacity
              key={zone}
              style={[styles.zoneButton, selectedZone === zone && styles.zoneButtonSelected]}
              onPress={() => setSelectedZone(zone)}
            >
              <Text style={[styles.zoneText, selectedZone === zone && styles.zoneTextSelected]}>{zone}</Text>
            </TouchableOpacity>
          ))
        )}
      </View>

      {!!hint && <Text style={styles.hint}>{hint}</Text>}

      <TouchableOpacity
        style={[styles.startButton, !selectedZone && styles.startButtonDisabled]}
        onPress={startFieldMode}
        disabled={!selectedZone}
      >
        <Text style={styles.startButtonText}>Démarrer mode terrain</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FB",
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 12,
    color: "#4B5563",
  },
  primaryButton: {
    backgroundColor: "#2563EB",
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  manualTitle: {
    fontWeight: "700",
    marginBottom: 8,
    color: "#111827",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
  },
  zoneRow: {
    color: "#6B7280",
  },
  zoneButton: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  zoneButtonSelected: {
    borderColor: "#2563EB",
    backgroundColor: "#EFF6FF",
  },
  zoneText: {
    color: "#111827",
    fontWeight: "600",
  },
  zoneTextSelected: {
    color: "#2563EB",
  },
  hint: {
    marginTop: 10,
    color: "#4B5563",
  },
  startButton: {
    marginTop: 14,
    backgroundColor: "#2563EB",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  startButtonDisabled: {
    backgroundColor: "#9CA3AF",
  },
  startButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
});
