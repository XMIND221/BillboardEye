import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform,
} from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { theme } from "../theme";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import * as ImageManipulator from "expo-image-manipulator";
import { addPhoto, addVideo, createPanneau, isNetworkError } from "../services/api";
import { getMissionProgress, markZoneCompleted } from "../services/missionStorage";
import { savePanneauOffline, savePhotoOffline, STATUS_PENDING, STATUS_SYNCED } from "../services/offlineStorage";
import { useToast } from "../contexts/ToastContext";
import { useNetworkSync } from "../contexts/NetworkSyncContext";
import Button from "../components/Button";
import AppHeader from "../components/AppHeader";

/** Plus petit = upload plus rapide sur mobile (qualité encore correcte pour le terrain). */
const compressImage = async (uri) => {
  const compressed = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1024 } }],
    { compress: 0.58, format: ImageManipulator.SaveFormat.JPEG },
  );
  return compressed.uri;
};

/** Web + mobile : adapte l'ajout d'image au FormData selon la plateforme. */
const appendImageField = async (formData, fieldName, fileUri, filename, mimeType = "image/jpeg") => {
  if (Platform.OS === "web") {
    const response = await fetch(fileUri);
    const blob = await response.blob();
    formData.append(fieldName, blob, filename);
    return;
  }
  formData.append(fieldName, {
    uri: fileUri,
    name: filename,
    type: mimeType,
  });
};

function computeOnline(state) {
  if (!state) return true;
  if (state.isConnected === false) return false;
  if (state.isInternetReachable === false) return false;
  return true;
}

const generateLocalId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const getAssetUriForPreview = (asset) => {
  const directUri = String(asset?.uri || "").trim();
  if (directUri) return directUri;
  // iOS PWA may provide File without stable uri.
  if (Platform.OS === "web" && asset?.file instanceof File) {
    return URL.createObjectURL(asset.file);
  }
  return "";
};
const getAssetDurationSec = (asset) => {
  const ms = Number(asset?.duration ?? 0);
  if (Number.isFinite(ms) && ms > 0) return Math.round(ms / 1000);
  return 0;
};

const isBlobUri = (value) => String(value || "").startsWith("blob:");

