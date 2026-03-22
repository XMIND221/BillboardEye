import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Alert, ScrollView } from "react-native";
import { theme } from "../theme";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import * as ImageManipulator from "expo-image-manipulator";
import { addPhoto, createPanneau } from "../services/api";
import { getMissionProgress, markZoneCompleted } from "../services/missionStorage";
import { savePanneauOffline, STATUS_SYNCED } from "../services/offlineStorage";
import Button from "../components/Button";

/** Plus petit = upload plus rapide sur mobile (qualité encore correcte pour le terrain). */
const compressImage = async (uri) => {
  const compressed = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1024 } }],
    { compress: 0.58, format: ImageManipulator.SaveFormat.JPEG },
  );
  return compressed.uri;
};

/** React Native : utiliser { uri, name, type } — les Blob dans FormData provoquent souvent « Network request failed ». */
const appendImageField = (formData, fieldName, fileUri, filename) => {
  formData.append(fieldName, {
    uri: fileUri,
    name: filename,
    type: "image/jpeg",
  });
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
  const [loadingHint, setLoadingHint] = useState("");
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
        setError("GPS indisponible. Réessayez en extérieur.");
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
      setLoadingHint("");
      setError("");

      let finalGps = gps;
      const hasGps = Number.isFinite(gps.latitude) && Number.isFinite(gps.longitude);
      if (!hasGps) {
        try {
          const position = await Location.getCurrentPositionAsync({});
          finalGps = {
            latitude: Number(position.coords.latitude),
            longitude: Number(position.coords.longitude),
          };
          setGps(finalGps);
        } catch (_) {
          setError("GPS indisponible. Réessayez en extérieur.");
          setLoading(false);
          return;
        }
      } else {
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }).then((position) => {
          setGps({
            latitude: Number(position.coords.latitude),
            longitude: Number(position.coords.longitude),
          });
        }).catch(() => {});
      }

      setLoadingHint("Préparation des photos…");
      const [compressedA, compressedB] = await Promise.all([
        compressImage(faceAUri),
        compressImage(faceBUri),
      ]);

      setLoadingHint("Enregistrement du panneau…");
      const panneau = await createPanneau({
        entreprise: mission?.entreprise || "Client",
        projetId: mission?.id,
        nomZone: zone || undefined,
        adresse: zone,
        latitude: finalGps.latitude,
        longitude: finalGps.longitude,
        nombreFaces: 2,
        createdAt: capturedAt,
      });

      const ts = Date.now();
      const buildForm = (type, compressedUri) => {
        const formData = new FormData();
        formData.append("panneauId", String(panneau.id));
        formData.append("type", type);
        appendImageField(formData, "image", compressedUri, `${type}-${ts}.jpg`);
        return formData;
      };

      setLoadingHint("Envoi des photos…");
      const [photoA, photoB] = await Promise.all([
        addPhoto(buildForm("faceA", compressedA)),
        addPhoto(buildForm("faceB", compressedB)),
      ]);

      const photos = {};
      if (photoA?.url) photos.faceA = { url: photoA.url };
      if (photoB?.url) photos.faceB = { url: photoB.url };

      setLoadingHint("Finalisation…");
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
        nomZone: zone || panneau.nomZone,
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
      setLoadingHint("");
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

      <Button
        title="Valider panneau"
        variant="success"
        onPress={validatePanel}
        disabled={!canValidate || loading}
        loading={loading}
        style={[styles.validateButton, !canValidate && styles.validateDisabled]}
      />
      {loading && !!loadingHint && <Text style={styles.loadingHint}>{loadingHint}</Text>}

      {!!error && <Text style={styles.error}>{error}</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: theme.colors.background, padding: theme.spacing.lg, paddingBottom: theme.spacing.xxl },
  header: { marginBottom: theme.spacing.lg },
  title: { fontSize: 24, fontWeight: "800", color: theme.colors.text, marginBottom: 6 },
  meta: { color: theme.colors.textSecondary, fontSize: 14, marginBottom: 4 },
  actionButton: {
    marginTop: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.accent,
    borderRadius: theme.radius.lg,
    paddingVertical: 20,
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    ...theme.shadows.sm,
  },
  actionText: { color: theme.colors.accent, fontWeight: "700", fontSize: 16 },
  preview: { marginTop: theme.spacing.sm, width: "100%", height: 180, borderRadius: theme.radius.lg },
  validateButton: { marginTop: theme.spacing.xl },
  validateDisabled: { opacity: 0.5 },
  loadingHint: {
    marginTop: theme.spacing.sm,
    textAlign: "center",
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  error: { color: theme.colors.error, marginTop: theme.spacing.md, fontSize: 14 },
});
