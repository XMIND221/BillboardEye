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
import { getPanneaux, getProjets } from "../services/api";
import { getSelectedProject, saveSelectedProject } from "../services/projectStorage";

const formatDate = (value) => {
  if (!value) {
    return "Date inconnue";
  }

  return new Date(value).toLocaleDateString("fr-FR");
};

export default function ProjetsScreen({ navigation }) {
  const [projets, setProjets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");

  const loadProjets = useCallback(async () => {
    try {
      setError("");
      const [projetsData, panneauxData] = await Promise.all([getProjets(), getPanneaux().catch(() => [])]);
      const panneaux = Array.isArray(panneauxData) ? panneauxData : [];
      const enriched = projetsData.map((projet) => {
        const projectPanels = panneaux.filter((item) => item.projetId === projet.id);
        const done = projectPanels.filter((item) => item.statut === "completed").length;
        const total = projectPanels.length;
        const progress = total > 0 ? Math.round((done / total) * 100) : 0;
        return { ...projet, done, total, progress };
      });
      setProjets(enriched);
      const stored = await getSelectedProject();
      setSelectedProjectId(stored?.id || "");
    } catch (err) {
      setError(err.message || "Impossible de recuperer les projets.");
    }
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true);
      await loadProjets();
      setLoading(false);
    };

    bootstrap();
  }, [loadProjets]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProjets();
    setRefreshing(false);
  };

  const onSelectProjet = async (projet) => {
    await saveSelectedProject(projet);
    setSelectedProjectId(projet.id);
    navigation.navigate("CreatePanneau", { selectedProjet: projet });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.screenTitle}>Campagnes</Text>
      <Text style={styles.screenSubtitle}>Choisis une campagne pour continuer sur le terrain.</Text>
      <TouchableOpacity style={styles.createButton} onPress={() => navigation.navigate("CreateProjet")}>
        <Text style={styles.createButtonText}>+ Nouvelle campagne</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator />
      ) : (
        <>
          {!!error && <Text style={styles.errorText}>{error}</Text>}
          <FlatList
            data={projets}
            keyExtractor={(item) => item.id}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.card, item.id === selectedProjectId && styles.cardSelected]}
                onPress={() => onSelectProjet(item)}
              >
                <Text style={styles.title}>{item.nom}</Text>
                <Text style={styles.meta}>Entreprise: {item.entreprise}</Text>
                <Text style={styles.meta}>Zone: {item.zone || "Non renseignee"}</Text>
                <Text style={styles.meta}>Date: {formatDate(item.date)}</Text>
                <Text style={styles.progressLabel}>
                  Progression: {item.done}/{item.total} ({item.progress}%)
                </Text>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${item.progress}%` }]} />
                </View>
                {item.id === selectedProjectId && <Text style={styles.selectedTag}>Campagne active</Text>}
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Aucun projet. Cree un projet pour commencer.</Text>
            }
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
  createButton: {
    backgroundColor: "#2563EB",
    borderRadius: 16,
    alignItems: "center",
    paddingVertical: 12,
    marginBottom: 14,
  },
  createButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
  },
  screenSubtitle: {
    marginTop: 4,
    marginBottom: 10,
    color: "#4B5563",
  },
  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardSelected: {
    borderColor: "#2563EB",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  meta: {
    color: "#4b5563",
    marginBottom: 2,
  },
  emptyText: {
    color: "#4b5563",
    marginTop: 8,
  },
  errorText: {
    color: "#DC2626",
    marginBottom: 10,
  },
  selectedTag: {
    marginTop: 8,
    color: "#16A34A",
    fontWeight: "700",
  },
  progressLabel: {
    marginTop: 6,
    color: "#374151",
    fontWeight: "600",
  },
  progressTrack: {
    marginTop: 6,
    height: 8,
    borderRadius: 999,
    backgroundColor: "#E5E7EB",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#2563EB",
  },
});