export default function AgentExecutionScreen({ navigation, route }) {
  const { showToast } = useToast();
  const { refreshQueueStats } = useNetworkSync();
  const mission = route.params?.mission;
  const zone = route.params?.zone || "";
  const zones = route.params?.zones || [];
  const [faceAUri, setFaceAUri] = useState("");
  const [faceBUri, setFaceBUri] = useState("");
  const [videoUri, setVideoUri] = useState("");
  const [videoDurationSec, setVideoDurationSec] = useState(0);
  const [gps, setGps] = useState({ latitude: null, longitude: null });
  const [capturedAt, setCapturedAt] = useState(new Date().toISOString());
  const [loading, setLoading] = useState(false);
  const [loadingHint, setLoadingHint] = useState("");
  const [error, setError] = useState("");
  const [allowNoGps, setAllowNoGps] = useState(false);

  const hasFullPhotoSet = useMemo(() => Boolean(faceAUri && faceBUri), [faceAUri, faceBUri]);
  const hasVideo = useMemo(() => Boolean(videoUri), [videoUri]);
  const canValidate = hasFullPhotoSet || hasVideo;
  const missingPhotoHint = useMemo(() => {
    if (canValidate) return "";
    if (!faceAUri && !faceBUri && !videoUri) return "Ajoutez Face A + Face B, ou une vidéo, pour valider.";
    if (videoUri) return "";
    if (!faceAUri && !faceBUri) return "Ajoutez Face A + Face B, ou une vidéo.";
    if (!faceAUri) return "Face A manquante (ou ajoutez une vidéo).";
    return "Face B manquante (ou ajoutez une vidéo).";
  }, [canValidate, faceAUri, faceBUri, videoUri]);

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
        /* GPS optionnel : hors bâtiment / offline */
      }
      setCapturedAt(new Date().toISOString());
    };
    bootstrap();
  }, []);

  useEffect(() => {
    return () => {
      if (Platform.OS !== "web") return;
      if (isBlobUri(faceAUri)) URL.revokeObjectURL(faceAUri);
      if (isBlobUri(faceBUri)) URL.revokeObjectURL(faceBUri);
      if (isBlobUri(videoUri)) URL.revokeObjectURL(videoUri);
    };
  }, [faceAUri, faceBUri, videoUri]);

  const takePhoto = async (setter) => {
    const openPicker =
      Platform.OS === "web" ? ImagePicker.launchImageLibraryAsync : ImagePicker.launchCameraAsync;
    const result = await openPicker({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsMultipleSelection: false,
    });
    if (!result.canceled && result.assets?.length) {
      const previewUri = getAssetUriForPreview(result.assets[0]);
      if (previewUri) {
        setter(previewUri);
        setError("");
      } else {
        setError("Photo non récupérée sur iPhone web. Réessayez via la galerie.");
      }
    }
  };

  const takeVideo = async () => {
    const openPicker =
      Platform.OS === "web" ? ImagePicker.launchImageLibraryAsync : ImagePicker.launchCameraAsync;
    const result = await openPicker({
      mediaTypes: ["videos"],
      allowsMultipleSelection: false,
      quality: 0.7,
      videoMaxDuration: 20,
    });
    if (!result.canceled && result.assets?.length) {
      const asset = result.assets[0];
      const previewUri = getAssetUriForPreview(asset);
      if (previewUri) {
        setVideoUri(previewUri);
        setVideoDurationSec(getAssetDurationSec(asset));
        setError("");
      } else {
        setError("Vidéo non récupérée. Réessayez.");
      }
    }
  };

  const resolveGps = async () => {
    let finalGps = { latitude: gps.latitude, longitude: gps.longitude };
    let hasRealGps = Number.isFinite(finalGps.latitude) && Number.isFinite(finalGps.longitude);
    if (!hasRealGps) {
      try {
        const position = await Location.getCurrentPositionAsync({});
        finalGps = {
          latitude: Number(position.coords.latitude),
          longitude: Number(position.coords.longitude),
        };
        hasRealGps = true;
        setGps(finalGps);
      } catch (_) {
        /* ignore */
      }
    }
    if (!hasRealGps && !allowNoGps) {
      return { ok: false, finalGps: null, hasRealGps: false };
    }
    if (!hasRealGps && allowNoGps) {
      finalGps = { latitude: 0, longitude: 0 };
    }
    return { ok: true, finalGps, hasRealGps };
  };

  const validatePanel = async () => {
    if (!canValidate) {
      setError("Ajoutez Face A + Face B, ou une vidéo.");
      return;
    }

    try {
      setLoading(true);
      setLoadingHint("");
      setError("");

      if (!mission?.id) {
        Alert.alert("Erreur", "Mission invalide.");
        setLoading(false);
        return;
      }

      const gpsResult = await resolveGps();
      if (!gpsResult.ok) {
        setError("GPS indisponible. Appuyez sur « Sans GPS » ou réessayez dehors.");
        setLoading(false);
        return;
      }
      const { finalGps, hasRealGps } = gpsResult;

      if (hasRealGps) {
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
          .then((position) => {
            setGps({
              latitude: Number(position.coords.latitude),
              longitude: Number(position.coords.longitude),
            });
          })
          .catch(() => {});
      }

      setLoadingHint("Préparation…");
      const compressedA = hasFullPhotoSet ? await compressImage(faceAUri) : "";
      const compressedB = hasFullPhotoSet ? await compressImage(faceBUri) : "";

      const netState = await NetInfo.fetch();
      const online = computeOnline(netState);

      const adresseLabel = hasRealGps ? String(zone || "") : `${zone} (sans GPS)`;

      const tryOnline = async () => {
        setLoadingHint("Enregistrement…");
        const panneau = await createPanneau({
          entreprise: mission?.entreprise || "Client",
          projetId: mission?.id,
          nomZone: zone || undefined,
          adresse: adresseLabel,
          latitude: finalGps.latitude,
          longitude: finalGps.longitude,
          nombreFaces: 2,
          createdAt: capturedAt,
        });

        const ts = Date.now();
        const buildForm = async (type, compressedUri) => {
          const formData = new FormData();
          formData.append("panneauId", String(panneau.id));
          formData.append("type", type);
          await appendImageField(formData, "image", compressedUri, `${type}-${ts}.jpg`);
          return formData;
        };

        let photoA = null;
        let photoB = null;
        if (hasFullPhotoSet) {
          setLoadingHint("Envoi photos…");
          const [formA, formB] = await Promise.all([
            buildForm("faceA", compressedA),
            buildForm("faceB", compressedB),
          ]);
          [photoA, photoB] = await Promise.all([
            addPhoto(formA),
            addPhoto(formB),
          ]);
        }

        let video = null;
        if (videoUri) {
          setLoadingHint("Envoi vidéo…");
          const videoForm = new FormData();
          videoForm.append("panneauId", String(panneau.id));
          await appendImageField(videoForm, "video", videoUri, `video-${ts}.mp4`, "video/mp4");
          try {
            video = await addVideo(videoForm);
          } catch (_videoErr) {
            // Non bloquant: on garde la validation panneau même si la vidéo échoue.
          }
        }

        const photos = {};
        if (photoA?.url) photos.faceA = { url: photoA.url };
        if (photoB?.url) photos.faceB = { url: photoB.url };

        const localisation = panneau.localisation || {
          adresse: adresseLabel,
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
          video: video?.url ? { url: video.url, durationSec: videoDurationSec || undefined } : null,
        });
      };

      if (online) {
        try {
          await tryOnline();
          await markZoneCompleted(mission.id, zone);
          const next = await getMissionProgress(mission.id, zones);
          showToast("Panneau enregistré");
          await refreshQueueStats();
          setLoadingHint("");
          setLoading(false);
          Alert.alert("Succès", "Panneau enregistré.", [
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
          return;
        } catch (err) {
          if (!isNetworkError(err)) {
            setError(err.message || "Erreur serveur.");
            Alert.alert("Erreur", err.message || "Validation impossible.");
            setLoading(false);
            setLoadingHint("");
            return;
          }
          /* Erreur réseau → enregistrement local ci-dessous */
        }
      }

      /* Hors ligne ou échec réseau : file locale */
      setLoadingHint("Sauvegarde locale…");
      const localPanneauId = generateLocalId("panneau");
      await savePanneauOffline({
        localId: localPanneauId,
        serverId: null,
        statut: STATUS_PENDING,
        entreprise: mission?.entreprise || "Client",
        projetId: mission?.id,
        nomZone: zone,
        localisation: {
          adresse: adresseLabel,
          latitude: finalGps.latitude,
          longitude: finalGps.longitude,
        },
        nombreFaces: 2,
        createdAt: capturedAt,
        photos: hasFullPhotoSet
          ? {
              faceA: { localUri: compressedA },
              faceB: { localUri: compressedB },
            }
          : null,
        video: hasVideo ? { localUri: videoUri, durationSec: videoDurationSec || undefined } : null,
      });
      if (hasFullPhotoSet) {
        await savePhotoOffline({
          panneauLocalId: localPanneauId,
          type: "faceA",
          url: compressedA,
        });
        await savePhotoOffline({
          panneauLocalId: localPanneauId,
          type: "faceB",
          url: compressedB,
        });
      }

      await markZoneCompleted(mission.id, zone);
      const next = await getMissionProgress(mission.id, zones);
      showToast("Enregistré hors ligne — sync automatique");
      await refreshQueueStats();
      setLoadingHint("");
      setLoading(false);

      Alert.alert("Hors ligne", "Données enregistrées sur l’appareil. Elles partiront avec le réseau.", [
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
      setError(err.message || "Erreur.");
      Alert.alert("Erreur", err.message || "Validation impossible.");
    } finally {
      setLoading(false);
      setLoadingHint("");
    }
  };

  return (
    <View style={styles.screen}>
      <AppHeader title="Exécution terrain" onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined} />
      <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Zone · photos</Text>
        <Text style={styles.meta}>{zone || "—"}</Text>
        <Text style={styles.stepHint}>1. Face A · 2. Face B · 3. Valider</Text>
        {Platform.OS === "web" ? (
          <Text style={styles.webHint}>iPhone web : sélectionnez la photo depuis la galerie.</Text>
        ) : null}
      </View>

      <TouchableOpacity style={styles.actionButton} onPress={() => takePhoto(setFaceAUri)} activeOpacity={0.85}>
        <Text style={styles.actionText}>Photo Face A {faceAUri ? " ✓" : ""}</Text>
      </TouchableOpacity>
      {!!faceAUri && <Image source={{ uri: faceAUri }} style={styles.preview} />}

      <TouchableOpacity style={styles.actionButton} onPress={() => takePhoto(setFaceBUri)} activeOpacity={0.85}>
        <Text style={styles.actionText}>Photo Face B {faceBUri ? " ✓" : ""}</Text>
      </TouchableOpacity>
      {!!faceBUri && <Image source={{ uri: faceBUri }} style={styles.preview} />}

      <TouchableOpacity style={styles.actionButton} onPress={takeVideo} activeOpacity={0.85}>
        <Text style={styles.actionText}>Vidéo (optionnel) {videoUri ? " ✓" : ""}</Text>
      </TouchableOpacity>
      {!!videoUri && (
        <Text style={styles.videoHint}>
          Vidéo ajoutée{videoDurationSec > 0 ? ` (${videoDurationSec}s)` : ""}.
        </Text>
      )}

      <Button
        title="Valider"
        variant="success"
        onPress={validatePanel}
        disabled={!canValidate || loading}
        loading={loading}
        style={[styles.validateButton, !canValidate && styles.validateDisabled]}
      />
      {!loading && !!missingPhotoHint ? <Text style={styles.validationHint}>{missingPhotoHint}</Text> : null}
      {loading && !!loadingHint && <Text style={styles.loadingHint}>{loadingHint}</Text>}

      <TouchableOpacity
        style={styles.gpsLink}
        onPress={() => {
          setAllowNoGps(true);
          setError("");
        }}
        activeOpacity={0.85}
      >
        <Text style={styles.gpsLinkText}>Sans GPS (bâtiment / précision faible)</Text>
      </TouchableOpacity>

      {!!error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity
        style={styles.backMissionButton}
        onPress={() => navigation.navigate("AgentMissionDetail", { mission })}
        activeOpacity={0.85}
      >
        <Text style={styles.backMissionText}>Retour mission</Text>
      </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flexGrow: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  header: { marginBottom: theme.spacing.lg },
  title: { fontSize: 22, fontWeight: "800", color: theme.colors.text, marginBottom: 6 },
  meta: { color: theme.colors.textSecondary, fontSize: 15, marginBottom: 4 },
  stepHint: { color: theme.colors.textMuted, fontSize: 13, fontWeight: "600" },
  webHint: { color: theme.colors.textMuted, fontSize: 12, marginTop: 6 },
  actionButton: {
    marginTop: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.accent,
    borderRadius: theme.radius.lg,
    paddingVertical: 22,
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    ...theme.shadows.sm,
  },
  actionText: { color: theme.colors.accent, fontWeight: "800", fontSize: 17 },
  preview: { marginTop: theme.spacing.sm, width: "100%", height: 180, borderRadius: theme.radius.lg },
  validateButton: { marginTop: theme.spacing.xl, minHeight: 52 },
  validateDisabled: { opacity: 0.5 },
  validationHint: {
    marginTop: theme.spacing.sm,
    textAlign: "center",
    color: theme.colors.textMuted,
    fontSize: 13,
  },
  loadingHint: {
    marginTop: theme.spacing.sm,
    textAlign: "center",
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  gpsLink: { marginTop: theme.spacing.md, paddingVertical: 12, alignItems: "center" },
  gpsLinkText: { color: theme.colors.primary, fontWeight: "700", fontSize: 14 },
  videoHint: { color: theme.colors.textMuted, fontSize: 13, marginTop: theme.spacing.xs },
  error: { color: theme.colors.error, marginTop: theme.spacing.md, fontSize: 14 },
  backMissionButton: {
    marginTop: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: theme.colors.surface,
  },
  backMissionText: { color: theme.colors.text, fontWeight: "600", fontSize: 14 },
});
