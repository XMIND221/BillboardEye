import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { getProjets } from "../services/api";
import { parseZones } from "../services/missionStorage";

export default function MissionsScreen({ navigation }) {
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadMissions = useCallback(async () => {
    try {
      setError("");
      const projets = await getProjets();
      const mapped = projets.map((projet) => {
        const zones = parseZones(projet.zone);
        return {
          ...projet,
          zones,
          zonesCount: zones.length,
          client: projet.entreprise,
        };
      });
      setMissions(mapped);
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
    bootstrap();
  }, [loadMissions]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMissions();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Missions</Text>
      <Text style={styles.subtitle}>Sélectionne une mission active pour commencer.</Text>

      <TouchableOpacity style={styles.createButton} onPress={() => navigation.navigate("CreateProjet")}>
        <Text style={styles.createButtonText}>Nouvelle mission</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator />
      ) : (
        <>
          {!!error && <Text style={styles.errorText}>{error}</Text>}
          <FlatList
            data={missions}
            keyExtractor={(item) => item.id}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.navigate("MissionDetail", { mission: item })}
              >
                <Text style={styles.cardTitle}>{item.nom}</Text>
                <Text style={styles.cardMeta}>Client: {item.client}</Text>
                <Text style={styles.cardMeta}>
                  {item.zonesCount > 0 ? `${item.zonesCount} zone(s)` : "Zones à définir"}
                </Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>Aucune mission active.</Text>}
          />
        </>
      )}
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
  createButton: {
    backgroundColor: "#2563EB",
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  createButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 4,
  },
  cardMeta: {
    color: "#4B5563",
    marginBottom: 2,
  },
  errorText: {
    color: "#DC2626",
    marginBottom: 8,
  },
  emptyText: {
    color: "#6B7280",
    marginTop: 8,
  },
});
