import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
} from "react-native";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../theme";
import Button from "../components/Button";
import AppHeader from "../components/AppHeader";
import { createPanneau, getProjets, updatePanneau } from "../services/api";
import { useToast } from "../contexts/ToastContext";

export default function ManagerPanneauFormScreen({ navigation, route }) {
  const panneau = route.params?.panneau;
  const isEdit = Boolean(panneau?.id);
  const { showToast } = useToast();

  const [projets, setProjets] = useState([]);
  const [loadingProjets, setLoadingProjets] = useState(true);
  const [entreprise, setEntreprise] = useState(panneau?.entreprise || "");
  const [nomZone, setNomZone] = useState(panneau?.nomZone || "");
  const [adresse, setAdresse] = useState(panneau?.localisation?.adresse || "");
  const [lat, setLat] = useState(
    panneau?.localisation?.latitude != null ? String(panneau.localisation.latitude) : "",
  );
  const [lng, setLng] = useState(
    panneau?.localisation?.longitude != null ? String(panneau.localisation.longitude) : "",
  );
  const [projetId, setProjetId] = useState(panneau?.projetId || "");
  const [nombreFaces, setNombreFaces] = useState(String(panneau?.nombreFaces ?? 1));
  const [statut, setStatut] = useState(panneau?.statut || "pending");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadProjets = useCallback(async () => {
    try {
      setLoadingProjets(true);
      const list = await getProjets();
      setProjets(list || []);
    } catch {
      setProjets([]);
    } finally {
      setLoadingProjets(false);
    }
  }, []);

  useEffect(() => {
    loadProjets();
  }, [loadProjets]);

  const selectedProjet = projets.find((p) => p.id === projetId);

  const fillGps = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        showToast("Autorisation de localisation refusée", "error");
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      setLat(String(pos.coords.latitude));
      setLng(String(pos.coords.longitude));
      showToast("Position GPS renseignée");
    } catch {
      showToast("Impossible d’obtenir la position", "error");
    }
  };

  const onSubmit = async () => {
    if (!entreprise.trim()) {
      setError("Le nom / entreprise du site est obligatoire.");
      return;
    }
    const la = Number(lat);
    const lo = Number(lng);
    if (!Number.isFinite(la) || !Number.isFinite(lo)) {
      setError("Latitude et longitude valides obligatoires.");
      return;
    }
    if (!projetId) {
      setError("Choisissez une campagne.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      const payload = {
        entreprise: entreprise.trim(),
        nomZone: nomZone.trim() || undefined,
        latitude: la,
        longitude: lo,
        adresse: adresse.trim(),
        nombreFaces: Math.max(1, parseInt(nombreFaces, 10) || 1),
        statut,
        projetId,
      };
      if (isEdit) {
        await updatePanneau(panneau.id, payload);
        showToast("Panneau mis à jour");
      } else {
        await createPanneau(payload);
        showToast("Panneau créé");
      }
      navigation.goBack();
    } catch (err) {
      setError(err.message || "Enregistrement impossible.");
      showToast("Une erreur est survenue", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.root}>
      <AppHeader
        title={isEdit ? "Modifier panneau" : "Nouveau panneau"}
        onBack={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {loadingProjets ? (
          <ActivityIndicator color={theme.colors.primary} style={{ marginVertical: 24 }} />
        ) : (
          <>
            <Text style={styles.label}>Campagne *</Text>
            <TouchableOpacity style={styles.selectBtn} onPress={() => setPickerOpen(true)} activeOpacity={0.85}>
              <Text style={styles.selectText} numberOfLines={1}>
                {selectedProjet ? selectedProjet.nom : "Choisir une campagne…"}
              </Text>
              <Ionicons name="chevron-down" size={20} color={theme.colors.textMuted} />
            </TouchableOpacity>

            <Text style={styles.label}>Nom du site / enseigne *</Text>
            <TextInput
              style={styles.input}
              value={entreprise}
              onChangeText={setEntreprise}
              placeholder="ex: Pharmacie Centre"
              placeholderTextColor={theme.colors.textMuted}
            />

            <Text style={styles.label}>Zone (optionnel)</Text>
            <TextInput
              style={styles.input}
              value={nomZone}
              onChangeText={setNomZone}
              placeholder="ex: Plateau"
              placeholderTextColor={theme.colors.textMuted}
            />

            <Text style={styles.label}>Adresse</Text>
            <TextInput
              style={styles.input}
              value={adresse}
              onChangeText={setAdresse}
              placeholder="Adresse affichée sur le rapport"
              placeholderTextColor={theme.colors.textMuted}
            />

            <View style={styles.gpsRow}>
              <Text style={[styles.label, { marginBottom: 0, flex: 1 }]}>Coordonnées GPS *</Text>
              <TouchableOpacity style={styles.gpsChip} onPress={fillGps} activeOpacity={0.85}>
                <Ionicons name="locate" size={18} color={theme.colors.primary} />
                <Text style={styles.gpsChipText}>Ma position</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              value={lat}
              onChangeText={setLat}
              placeholder="Latitude"
              keyboardType="decimal-pad"
              placeholderTextColor={theme.colors.textMuted}
            />
            <TextInput
              style={styles.input}
              value={lng}
              onChangeText={setLng}
              placeholder="Longitude"
              keyboardType="decimal-pad"
              placeholderTextColor={theme.colors.textMuted}
            />

            <Text style={styles.label}>Nombre de faces</Text>
            <TextInput
              style={styles.input}
              value={nombreFaces}
              onChangeText={setNombreFaces}
              keyboardType="number-pad"
              placeholderTextColor={theme.colors.textMuted}
            />

            <Text style={styles.label}>Statut synchro</Text>
            <View style={styles.statRow}>
              {[
                { v: "pending", l: "En attente" },
                { v: "synced", l: "Synchronisé" },
                { v: "error", l: "Erreur" },
              ].map((o) => (
                <TouchableOpacity
                  key={o.v}
                  style={[styles.statChip, statut === o.v && styles.statChipOn]}
                  onPress={() => setStatut(o.v)}
                >
                  <Text style={[styles.statChipText, statut === o.v && styles.statChipTextOn]}>{o.l}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {!!error && <Text style={styles.error}>{error}</Text>}
            <Button
              title={isEdit ? "Enregistrer" : "Créer le panneau"}
              variant="primary"
              onPress={onSubmit}
              loading={saving}
              disabled={saving}
              style={styles.submit}
            />
          </>
        )}
      </ScrollView>

      <Modal visible={pickerOpen} transparent animationType="fade">
        <Pressable style={styles.modalBg} onPress={() => setPickerOpen(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Campagne</Text>
            <FlatList
              data={projets}
              keyExtractor={(item) => item.id}
              style={{ maxHeight: 320 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerRow}
                  onPress={() => {
                    setProjetId(item.id);
                    setPickerOpen(false);
                  }}
                >
                  <Text style={styles.pickerName}>{item.nom}</Text>
                  <Text style={styles.pickerSub}>{item.entreprise}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={styles.emptyPick}>Aucune campagne. Créez-en une d’abord.</Text>}
            />
            <TouchableOpacity style={styles.modalClose} onPress={() => setPickerOpen(false)}>
              <Text style={styles.modalCloseText}>Fermer</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.canvas },
  container: { padding: theme.spacing.md, paddingBottom: theme.spacing.xxl },
  label: { fontWeight: "600", color: theme.colors.textSecondary, marginBottom: 6, marginTop: theme.spacing.sm },
  input: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: theme.colors.text,
    marginBottom: 4,
  },
  selectBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 4,
  },
  selectText: { flex: 1, color: theme.colors.text, fontWeight: "600", marginRight: 8 },
  gpsRow: { flexDirection: "row", alignItems: "center", marginTop: theme.spacing.sm },
  gpsChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.primaryMuted,
  },
  gpsChipText: { color: theme.colors.primary, fontWeight: "700", fontSize: 13 },
  statRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: theme.spacing.md },
  statChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  statChipOn: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primaryMuted },
  statChipText: { fontSize: 13, fontWeight: "600", color: theme.colors.textSecondary },
  statChipTextOn: { color: theme.colors.primary },
  error: { color: theme.colors.error, marginTop: theme.spacing.sm },
  submit: { marginTop: theme.spacing.lg },
  modalBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", padding: theme.spacing.lg },
  modalCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    maxHeight: "80%",
  },
  modalTitle: { fontSize: 17, fontWeight: "800", marginBottom: theme.spacing.sm, color: theme.colors.text },
  pickerRow: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  pickerName: { fontSize: 16, fontWeight: "700", color: theme.colors.text },
  pickerSub: { fontSize: 13, color: theme.colors.textMuted, marginTop: 2 },
  emptyPick: { padding: theme.spacing.lg, color: theme.colors.textMuted, textAlign: "center" },
  modalClose: { paddingVertical: 14, alignItems: "center" },
  modalCloseText: { fontWeight: "700", color: theme.colors.primary },
});
