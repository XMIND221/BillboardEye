import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
  TextInput,
  Linking,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import * as ImageManipulator from "expo-image-manipulator";
import { addPhoto, createPanneau, createProjet, getProjets, getProjetPDFUrl } from "../services/api";
import { savePanneauOffline, STATUS_SYNCED } from "../services/offlineStorage";
import { parseZones } from "../services/missionStorage";
import { useAuth } from "../contexts/AuthContext";
import { theme } from "../theme";
import Button from "../components/Button";

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

const parseCoord = (val) => {
  const n = parseFloat(String(val || "").trim());
  return Number.isFinite(n) ? n : 0;
};

export default function UploadPanneauScreen({ navigation }) {
  const { session } = useAuth();
  const userEmail = session?.user?.email?.toLowerCase() || "";

  const [modeNewCampaign, setModeNewCampaign] = useState(false);
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const [newCampaignNom, setNewCampaignNom] = useState("");
  const [newCampaignEntreprise, setNewCampaignEntreprise] = useState("");
  const [newCampaignZone, setNewCampaignZone] = useState("");
  const [adresse, setAdresse] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [faceAUri, setFaceAUri] = useState("");
  const [faceBUri, setFaceBUri] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const filteredCampaigns = useMemo(() => {
    if (!userEmail) return campaigns;
    return campaigns.filter((p) => {
      const agent = (p.assignedAgent || "").toLowerCase().trim();
      return !agent || agent === userEmail;
    });
  }, [campaigns, userEmail]);

  const selectedCampaign = useMemo(
    () => campaigns.find((c) => c.id === selectedCampaignId) || null,
    [campaigns, selectedCampaignId],
  );

  const canValidate = useMemo(() => {
    const hasImages = Boolean(faceAUri && faceBUri);
    const hasAdresse = Boolean(adresse.trim());
    if (modeNewCampaign) {
      return hasImages && hasAdresse && newCampaignNom.trim() && newCampaignEntreprise.trim();
    }
    return hasImages && hasAdresse && selectedCampaignId;
  }, [faceAUri, faceBUri, adresse, modeNewCampaign, newCampaignNom, newCampaignEntreprise, selectedCampaignId]);

  const loadCampaigns = useCallback(async () => {
    try {
      setError("");
      const list = await getProjets();
      const items = list.map((item) => ({
        ...item,
        zones: parseZones(item.zone),
      }));
      setCampaigns(items);
      if (items.length > 0 && !selectedCampaignId) {
        const filtered = userEmail
          ? items.filter((p) => {
              const agent = (p.assignedAgent || "").toLowerCase().trim();
              return !agent || agent === userEmail;
            })
          : items;
        if (filtered.length > 0) setSelectedCampaignId(filtered[0].id);
      }
    } catch (err) {
      setError(err.message || "Impossible de charger les campagnes.");
    }
  }, [userEmail]);

  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true);
      await loadCampaigns();
      setLoading(false);
    };
    bootstrap();
  }, [loadCampaigns]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      if (!loading) loadCampaigns();
    });
    return unsubscribe;
  }, [loadCampaigns, loading, navigation]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCampaigns();
    setRefreshing(false);
  };

  useEffect(() => {
    const getGps = async () => {
      try {
        await Location.requestForegroundPermissionsAsync();
        const position = await Location.getCurrentPositionAsync({});
        setLatitude(String(position.coords.latitude?.toFixed(6) || ""));
        setLongitude(String(position.coords.longitude?.toFixed(6) || ""));
      } catch (_) {}
    };
    getGps();
  }, []);

  const refreshGps = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setError("Permission localisation requise.");
        return;
      }
      const position = await Location.getCurrentPositionAsync({});
      setLatitude(String(position.coords.latitude?.toFixed(6) || ""));
      setLongitude(String(position.coords.longitude?.toFixed(6) || ""));
      setError("");
    } catch (_) {
      setError("Position impossible. Saisissez les coordonnées manuellement.");
    }
  };

  const pickFromGallery = async (setter) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      setError("Permission galerie requise.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsMultipleSelection: false,
    });
    if (!result.canceled && result.assets?.length) {
      setter(result.assets[0].uri);
      setError("");
    }
  };

  const handleCreate = async () => {
    if (!canValidate) {
      setError("Campagne, adresse, Face A et Face B sont obligatoires.");
      return;
    }

    const lat = parseCoord(latitude);
    const lng = parseCoord(longitude);

    try {
      setSaving(true);
      setError("");

      let projetId = selectedCampaignId;
      let entreprise = selectedCampaign?.entreprise || "Client";

      if (modeNewCampaign) {
        const created = await createProjet({
          nom: newCampaignNom.trim(),
          entreprise: newCampaignEntreprise.trim(),
          zone: newCampaignZone.trim(),
          assignedAgent: userEmail || undefined,
        });
        projetId = created.id;
        entreprise = created.entreprise || newCampaignEntreprise.trim();
      }

      const panneau = await createPanneau({
        entreprise,
        projetId,
        adresse: adresse.trim(),
        latitude: lat,
        longitude: lng,
        nombreFaces: 2,
        createdAt: new Date().toISOString(),
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

      const localisation = {
        adresse: adresse.trim(),
        latitude: lat,
        longitude: lng,
      };
      await savePanneauOffline({
        localId: `local-${panneau.id}`,
        serverId: panneau.id,
        entreprise: panneau.entreprise || entreprise,
        projetId,
        localisation,
        nombreFaces: 2,
        statut: STATUS_SYNCED,
        createdAt: panneau.createdAt,
        photos: Object.keys(photos).length ? photos : null,
      });

      const finalProjetId = projetId;

      Alert.alert("Succès", "Panneau enregistré avec les photos.", [
        {
          text: "Exporter PDF",
          onPress: async () => {
            try {
              const result = await getProjetPDFUrl(finalProjetId);
              if (result?.url) {
                await Linking.openURL(result.url);
              } else {
                Alert.alert("Erreur", "URL PDF indisponible.");
              }
            } catch (err) {
              Alert.alert("Erreur", err.message || "Impossible de générer le PDF.");
            }
            navigation.navigate("AgentMissions");
          },
        },
        {
          text: "Ajouter un autre",
          onPress: async () => {
            setFaceAUri("");
            setFaceBUri("");
            setAdresse("");
            if (modeNewCampaign) {
              setModeNewCampaign(false);
              setSelectedCampaignId(finalProjetId);
              setNewCampaignNom("");
              setNewCampaignEntreprise("");
              setNewCampaignZone("");
              await loadCampaigns();
            }
            setSaving(false);
          },
        },
        {
          text: "Retour missions",
          onPress: () => navigation.navigate("AgentMissions"),
        },
      ]);
    } catch (err) {
      setError(err.message || "Erreur lors de l'enregistrement.");
      Alert.alert("Erreur", err.message || "Enregistrement impossible.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  const content = (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.accent} />
      }
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Mode Upload</Text>
      <Text style={styles.subtitle}>Ajoutez un panneau à partir d'images déjà sur votre appareil.</Text>

      {!!error && <Text style={styles.error}>{error}</Text>}

      <Text style={styles.label}>Type de campagne</Text>
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleButton, !modeNewCampaign && styles.toggleSelected]}
          onPress={() => setModeNewCampaign(false)}
          activeOpacity={0.85}
        >
          <Text style={[styles.toggleText, !modeNewCampaign && styles.toggleTextSelected]}>
            Campagne existante
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, modeNewCampaign && styles.toggleSelected]}
          onPress={() => setModeNewCampaign(true)}
          activeOpacity={0.85}
        >
          <Text style={[styles.toggleText, modeNewCampaign && styles.toggleTextSelected]}>
            Nouvelle campagne
          </Text>
        </TouchableOpacity>
      </View>

      {modeNewCampaign ? (
        <>
          <Text style={styles.label}>Nom de la campagne</Text>
          <TextInput
            style={styles.input}
            value={newCampaignNom}
            onChangeText={(t) => { setNewCampaignNom(t); setError(""); }}
            placeholder="ex: Campagne Dakar 2025"
            placeholderTextColor={theme.colors.textMuted}
          />
          <Text style={styles.label}>Client / Entreprise</Text>
          <TextInput
            style={styles.input}
            value={newCampaignEntreprise}
            onChangeText={(t) => { setNewCampaignEntreprise(t); setError(""); }}
            placeholder="ex: Acme Corp"
            placeholderTextColor={theme.colors.textMuted}
          />
          <Text style={styles.label}>Zones (optionnel)</Text>
          <TextInput
            style={styles.input}
            value={newCampaignZone}
            onChangeText={setNewCampaignZone}
            placeholder="ex: Plateau, Medina, Almadies"
            placeholderTextColor={theme.colors.textMuted}
          />
        </>
      ) : (
        <>
          <Text style={styles.label}>Campagne</Text>
          {filteredCampaigns.length === 0 ? (
            <View style={styles.emptyBlock}>
              <Text style={styles.emptyText}>Aucune campagne disponible.</Text>
              <TouchableOpacity style={styles.retryButton} onPress={loadCampaigns} activeOpacity={0.85}>
                <Text style={styles.retryText}>Réessayer</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
              {filteredCampaigns.map((item) => {
                const selected = item.id === selectedCampaignId;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.chip, selected && styles.chipSelected]}
                    onPress={() => setSelectedCampaignId(item.id)}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]} numberOfLines={1}>
                      {item.nom}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </>
      )}

      <Text style={styles.label}>Zone / Adresse</Text>
      <TextInput
        style={styles.input}
        value={adresse}
        onChangeText={(t) => { setAdresse(t); setError(""); }}
        placeholder="ex: Plateau, Rue X..."
        placeholderTextColor={theme.colors.textMuted}
      />

      <Text style={styles.label}>GPS (optionnel)</Text>
      <View style={styles.gpsRow}>
        <TextInput
          style={[styles.input, styles.gpsInput]}
          value={latitude}
          onChangeText={setLatitude}
          placeholder="Latitude"
          placeholderTextColor={theme.colors.textMuted}
          keyboardType="numeric"
        />
        <TextInput
          style={[styles.input, styles.gpsInput]}
          value={longitude}
          onChangeText={setLongitude}
          placeholder="Longitude"
          placeholderTextColor={theme.colors.textMuted}
          keyboardType="numeric"
        />
      </View>
      <TouchableOpacity style={styles.gpsRefreshButton} onPress={refreshGps} activeOpacity={0.85}>
        <Text style={styles.gpsRefreshText}>Utiliser ma position actuelle</Text>
      </TouchableOpacity>

      <Text style={styles.label}>Face A</Text>
      <TouchableOpacity style={styles.imageButton} onPress={() => pickFromGallery(setFaceAUri)} activeOpacity={0.85}>
        <Text style={styles.imageButtonText}>Choisir image {faceAUri ? "✓" : ""}</Text>
      </TouchableOpacity>
      {!!faceAUri && <Image source={{ uri: faceAUri }} style={styles.preview} />}

      <Text style={styles.label}>Face B</Text>
      <TouchableOpacity style={styles.imageButton} onPress={() => pickFromGallery(setFaceBUri)} activeOpacity={0.85}>
        <Text style={styles.imageButtonText}>Choisir image {faceBUri ? "✓" : ""}</Text>
      </TouchableOpacity>
      {!!faceBUri && <Image source={{ uri: faceBUri }} style={styles.preview} />}

      <Button
        title="Créer et enregistrer"
        variant="success"
        onPress={handleCreate}
        disabled={!canValidate || saving}
        loading={saving}
        style={[styles.submitButton, (!canValidate || saving) && styles.submitDisabled]}
      />
    </ScrollView>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      {content}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.colors.background },
  container: { flex: 1, backgroundColor: theme.colors.background },
  scrollContent: { flexGrow: 1, padding: theme.spacing.lg, paddingBottom: theme.spacing.xxl },
  title: { fontSize: 24, fontWeight: "800", color: theme.colors.text, marginBottom: 4 },
  subtitle: { fontSize: 15, color: theme.colors.textSecondary, marginBottom: theme.spacing.lg },
  label: { fontSize: 14, fontWeight: "600", color: theme.colors.textSecondary, marginBottom: theme.spacing.sm },
  toggleRow: { flexDirection: "row", gap: theme.spacing.sm, marginBottom: theme.spacing.md },
  toggleButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: theme.radius.lg,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: "center",
    ...theme.shadows.sm,
  },
  toggleSelected: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
  toggleText: { color: theme.colors.text, fontWeight: "600", fontSize: 14 },
  toggleTextSelected: { color: "#fff" },
  emptyBlock: { marginBottom: theme.spacing.md },
  emptyText: { color: theme.colors.textMuted, marginBottom: theme.spacing.sm },
  retryButton: {
    alignSelf: "flex-start",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: theme.radius.md,
    borderWidth: 2,
    borderColor: theme.colors.accent,
  },
  retryText: { color: theme.colors.accent, fontWeight: "600", fontSize: 14 },
  chipsScroll: { marginBottom: theme.spacing.md },
  chip: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginRight: theme.spacing.sm,
    borderWidth: 2,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  chipSelected: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
  chipText: { color: theme.colors.text, fontWeight: "700", fontSize: 15 },
  chipTextSelected: { color: "#fff" },
  input: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.text,
  },
  gpsRow: { flexDirection: "row", gap: theme.spacing.sm },
  gpsInput: { flex: 1 },
  gpsRefreshButton: {
    alignSelf: "flex-start",
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginBottom: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: 2,
    borderColor: theme.colors.accent,
  },
  gpsRefreshText: { color: theme.colors.accent, fontWeight: "600", fontSize: 14 },
  imageButton: {
    borderWidth: 2,
    borderColor: theme.colors.accent,
    borderRadius: theme.radius.lg,
    paddingVertical: 20,
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  imageButtonText: { color: theme.colors.accent, fontWeight: "700", fontSize: 16 },
  preview: { width: "100%", height: 160, borderRadius: theme.radius.lg, marginBottom: theme.spacing.md },
  submitButton: { marginTop: theme.spacing.xl },
  submitDisabled: { opacity: 0.5 },
  error: { color: theme.colors.error, marginBottom: theme.spacing.md, fontSize: 14 },
});
