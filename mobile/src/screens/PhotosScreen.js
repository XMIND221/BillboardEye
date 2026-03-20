import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { getSelectedProject } from "../services/projectStorage";
import { addPhoto, isNetworkError } from "../services/api";
import {
  STATUS_ERROR,
  STATUS_PENDING,
  STATUS_SYNCED,
  savePhotoOffline,
  updatePanneauStatus,
  updatePanneauStatusByServerId,
} from "../services/offlineStorage";
import { getMissionProgress, markZoneCompleted } from "../services/missionStorage";

export default function PhotoScreen({ route, navigation }) {
  const { panneau } = route.params;
  const missionContext = route.params?.missionContext || null;
  const panneauId = panneau.id;
  const [faceAUri, setFaceAUri] = useState("");
  const [faceBUri, setFaceBUri] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const isProofReady = Boolean(faceAUri && faceBUri && panneau?.localisation?.latitude && panneau?.createdAt);

  const compressImage = async (uri) => {
    const compressed = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1280 } }],
      { compress: 0.65, format: ImageManipulator.SaveFormat.JPEG },
    );
    return compressed.uri;
  };

  useEffect(() => {
    const requestPermissions = async () => {
      await ImagePicker.requestMediaLibraryPermissionsAsync();
      await ImagePicker.requestCameraPermissionsAsync();
    };

    requestPermissions();
  }, []);

  const takePhoto = async (setter) => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.length) {
      setter(result.assets[0].uri);
    }
  };

  const uploadPhotos = async () => {
    const hasRequiredPanelData = Boolean(
      panneau?.entreprise &&
        panneau?.localisation?.latitude !== undefined &&
        panneau?.localisation?.longitude !== undefined,
    );
    const hasBothFaces = Boolean(faceAUri && faceBUri);

    if (!hasRequiredPanelData || !hasBothFaces) {
      setError("Veuillez completer toutes les informations");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setStatusMessage("Synchronisation en cours");
      let savedOfflineCount = 0;
      let successfulUploads = 0;
      let hardError = false;

      const faces = [
        { type: "faceA", uri: faceAUri },
        { type: "faceB", uri: faceBUri },
      ];

      for (const face of faces) {
        const compressedUri = await compressImage(face.uri);
        const form = new FormData();
        form.append("panneauId", panneau.serverId || panneau.id);
        form.append("type", face.type);
        form.append("image", {
          uri: compressedUri,
          name: `${face.type}-${Date.now()}.jpg`,
          type: "image/jpeg",
        });

        try {
          if (panneau.serverId || !String(panneauId).startsWith("offline-")) {
            await addPhoto(form);
            successfulUploads += 1;
          } else {
            throw new Error("Panneau local non synchronise");
          }
        } catch (err) {
          if (!isNetworkError(err)) {
            hardError = true;
            await updatePanneauStatus(panneau.localId || panneau.id, STATUS_ERROR, {
              lastError: err.message,
            });
            setError("Veuillez completer toutes les informations");
            break;
          }

          await savePhotoOffline({
            localId: `${face.type}-${Date.now()}`,
            panneauLocalId: panneau.localId || panneau.id,
            panneauId: panneau.serverId || null,
            type: face.type,
            url: compressedUri,
            createdAt: new Date().toISOString(),
            statut: STATUS_PENDING,
          });
          savedOfflineCount += 1;
        }
      }

      if (hardError) {
        return;
      }

      if (savedOfflineCount > 0) {
        await updatePanneauStatus(panneau.localId || panneau.id, STATUS_PENDING);
        setStatusMessage("Sauvegarde localement");
        Alert.alert("Mode hors ligne", "Erreur reseau, donnees sauvegardees");
      } else if (successfulUploads === 2) {
        await updatePanneauStatus(panneau.localId || panneau.id, STATUS_SYNCED, { serverId: panneau.serverId });
        if (panneau.serverId) {
          await updatePanneauStatusByServerId(panneau.serverId, STATUS_SYNCED);
        }
        setStatusMessage("Envoye avec succes");
        Alert.alert("Succes", "Synchronisation reussie");
      } else {
        await updatePanneauStatus(panneau.localId || panneau.id, STATUS_ERROR, {
          lastError: "Etat de synchronisation incomplet",
        });
        Alert.alert("Attention", "Erreur reseau, donnees sauvegardees");
      }

      if (missionContext?.projectId && missionContext?.zone) {
        await markZoneCompleted(missionContext.projectId, missionContext.zone);
        const next = await getMissionProgress(missionContext.projectId, missionContext.zones || []);
        if (next.nextZone) {
          const selectedProjet = await getSelectedProject();
          navigation.replace("ZoneSelection", {
            mission: selectedProjet || {
              id: missionContext.projectId,
              nom: missionContext.missionName || "Mission",
              entreprise: missionContext.client || "",
            },
            zones: missionContext.zones || [],
            suggestedZone: next.nextZone,
          });
        } else {
          const selectedProjet = await getSelectedProject();
          navigation.replace("MissionComplete", {
            mission: selectedProjet || {
              id: missionContext.projectId,
              nom: missionContext.missionName || "Mission",
              entreprise: missionContext.client || "",
            },
          });
        }
      } else {
        navigation.navigate("Success", { panneau });
      }
    } catch (err) {
      await updatePanneauStatus(panneau.localId || panneau.id, STATUS_ERROR, {
        lastError: err.message,
      });
      setStatusMessage("");
      setError(err.message || "Erreur reseau, donnees sauvegardees");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.screenTitle}>Preuve terrain</Text>
      <Text style={styles.screenSubtitle}>Capture les preuves visuelles du panneau.</Text>

      <View style={styles.block}>
        <Text style={styles.blockTitle}>Face A {faceAUri ? "✔" : ""}</Text>
        <TouchableOpacity style={styles.photoButton} onPress={() => takePhoto(setFaceAUri)}>
          <Text style={styles.photoButtonText}>Prendre photo Face A</Text>
        </TouchableOpacity>
        {!!faceAUri && <Image source={{ uri: faceAUri }} style={styles.preview} />}
      </View>

      <View style={styles.block}>
        <Text style={styles.blockTitle}>Face B {faceBUri ? "✔" : ""}</Text>
        <TouchableOpacity style={styles.photoButton} onPress={() => takePhoto(setFaceBUri)}>
          <Text style={styles.photoButtonText}>Prendre photo Face B</Text>
        </TouchableOpacity>
        {!!faceBUri && <Image source={{ uri: faceBUri }} style={styles.preview} />}
      </View>

      <View style={styles.validationCard}>
        <Text style={styles.validationTitle}>Checklist preuve</Text>
        <Text style={styles.checkRow}>Face A {faceAUri ? "✔" : "○"}</Text>
        <Text style={styles.checkRow}>Face B {faceBUri ? "✔" : "○"}</Text>
        <Text style={styles.checkRow}>GPS {panneau?.localisation?.latitude ? "✔" : "○"}</Text>
        <Text style={styles.checkRow}>Date {panneau?.createdAt ? "✔" : "○"}</Text>
        {isProofReady ? <Text style={styles.validatedTag}>Preuve validee</Text> : null}
      </View>

      <TouchableOpacity
        style={[styles.sendButton, (!faceAUri || !faceBUri) && styles.sendButtonDisabled]}
        onPress={uploadPhotos}
        disabled={loading || !faceAUri || !faceBUri}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.sendText}>Terminer</Text>}
      </TouchableOpacity>

      {!faceAUri || !faceBUri ? <Text style={styles.hint}>Face A et Face B sont obligatoires.</Text> : null}
      {!!statusMessage && <Text style={styles.statusText}>{statusMessage}</Text>}
      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#F8F9FB",
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 4,
  },
  screenSubtitle: {
    color: "#4B5563",
    marginBottom: 12,
  },
  block: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  blockTitle: {
    fontWeight: "700",
    marginBottom: 8,
  },
  validationCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  validationTitle: {
    fontWeight: "800",
    marginBottom: 8,
  },
  checkRow: {
    color: "#374151",
    marginBottom: 4,
  },
  validatedTag: {
    marginTop: 6,
    color: "#16A34A",
    fontWeight: "800",
  },
  photoButton: {
    borderWidth: 1,
    borderColor: "#2563EB",
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  photoButtonText: {
    color: "#2563EB",
    fontWeight: "700",
  },
  preview: {
    width: "100%",
    height: 180,
    borderRadius: 16,
    marginBottom: 14,
  },
  sendButton: {
    marginTop: 8,
    backgroundColor: "#16A34A",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#9CA3AF",
  },
  sendText: {
    color: "#fff",
    fontWeight: "700",
  },
  hint: {
    marginTop: 8,
    color: "#6B7280",
  },
  statusText: {
    marginTop: 10,
    color: "#16A34A",
    fontWeight: "600",
  },
  errorText: {
    marginTop: 10,
    color: "#DC2626",
  },
});
