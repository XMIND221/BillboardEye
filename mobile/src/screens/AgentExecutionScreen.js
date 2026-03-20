import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Alert, ScrollView } from "react-native";
import { theme } from "../theme";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import * as ImageManipulator from "expo-image-manipulator";
import { addPhoto, createPanneau } from "../services/api";
import { getMissionProgress, markZoneCompleted } from "../services/missionStorage";
import { savePanneauOffline, STATUS_SYNCED } from "../services/offlineStorage";

const compressImage = async (uri) => {
  const compressed = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1280 } }],
    { compress: 0.65, format: ImageManipulator.SaveFormat.JPEG },
  );
  return compressed.uri;
};

const uriToBlob = async (uri) => {
  const response = await fetch(uri);
  return await response.blob();
};

export default function AgentExecutionScreen({ navigation, route }) {
  const mission = route.params?.mission;
  const zone = route.params?.zone || "";
  const zones = route.params?.zones || [];
  const [faceAUri, setFaceAUri] = useState("");
  const [faceBUri, setFaceBUri] = useState("");
  const [gps, setGps] = useState({ latitude: null, longitude: null });
  const [capturedAt, setCapturedAt] = useState(new Date().toISOString());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canValidate = useMemo(() => Boolean(faceAUri && faceBUri), [faceAUri, faceBUri]);

  useEffect(() => {
    const bootstrap = async () => {
      await ImagePicker.requestCameraPermissionsAsync();
      await Location.requestForegroundPermissionsAsync();
      try {
        const position = await Location.getCurrentPositionAsync({});
        setGps({
          latitude: Number(position.coords.latitude),
          longitude: Number(position.coords.longitude),
        });
      } catch (_error) {
        setError("GPS indisponible. Reessaie en exterieur.");
      }
      setCapturedAt(new Date().toISOString());
    };
    bootstrap();
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

  const validatePanel = async () => {
    if (!canValidate) {
      setError("Validation impossible sans Face A et Face B.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      // Capture GPS au moment exact de la validation (position à la prise de photo)
      let finalGps = gps;
      try {
        const position = await Location.getCurrentPositionAsync({});
        finalGps = {
          latitude: Number(position.coords.latitude),
          longitude: Number(position.coords.longitude),
        };
        setGps(finalGps);
      } catch (_) {
        if (!gps.latitude || !gps.longitude) {
          setError("GPS indisponible. Reessaie en exterieur.");
          setLoading(false);
          return;
        }
      }

      const panneau = await createPanneau({
        entreprise: mission?.entreprise || "Client",
        projetId: mission?.id,
        adresse: zone,
        latitude: finalGps.latitude,
        longitude: finalGps.longitude,
        nombreFaces: 2,
        createdAt: capturedAt,
      });

      const uploads = [
        { type: "faceA", uri: faceAUri },
        { type: "faceB", uri: faceBUri },
      ];

      const photos = {};
      for (const item of uploads) {
        const compressedUri = await compressImage(item.uri);
        const blob = await uriToBlob(compressedUri);
        const formData = new FormData();
        formData.append("panneauId", panneau.id);
        formData.append("type", item.type);
        formData.append("image", blob, `${item.type}-${Date.now()}.jpg`);
        const photo = await addPhoto(formData);
        if (photo?.url) {
          photos[item.type] = { url: photo.url };
        }
      }

      const localisation = panneau.localisation || {
        adresse: zone,
        latitude: finalGps.latitude,
        longitude: finalGps.longitude,
      };
      await savePanneauOffline({
        localId: `local-${panneau.id}`,
        serverId: panneau.id,
        entreprise: panneau.entreprise || mission?.entreprise || "Client",
        projetId: panneau.projetId || mission?.id,
        localisation,
        nombreFaces: panneau.nombreFaces || 2,
        statut: STATUS_SYNCED,
        createdAt: panneau.createdAt || capturedAt,
        photos: Object.keys(photos).length ? photos : null,
      });

      await markZoneCompleted(mission.id, zone);
      const next = await getMissionProgress(mission.id, zones);

      Alert.alert("Succès", "Panneau validé et enregistré avec les photos.", [
        {
          text: "OK",
          onPress: () => {
            if (next.nextZone) {
              navigation.replace("AgentZoneSelection", {
                mission,
                zones,
                suggestedZone: next.nextZone,
              });
            } else {
              navigation.replace("AgentMissionComplete", { mission });
            }
          },
        },
      ]);
    } catch (err) {
      setError(err.message || "Erreur de validation panneau.");
      Alert.alert("Erreur", err.message || "Validation impossible.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Exécution terrain</Text>
        <Text style={styles.meta}>Zone: {zone || "-"}</Text>
        <Text style={styles.meta}>{new Date(capturedAt).toLocaleString("fr-FR")}</Text>
      </View>

      <TouchableOpacity style={styles.actionButton} onPress={() => takePhoto(setFaceAUri)} activeOpacity={0.85}>
        <Text style={styles.actionText}>Face A {faceAUri ? "✓" : ""}</Text>
      </TouchableOpacity>
      {!!faceAUri && <Image source={{ uri: faceAUri }} style={styles.preview} />}

      <TouchableOpacity style={styles.actionButton} onPress={() => takePhoto(setFaceBUri)} activeOpacity={0.85}>
        <Text style={styles.actionText}>Face B {faceBUri ? "✓" : ""}</Text>
      </TouchableOpacity>
      {!!faceBUri && <Image source={{ uri: faceBUri }} style={styles.preview} />}

      <TouchableOpacity
        style={[styles.validateButton, !canValidate && styles.validateDisabled]}
        onPress={validatePanel}
        disabled={loading || !canValidate}
        activeOpacity={0.85}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.validateText}>Valider panneau</Text>}
      </TouchableOpacity>

      {!!error && <Text style={styles.error}>{error}</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: theme.colors.background, padding: theme.spacing.md },
  header: { marginBottom: theme.spacing.lg },
  title: { fontSize: 22, fontWeight: "800", color: theme.colors.text, marginBottom: 6 },
  meta: { color: theme.colors.textSecondary, fontSize: 14, marginBottom: 4 },
  actionButton: {
    marginTop: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.accent,
    borderRadius: theme.radius.lg,
    paddingVertical: 16,
    alignItems: "center",
    backgroundColor: theme.colors.primaryLight,
  },
  actionText: { color: theme.colors.accent, fontWeight: "700", fontSize: 16 },
  preview: { marginTop: theme.spacing.sm, width: "100%", height: 180, borderRadius: theme.radius.md },
  validateButton: {
    marginTop: theme.spacing.lg,
    backgroundColor: theme.colors.success,
    borderRadius: theme.radius.lg,
    paddingVertical: 16,
    alignItems: "center",
  },
  validateDisabled: { backgroundColor: theme.colors.textMuted },
  validateText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  error: { color: theme.colors.error, marginTop: theme.spacing.md, fontSize: 14 },
});
