import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
} from "react-native";
import * as Location from "expo-location";
import { createPanneau, isNetworkError } from "../services/api";
import { savePanneauOffline } from "../services/offlineStorage";
import { getSelectedProject } from "../services/projectStorage";

export default function CreatePanneauScreen({ navigation, route }) {
  const [entreprise, setEntreprise] = useState("");
  const [adresse, setAdresse] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [nombreFaces, setNombreFaces] = useState("2");
  const [gpsRecovered, setGpsRecovered] = useState(false);
  const [selectedProjet, setSelectedProjet] = useState(route.params?.selectedProjet || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const missionContext = route.params?.missionContext || null;

  React.useEffect(() => {
    const loadProject = async () => {
      if (route.params?.selectedProjet) {
        setSelectedProjet(route.params.selectedProjet);
        setEntreprise(route.params.selectedProjet.entreprise || "");
        if (route.params?.missionContext?.zone) {
          setAdresse(route.params.missionContext.zone);
        }
        return;
      }

      const stored = await getSelectedProject();
      if (stored) {
        setSelectedProjet(stored);
        setEntreprise(stored.entreprise || "");
      }
    };

    loadProject();
  }, [route.params?.selectedProjet]);

  const getCurrentPosition = async () => {
    try {
      setLoading(true);
      setError("");
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        setError("Permission localisation refusee.");
        return;
      }

      const position = await Location.getCurrentPositionAsync({});
      setLatitude(String(position.coords.latitude));
      setLongitude(String(position.coords.longitude));
      setGpsRecovered(true);
    } catch (_err) {
      setError("Impossible de recuperer la position GPS.");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async () => {
    if (!selectedProjet) {
      setError("Selectionne d'abord un projet.");
      return;
    }

    if (!entreprise || !latitude || !longitude || !gpsRecovered) {
      setError("Veuillez completer toutes les informations");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setStatusMessage("Synchronisation en cours");
      const panneau = await createPanneau({
        entreprise,
        projetId: selectedProjet.id,
        adresse,
        latitude: Number(latitude),
        longitude: Number(longitude),
        nombreFaces: Number(nombreFaces) || 1,
      });

      const trackedPanneau = {
        ...panneau,
        localId: `local-${panneau.id}`,
        serverId: panneau.id,
        statut: "pending",
      };

      await savePanneauOffline({
        localId: trackedPanneau.localId,
        serverId: trackedPanneau.serverId,
        entreprise: trackedPanneau.entreprise,
        projetId: trackedPanneau.projetId || selectedProjet.id,
        localisation: trackedPanneau.localisation,
        nombreFaces: trackedPanneau.nombreFaces,
        createdAt: trackedPanneau.createdAt,
        statut: "pending",
      });
      setStatusMessage("Envoye avec succes");

      if (missionContext) {
        navigation.navigate("Photos", { panneau: trackedPanneau, missionContext });
      } else {
        navigation.navigate("Photos", { panneau: trackedPanneau });
      }
    } catch (err) {
      if (isNetworkError(err)) {
        const localId = `offline-${Date.now()}`;
        const offlinePanneau = {
          id: localId,
          localId,
          entreprise,
          projetId: selectedProjet.id,
          localisation: {
            adresse,
            latitude: Number(latitude),
            longitude: Number(longitude),
          },
          nombreFaces: Number(nombreFaces) || 1,
          statut: "pending",
          createdAt: new Date().toISOString(),
          offline: true,
        };

        await savePanneauOffline({
          localId: offlinePanneau.localId,
          entreprise: offlinePanneau.entreprise,
          projetId: offlinePanneau.projetId,
          localisation: offlinePanneau.localisation,
          nombreFaces: offlinePanneau.nombreFaces,
          statut: offlinePanneau.statut,
          createdAt: offlinePanneau.createdAt,
        });

        Alert.alert("Mode hors ligne", "Sauvegarde locale reussie");
        setStatusMessage("Sauvegarde localement");
        setError("Erreur reseau");
        if (missionContext) {
          navigation.navigate("Photos", { panneau: offlinePanneau, missionContext });
        } else {
          navigation.navigate("Photos", { panneau: offlinePanneau });
        }
      } else {
        setStatusMessage("");
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.projectBadge}>
        Projet: {selectedProjet ? `${selectedProjet.nom} (${selectedProjet.entreprise})` : "Aucun"}
      </Text>
      {missionContext?.zone ? <Text style={styles.zoneHint}>Zone mission: {missionContext.zone}</Text> : null}
      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => navigation.navigate("MainTabs", { screen: "Missions" })}
      >
        <Text style={styles.secondaryButtonText}>Changer de projet</Text>
      </TouchableOpacity>

      <Text style={styles.label}>Entreprise</Text>
      <TextInput style={styles.input} value={entreprise} onChangeText={setEntreprise} />

      <Text style={styles.label}>Adresse</Text>
      <TextInput style={styles.input} value={adresse} onChangeText={setAdresse} />

      <TouchableOpacity style={styles.secondaryButton} onPress={getCurrentPosition}>
        <Text style={styles.secondaryButtonText}>Obtenir position GPS</Text>
      </TouchableOpacity>

      <Text style={styles.label}>Latitude</Text>
      <TextInput style={styles.input} value={latitude} onChangeText={setLatitude} />

      <Text style={styles.label}>Longitude</Text>
      <TextInput style={styles.input} value={longitude} onChangeText={setLongitude} />

      <Text style={styles.label}>Nombre de faces</Text>
      <TextInput
        style={styles.input}
        value={nombreFaces}
        onChangeText={setNombreFaces}
        keyboardType="numeric"
      />

      <TouchableOpacity style={styles.primaryButton} onPress={onSubmit} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryText}>Continuer</Text>
        )}
      </TouchableOpacity>

      {!!statusMessage && <Text style={styles.statusText}>{statusMessage}</Text>}
      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#F8F9FB",
  },
  label: {
    fontWeight: "600",
    marginBottom: 6,
    marginTop: 8,
  },
  projectBadge: {
    marginTop: 8,
    marginBottom: 8,
    fontWeight: "700",
    color: "#111827",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
  },
  zoneHint: {
    color: "#2563EB",
    fontWeight: "700",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  secondaryButton: {
    marginTop: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#2563EB",
    borderRadius: 16,
    paddingVertical: 10,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#2563EB",
    fontWeight: "600",
  },
  primaryButton: {
    marginTop: 16,
    backgroundColor: "#2563EB",
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
  },
  primaryText: {
    color: "#fff",
    fontWeight: "700",
  },
  errorText: {
    marginTop: 12,
    color: "#DC2626",
  },
  statusText: {
    marginTop: 10,
    color: "#16A34A",
    fontWeight: "600",
  },
});
