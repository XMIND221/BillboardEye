import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { syncOfflineData } from "../services/syncService";
import { getSelectedProject } from "../services/projectStorage";
import { getMissionProgress, parseZones } from "../services/missionStorage";

export default function HomeScreen({ navigation, route }) {
  const [isOnline, setIsOnline] = useState(true);
  const [syncMessage, setSyncMessage] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [mission, setMission] = useState({
    hasActiveMission: false,
    completedCount: 0,
    totalZones: 0,
    nextZone: null,
    isDone: false,
  });
  const previousOnline = useRef(true);

  const loadHomeData = async () => {
    const project = await getSelectedProject();
    setSelectedProject(project);

    if (project?.id) {
      const zones = parseZones(project.zone);
      const progress = await getMissionProgress(project.id, zones);
      setMission({
        hasActiveMission: true,
        completedCount: progress.completedCount,
        totalZones: progress.totalZones,
        nextZone: progress.nextZone,
        isDone: progress.isDone,
      });
    } else {
      setMission({
        hasActiveMission: false,
        completedCount: 0,
        totalZones: 0,
        nextZone: null,
        isDone: false,
      });
    }
  };

  const runSync = async () => {
    if (isSyncing) {
      return;
    }

    setIsSyncing(true);
    setSyncMessage("Synchronisation discrète...");

    const result = await syncOfflineData();
    setSyncMessage(result.synced ? "Mise a jour effectuee" : result.message || "Aucune donnee en attente.");
    setIsSyncing(false);
  };

  useEffect(() => {
    const unsubscribeFocus = navigation.addListener("focus", async () => {
      await loadHomeData();
    });

    return unsubscribeFocus;
  }, [navigation]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = Boolean(state.isConnected && state.isInternetReachable !== false);
      setIsOnline(online);

      if (online) {
        if (!previousOnline.current) {
          setSyncMessage("Connexion retablie");
        }
        runSync();
      } else {
        setSyncMessage("Erreur reseau");
      }
      previousOnline.current = online;
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (isOnline) {
        runSync();
      }
    }, 30000);

    return () => clearInterval(intervalId);
  }, [isOnline]);

  useEffect(() => {
    if (!route.params?.createdPanneau) {
      return;
    }

    loadHomeData().then(() => runSync());
    navigation.setParams({ createdPanneau: undefined });
  }, [route.params?.createdPanneau, navigation]);

  const progressPercent = mission.totalZones > 0 ? Math.round((mission.completedCount / mission.totalZones) * 100) : 0;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.statusRow}>
          <Text style={[styles.statusBadge, { color: isOnline ? "#16A34A" : "#DC2626" }]}>
            {isOnline ? "🟢 En ligne" : "🔴 Hors ligne"}
          </Text>
        </View>

        {!mission.hasActiveMission ? (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Prêt à travailler</Text>
            <Text style={styles.mainTitle}>Aucune mission active</Text>
            <Text style={styles.mainSubtitle}>Crée une campagne pour démarrer une mission terrain guidée.</Text>
            <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate("CreateProjet")}>
              <Text style={styles.primaryButtonText}>Créer une campagne</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Ma mission</Text>
            <Text style={styles.mainTitle}>{selectedProject?.nom}</Text>
            <Text style={styles.mainSubtitle}>
              Progression: {mission.completedCount} / {mission.totalZones} zones
            </Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
            </View>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() =>
                navigation.navigate("ZoneSelection", {
                  mission: selectedProject,
                  zones: parseZones(selectedProject?.zone),
                  suggestedZone: mission.nextZone,
                })
              }
            >
              <Text style={styles.primaryButtonText}>Continuer la mission</Text>
            </TouchableOpacity>

            <View style={styles.nextActionCard}>
              <Text style={styles.sectionLabel}>Prochaine action</Text>
              <Text style={styles.nextActionText}>
                {mission.isDone
                  ? "Mission terminée"
                  : `Zone actuelle: ${mission.nextZone || "Choisir une zone"}`}
              </Text>
              {!mission.isDone ? (
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() =>
                    navigation.navigate("CreatePanneau", {
                      selectedProjet: selectedProject,
                      missionContext: {
                        projectId: selectedProject.id,
                        missionName: selectedProject.nom,
                        zones: parseZones(selectedProject.zone),
                        zone: mission.nextZone || "",
                        client: selectedProject.entreprise,
                      },
                    })
                  }
                >
                  <Text style={styles.secondaryButtonText}>Prendre photos</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => navigation.navigate("MissionComplete", { mission: selectedProject })}
                >
                  <Text style={styles.secondaryButtonText}>Voir fin mission</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        <View style={styles.syncRow}>
          <Text style={styles.syncText}>{syncMessage || "Synchronisation active"}</Text>
          <TouchableOpacity style={styles.syncButton} onPress={runSync} disabled={isSyncing}>
            <Text style={styles.syncButtonText}>{isSyncing ? "..." : "Sync"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FB",
  },
  content: {
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    padding: 16,
  },
  statusRow: {
    marginBottom: 12,
  },
  statusBadge: {
    fontWeight: "700",
    fontSize: 13,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    marginTop: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "700",
    marginBottom: 4,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
  },
  mainSubtitle: {
    marginTop: 6,
    color: "#4B5563",
    marginBottom: 14,
    fontSize: 14,
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: "#E5E7EB",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#2563EB",
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
  nextActionCard: {
    marginTop: 16,
    backgroundColor: "#F8F9FB",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  nextActionText: {
    color: "#111827",
    fontWeight: "700",
    marginBottom: 8,
  },
  secondaryButton: {
    marginTop: 4,
    borderColor: "#2563EB",
    borderWidth: 1,
    borderRadius: 12,
    alignItems: "center",
    paddingVertical: 9,
  },
  secondaryButtonText: {
    color: "#2563EB",
    fontWeight: "700",
  },
  syncRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  syncText: {
    color: "#4B5563",
    flex: 1,
    marginRight: 10,
    fontSize: 13,
  },
  syncButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  syncButtonText: {
    color: "#111827",
    fontWeight: "700",
  },
});
