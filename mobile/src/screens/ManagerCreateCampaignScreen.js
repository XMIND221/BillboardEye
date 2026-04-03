import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { theme } from "../theme";
import Button from "../components/Button";
import StepProgressHeader from "../components/manager/StepProgressHeader";
import { createProjet, updateProjet, uploadLogo } from "../services/api";
import { saveSelectedProject } from "../services/projectStorage";
import { saveCampaignConfig } from "../services/campaignConfigStorage";
import { parseZones } from "../services/missionStorage";
import { useToast } from "../contexts/ToastContext";
import { MANAGER_REPORT_SCREENS } from "../navigation/reportScreens";
import { PDF_TEMPLATE_OPTIONS } from "../constants/pdfTemplates";

const TOTAL_STEPS = 4;
const STEP_LABELS = ["Infos campagne", "Terrain", "Branding", "Rapport PDF"];

const BRAND_SWATCHES = [
  "#2563EB",
  "#E11D48",
  "#16a34a",
  "#ca8a04",
  "#7c3aed",
  "#0d9488",
  "#ea580c",
  "#18181b",
];

const todayIsoDate = () => new Date().toISOString().slice(0, 10);

function toIsoDateOrNow(dateStr) {
  const s = String(dateStr || "").trim();
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return new Date().toISOString();
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

function buildZoneString(perimeter, zones) {
  const z = (zones || []).map((s) => String(s).trim()).filter(Boolean);
  const p = String(perimeter || "").trim();
  if (p && z.length) return `${p} — ${z.join(", ")}`;
  if (z.length) return z.join(", ");
  return p;
}

export default function ManagerCreateCampaignScreen({ navigation, route }) {
  const { showToast } = useToast();
  const editCampaign = route.params?.editCampaign;
  const [step, setStep] = useState(1);

  const [clientName, setClientName] = useState("");
  const [campaignName, setCampaignName] = useState("");
  const [perimeter, setPerimeter] = useState("");
  const [campaignDate, setCampaignDate] = useState(todayIsoDate);

  const [zoneInput, setZoneInput] = useState("");
  const [zones, setZones] = useState([]);
  const [instructions, setInstructions] = useState("");
  const [assignedAgent, setAssignedAgent] = useState("");

  const [clientLogoUri, setClientLogoUri] = useState("");
  const [clientLogoDataUri, setClientLogoDataUri] = useState("");
  const [companyLogoUri, setCompanyLogoUri] = useState("");
  const [companyLogoDataUri, setCompanyLogoDataUri] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#2563EB");

  const [reportTitle, setReportTitle] = useState("");
  const [duration, setDuration] = useState("");
  const [legendeVisuelle, setLegendeVisuelle] = useState("");
  const [legendeCarte, setLegendeCarte] = useState("");
  const [reportPdfVariant, setReportPdfVariant] = useState("default");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!editCampaign) return;
    setClientName(editCampaign.entreprise || "");
    setCampaignName(editCampaign.nom || "");
    setDuration(editCampaign.duree || "");
    setInstructions(editCampaign.instructions || "");
    setReportTitle(editCampaign.titreRapport || "");
    setPrimaryColor(editCampaign.couleurPrincipale || "#2563EB");
    setAssignedAgent(editCampaign.assignedAgent || "");
    setLegendeVisuelle(editCampaign.legendeVisuelle || "");
    setLegendeCarte(editCampaign.legendeCarte || "");
    setReportPdfVariant(editCampaign.reportPdfVariant || "default");
    const z = parseZones(editCampaign.zone);
    setZones(z.length ? z : []);
    setPerimeter("");
    if (editCampaign.date) {
      try {
        setCampaignDate(String(editCampaign.date).slice(0, 10));
      } catch {
        setCampaignDate(todayIsoDate());
      }
    }
  }, [editCampaign?.id]);

  const pickLogo = async (setUri, setDataUri) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== "granted") {
      setError("Permission médias requise.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.75,
      base64: true,
    });
    if (!result.canceled && result.assets?.length) {
      const a = result.assets[0];
      setUri(a.uri);
      if (a.base64) {
        const mime = a.mimeType || "image/jpeg";
        setDataUri(`data:${mime};base64,${a.base64}`);
      } else {
        setDataUri("");
      }
    }
  };

  const addZone = () => {
    const cleaned = zoneInput.trim();
    if (!cleaned) return;
    if (zones.includes(cleaned)) {
      setZoneInput("");
      return;
    }
    setZones((prev) => [...prev, cleaned]);
    setZoneInput("");
  };

  const removeZone = (zone) => {
    setZones((prev) => prev.filter((item) => item !== zone));
  };

  const validateStep = (n) => {
    if (n === 1) {
      if (!clientName.trim() || !campaignName.trim()) {
        setError("Client et nom de campagne sont obligatoires.");
        return false;
      }
      setError("");
      return true;
    }
    if (n === 2) {
      if (!editCampaign && zones.length === 0) {
        setError("Ajoutez au moins une zone terrain.");
        return false;
      }
      setError("");
      return true;
    }
    setError("");
    return true;
  };

  const goNext = () => {
    if (!validateStep(step)) return;
    setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  };

  const goBack = () => {
    setError("");
    setStep((s) => Math.max(1, s - 1));
  };

  const resolveLogos = async () => {
    let clientLogoUrl = "";
    if (clientLogoDataUri) {
      clientLogoUrl = clientLogoDataUri;
    } else if (clientLogoUri) {
      clientLogoUrl = await uploadLogo(clientLogoUri);
      if (!clientLogoUrl) throw new Error("Échec envoi du logo client.");
    }
    let entrepriseLogoUrl = "";
    if (companyLogoDataUri) {
      entrepriseLogoUrl = companyLogoDataUri;
    } else if (companyLogoUri) {
      entrepriseLogoUrl = await uploadLogo(companyLogoUri);
      if (!entrepriseLogoUrl) throw new Error("Échec envoi du logo entreprise.");
    }
    return { clientLogoUrl, entrepriseLogoUrl };
  };

  const buildPayload = useCallback(
    (options = {}) => {
      const { statut } = options;
      const zoneStr = buildZoneString(perimeter, zones);
      const titre = (reportTitle.trim() || campaignName.trim()).trim();
      const trimmedDate = String(campaignDate || "").trim();
      let dateOut;
      if (!trimmedDate) {
        dateOut = editCampaign?.id ? undefined : new Date().toISOString();
      } else {
        dateOut = toIsoDateOrNow(trimmedDate);
      }
      const payload = {
        nom: campaignName.trim(),
        entreprise: clientName.trim(),
        zone: editCampaign && !zoneStr ? editCampaign.zone || "" : zoneStr,
        duree: duration.trim(),
        instructions: instructions.trim(),
        legendeVisuelle: legendeVisuelle.trim(),
        legendeCarte: legendeCarte.trim(),
        couleurPrincipale: primaryColor.trim() || "#2563EB",
        titreRapport: titre,
        assignedAgent: assignedAgent.trim(),
      };
      if (dateOut !== undefined) payload.date = dateOut;
      if (statut) payload.statut = statut;
      return payload;
    },
    [
      assignedAgent,
      campaignDate,
      campaignName,
      clientName,
      duration,
      editCampaign,
      instructions,
      legendeCarte,
      legendeVisuelle,
      perimeter,
      primaryColor,
      reportTitle,
      zones,
      reportPdfVariant,
    ],
  );

  const persistLogosAndPayload = async (payloadBase) => {
    const { clientLogoUrl, entrepriseLogoUrl } = await resolveLogos();
    return {
      ...payloadBase,
      ...(clientLogoUrl ? { clientLogoUrl } : {}),
      ...(entrepriseLogoUrl ? { entrepriseLogoUrl } : {}),
    };
  };

  const submitDraft = async () => {
    if (!validateStep(1) || !validateStep(2)) {
      setStep(1);
      return;
    }
    try {
      setLoading(true);
      setError("");
      const base = buildPayload({ statut: "planned" });
      const payload = await persistLogosAndPayload(base);

      let result;
      if (editCampaign?.id) {
        result = await updateProjet(editCampaign.id, payload);
      } else {
        result = await createProjet(payload);
      }

      await saveSelectedProject(result, "gestionnaire");
      await saveCampaignConfig(result.id, {
        clientLogoUri,
        companyLogoUri,
        primaryColor,
        reportTitle,
        instructions,
        duration,
      });
      showToast("Brouillon enregistré");
      navigation.navigate("ManagerCampaigns", {
        forceRefreshToken: Date.now(),
      });
    } catch (err) {
      setError(err.message || "Enregistrement impossible.");
    } finally {
      setLoading(false);
    }
  };

  const submitFinal = async () => {
    if (!validateStep(1) || !validateStep(2)) {
      setStep(1);
      return;
    }
    try {
      setLoading(true);
      setError("");
      const base = buildPayload({ statut: "active" });
      const payload = await persistLogosAndPayload(base);

      let result;
      if (editCampaign?.id) {
        result = await updateProjet(editCampaign.id, { ...payload, statut: payload.statut || "active" });
      } else {
        result = await createProjet(payload);
      }

      await saveSelectedProject(result, "gestionnaire");
      await saveCampaignConfig(result.id, {
        clientLogoUri,
        companyLogoUri,
        primaryColor,
        reportTitle,
        instructions,
        duration,
      });
      showToast(editCampaign ? "Campagne mise à jour" : "Campagne créée");

      const tabNav = navigation.getParent();
      if (tabNav?.navigate) {
        navigation.navigate("ManagerCampaigns", {
          forceRefreshToken: Date.now(),
        });
        navigation.navigate("ManagerCampaignDetail", { campaign: result });
      } else {
        navigation.replace("ManagerCampaignDetail", { campaign: result });
      }
    } catch (err) {
      setError(err.message || "Création impossible.");
    } finally {
      setLoading(false);
    }
  };

  const headerTitle = useMemo(
    () => (editCampaign ? "Modifier la campagne" : "Nouvelle campagne"),
    [editCampaign],
  );

  const renderStep1 = () => (
    <View>
      <Text style={styles.fieldHint}>Obligatoires · identité de la campagne</Text>
      <Text style={styles.label}>Nom de la campagne *</Text>
      <TextInput
        style={styles.input}
        value={campaignName}
        onChangeText={setCampaignName}
        placeholder="Ex. Affichage Q1 — Centre-ville"
        placeholderTextColor={theme.colors.textMuted}
      />
      <Text style={styles.label}>Client (raison sociale) *</Text>
      <TextInput
        style={styles.input}
        value={clientName}
        onChangeText={setClientName}
        placeholder="Ex. ACME Distribution"
        placeholderTextColor={theme.colors.textMuted}
      />
      <Text style={styles.label}>Périmètre / région (résumé)</Text>
      <TextInput
        style={styles.input}
        value={perimeter}
        onChangeText={setPerimeter}
        placeholder="Ex. Île-de-France, Grand Lyon…"
        placeholderTextColor={theme.colors.textMuted}
      />
      <Text style={styles.label}>Date de campagne</Text>
      <TextInput
        style={styles.input}
        value={campaignDate}
        onChangeText={setCampaignDate}
        placeholder="AAAA-MM-JJ"
        placeholderTextColor={theme.colors.textMuted}
        autoCapitalize="none"
      />
    </View>
  );

  const renderStep2 = () => (
    <View>
      <Text style={styles.fieldHint}>Zones terrain · consignes agent</Text>
      <Text style={styles.label}>Ajouter une zone</Text>
      <View style={styles.zoneRow}>
        <TextInput
          style={[styles.input, styles.inputFlex]}
          value={zoneInput}
          onChangeText={setZoneInput}
          placeholder="Ex. Gare Sud, Zone A…"
          placeholderTextColor={theme.colors.textMuted}
          onSubmitEditing={addZone}
        />
        <TouchableOpacity style={styles.addZoneButton} onPress={addZone} activeOpacity={0.85}>
          <Text style={styles.addZoneText}>Ajouter</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.zonesListTitle}>Zones ({zones.length})</Text>
      {zones.length === 0 ? (
        <Text style={styles.emptyZones}>Aucune zone — obligatoire pour une nouvelle campagne.</Text>
      ) : (
        <View style={styles.zonesWrap}>
          {zones.map((zone) => (
            <TouchableOpacity key={zone} style={styles.zoneChip} onPress={() => removeZone(zone)} activeOpacity={0.85}>
              <Text style={styles.zoneChipText}>{zone} ✕</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      <Text style={styles.label}>Instructions terrain</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={instructions}
        onChangeText={setInstructions}
        multiline
        placeholder="Consignes courtes : horaires, sécurité, cadrage photo…"
        placeholderTextColor={theme.colors.textMuted}
      />
      <Text style={styles.label}>Agent assigné</Text>
      <TextInput
        style={styles.input}
        value={assignedAgent}
        onChangeText={setAssignedAgent}
        placeholder="Email ou identifiant (optionnel)"
        placeholderTextColor={theme.colors.textMuted}
        autoCapitalize="none"
      />
      <Text style={styles.microHint}>2 photos (Face A / B), GPS et heure sont enregistrés automatiquement sur le terrain.</Text>
    </View>
  );

  const renderStep3 = () => (
    <View>
      <Text style={styles.fieldHint}>Logos et couleur du PDF</Text>
      <Text style={styles.label}>Logo client</Text>
      <TouchableOpacity style={styles.secondaryButton} onPress={() => pickLogo(setClientLogoUri, setClientLogoDataUri)} activeOpacity={0.85}>
        <Text style={styles.secondaryText}>Choisir une image</Text>
      </TouchableOpacity>
      {!!clientLogoUri && <Image source={{ uri: clientLogoUri }} style={styles.logoPreview} />}

      <Text style={styles.label}>Logo entreprise</Text>
      <TouchableOpacity style={styles.secondaryButton} onPress={() => pickLogo(setCompanyLogoUri, setCompanyLogoDataUri)} activeOpacity={0.85}>
        <Text style={styles.secondaryText}>Choisir une image</Text>
      </TouchableOpacity>
      {!!companyLogoUri && <Image source={{ uri: companyLogoUri }} style={styles.logoPreview} />}

      <Text style={styles.label}>Couleur principale</Text>
      <View style={styles.swatchRow}>
        {BRAND_SWATCHES.map((hex) => (
          <TouchableOpacity
            key={hex}
            style={[styles.swatch, { backgroundColor: hex }, primaryColor === hex && styles.swatchSelected]}
            onPress={() => setPrimaryColor(hex)}
            accessibilityLabel={`Couleur ${hex}`}
          />
        ))}
      </View>
      <TextInput
        style={styles.input}
        value={primaryColor}
        onChangeText={setPrimaryColor}
        placeholder="#2563EB"
        placeholderTextColor={theme.colors.textMuted}
        autoCapitalize="characters"
      />
    </View>
  );

  const renderStep4 = () => (
    <View>
      <Text style={styles.fieldHint}>Contenu visible dans le rapport PDF</Text>
      <View style={styles.readonlyCard}>
        <Text style={styles.readonlyLabel}>Couverture (aperçu)</Text>
        <Text style={styles.readonlyLine}>Client : {clientName.trim() || "—"}</Text>
        <Text style={styles.readonlyLine}>Date : {campaignDate || "—"}</Text>
      </View>
      <Text style={styles.label}>Titre du rapport (grande couverture)</Text>
      <TextInput
        style={styles.input}
        value={reportTitle}
        onChangeText={setReportTitle}
        placeholder={campaignName.trim() || "Défaut : nom de campagne"}
        placeholderTextColor={theme.colors.textMuted}
      />
      <Text style={styles.label}>Durée affichée (bloc résumé)</Text>
      <TextInput
        style={styles.input}
        value={duration}
        onChangeText={setDuration}
        placeholder="Ex. 15 jours, 3 mois…"
        placeholderTextColor={theme.colors.textMuted}
      />
      <Text style={styles.label}>Consignes (résumé PDF)</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={instructions}
        onChangeText={setInstructions}
        multiline
        placeholder="Texte sous les statistiques du résumé (même source que les instructions terrain si vous préférez)"
        placeholderTextColor={theme.colors.textMuted}
      />
      <Text style={styles.label}>Légende sous la carte (résumé)</Text>
      <TextInput
        style={styles.input}
        value={legendeCarte}
        onChangeText={setLegendeCarte}
        placeholder="Ex. Distribution géographique des panneaux"
        placeholderTextColor={theme.colors.textMuted}
      />
      <Text style={styles.label}>Légende grande photo</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={legendeVisuelle}
        onChangeText={setLegendeVisuelle}
        multiline
        placeholder="Texte sous la photo pleine page"
        placeholderTextColor={theme.colors.textMuted}
      />
      <Text style={styles.label}>Modèle de rapport PDF</Text>
      <View style={styles.templateRow}>
        {PDF_TEMPLATE_OPTIONS.map((opt) => {
          const selected = reportPdfVariant === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              style={[styles.templateChip, selected && styles.templateChipSelected]}
              onPress={() => setReportPdfVariant(opt.value)}
              activeOpacity={0.85}
            >
              <Text style={[styles.templateChipTitle, selected && styles.templateChipTitleSelected]}>{opt.label}</Text>
              <Text style={styles.templateChipHint} numberOfLines={2}>
                {opt.hint}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={styles.readonlyCard}>
        <Text style={styles.readonlyLabel}>Métadonnées</Text>
        <Text style={styles.readonlyLine}>Agent : {assignedAgent.trim() || "—"}</Text>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.pageTitle}>{headerTitle}</Text>
        <StepProgressHeader step={step} total={TOTAL_STEPS} title={STEP_LABELS[step - 1]} />

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}

        {!!error && <Text style={styles.error}>{error}</Text>}

        <View style={styles.navRow}>
          {step > 1 ? (
            <TouchableOpacity style={styles.backBtn} onPress={goBack} activeOpacity={0.85}>
              <Text style={styles.backBtnText}>Retour</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.backBtnPlaceholder} />
          )}
          {step < TOTAL_STEPS ? (
            <TouchableOpacity style={styles.nextBtn} onPress={goNext} activeOpacity={0.85}>
              <Text style={styles.nextBtnText}>Suivant</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {step === TOTAL_STEPS ? (
          <View style={styles.finalActions}>
            <Button
              title={editCampaign ? "Enregistrer et ouvrir les rapports" : "Créer campagne et générer rapport"}
              variant="primary"
              onPress={submitFinal}
              loading={loading}
              disabled={loading}
              style={styles.primaryButton}
            />
            <Button
              title="Enregistrer brouillon"
              variant="secondary"
              onPress={submitDraft}
              loading={loading}
              disabled={loading}
              style={styles.draftButton}
            />
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.colors.background },
  container: { padding: theme.spacing.lg, paddingBottom: theme.spacing.xxl * 2 },
  pageTitle: { fontSize: 22, fontWeight: "800", color: theme.colors.text, marginBottom: theme.spacing.sm },
  fieldHint: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.md,
    lineHeight: 18,
  },
  label: { fontWeight: "700", color: theme.colors.textSecondary, marginBottom: 8, marginTop: theme.spacing.md, fontSize: 14 },
  input: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: theme.colors.text,
  },
  inputFlex: { flex: 1, marginBottom: 0 },
  textArea: { minHeight: 100, textAlignVertical: "top", paddingTop: 14 },
  zoneRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  addZoneButton: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  addZoneText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  zonesListTitle: { marginTop: theme.spacing.md, fontWeight: "800", color: theme.colors.text, fontSize: 14 },
  emptyZones: { color: theme.colors.warning, marginTop: 8, fontSize: 13 },
  zonesWrap: { flexDirection: "row", flexWrap: "wrap", marginTop: theme.spacing.sm, gap: 8 },
  zoneChip: {
    backgroundColor: theme.colors.pastels.blue,
    borderRadius: theme.radius.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  zoneChipText: { color: theme.colors.accent, fontWeight: "700", fontSize: 14 },
  microHint: { marginTop: theme.spacing.md, fontSize: 12, color: theme.colors.textMuted, lineHeight: 17 },
  secondaryButton: {
    borderWidth: 1,
    borderColor: theme.colors.accent,
    borderRadius: theme.radius.md,
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryText: { color: theme.colors.accent, fontWeight: "800", fontSize: 15 },
  logoPreview: { width: "100%", height: 120, borderRadius: theme.radius.md, marginTop: 10, marginBottom: 8 },
  swatchRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: theme.spacing.sm },
  swatch: { width: 40, height: 40, borderRadius: theme.radius.md, borderWidth: 2, borderColor: "transparent" },
  swatchSelected: { borderColor: theme.colors.text, ...theme.shadows.sm },
  readonlyCard: {
    backgroundColor: theme.colors.muted,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginTop: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  readonlyLabel: { fontSize: 11, fontWeight: "800", color: theme.colors.textMuted, textTransform: "uppercase", marginBottom: 6 },
  readonlyLine: { fontSize: 14, color: theme.colors.text, marginBottom: 4 },
  navRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  backBtn: { paddingVertical: 12, paddingHorizontal: 8 },
  backBtnText: { color: theme.colors.textSecondary, fontWeight: "700", fontSize: 16 },
  backBtnPlaceholder: { width: 80 },
  nextBtn: {
    backgroundColor: theme.colors.accent,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: theme.radius.lg,
    marginLeft: "auto",
  },
  nextBtnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  finalActions: { marginTop: theme.spacing.lg, gap: theme.spacing.sm },
  primaryButton: { marginTop: 0 },
  draftButton: { marginTop: 0 },
  error: { color: theme.colors.error, marginTop: theme.spacing.md, fontSize: 14, fontWeight: "600" },
  templateRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: theme.spacing.sm },
  templateChip: {
    width: "47%",
    minWidth: 140,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: 12,
    backgroundColor: theme.colors.surface,
  },
  templateChipSelected: { borderColor: theme.colors.accent, backgroundColor: theme.colors.muted },
  templateChipTitle: { fontSize: 14, fontWeight: "800", color: theme.colors.text },
  templateChipTitleSelected: { color: theme.colors.accent },
  templateChipHint: { fontSize: 11, color: theme.colors.textMuted, marginTop: 4, lineHeight: 14 },
});
