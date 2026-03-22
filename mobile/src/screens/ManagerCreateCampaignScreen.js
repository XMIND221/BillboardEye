import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { theme } from "../theme";
import Button from "../components/Button";
import { createProjet, uploadLogo } from "../services/api";
import { saveSelectedProject } from "../services/projectStorage";
import { saveCampaignConfig } from "../services/campaignConfigStorage";

export default function ManagerCreateCampaignScreen({ navigation }) {
  const [clientName, setClientName] = useState("");
  const [campaignName, setCampaignName] = useState("");
  const [duration, setDuration] = useState("");
  const [zoneInput, setZoneInput] = useState("");
  const [zones, setZones] = useState([]);
  const [instructions, setInstructions] = useState("");
  const [reportTitle, setReportTitle] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#2563EB");
  const [clientLogoUri, setClientLogoUri] = useState("");
  const [clientLogoDataUri, setClientLogoDataUri] = useState("");
  const [companyLogoUri, setCompanyLogoUri] = useState("");
  const [companyLogoDataUri, setCompanyLogoDataUri] = useState("");
  const [assignedAgent, setAssignedAgent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /** Aperçu local + data URI pour envoi direct au serveur (upload auto côté API). */
  const pickLogo = async (setUri, setDataUri) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== "granted") {
      setError("Permission media requise.");
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
    if (!cleaned) {
      return;
    }
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

  const onSubmit = async () => {
    if (!clientName.trim() || !campaignName.trim() || zones.length === 0) {
      setError("Client, nom campagne et zones sont obligatoires.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      let clientLogoUrl = "";
      if (clientLogoDataUri) {
        clientLogoUrl = clientLogoDataUri;
      } else if (clientLogoUri) {
        clientLogoUrl = await uploadLogo(clientLogoUri);
        if (!clientLogoUrl) {
          throw new Error("Échec envoi du logo client.");
        }
      }
      let entrepriseLogoUrl = "";
      if (companyLogoDataUri) {
        entrepriseLogoUrl = companyLogoDataUri;
      } else if (companyLogoUri) {
        entrepriseLogoUrl = await uploadLogo(companyLogoUri);
        if (!entrepriseLogoUrl) {
          throw new Error("Échec envoi du logo entreprise.");
        }
      }
      const created = await createProjet({
        nom: campaignName.trim(),
        entreprise: clientName.trim(),
        zone: zones.join(", "),
        duree: duration.trim(),
        instructions: instructions.trim(),
        clientLogoUrl: clientLogoUrl || undefined,
        entrepriseLogoUrl: entrepriseLogoUrl || undefined,
        couleurPrincipale: primaryColor.trim() || "#2563EB",
        titreRapport: reportTitle.trim() || campaignName.trim(),
        assignedAgent: assignedAgent.trim(),
      });

      await saveSelectedProject(created, "gestionnaire");
      await saveCampaignConfig(created.id, {
        clientLogoUri,
        companyLogoUri,
        primaryColor,
        reportTitle,
        instructions,
        duration,
      });

      navigation.replace("ManagerCampaignDetail", { campaign: created });
    } catch (err) {
      setError(err.message || "Création impossible.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Création campagne</Text>

      <Text style={styles.label}>Client (nom)</Text>
      <TextInput style={styles.input} value={clientName} onChangeText={setClientName} placeholderTextColor={theme.colors.textMuted} />

      <Text style={styles.label}>Nom campagne</Text>
      <TextInput style={styles.input} value={campaignName} onChangeText={setCampaignName} placeholderTextColor={theme.colors.textMuted} />

      <Text style={styles.label}>Durée</Text>
      <TextInput style={styles.input} value={duration} onChangeText={setDuration} placeholder="ex: 15 jours" placeholderTextColor={theme.colors.textMuted} />

      <Text style={styles.label}>Zone</Text>
      <View style={styles.zoneRow}>
        <TextInput
          style={[styles.input, { flex: 1, marginBottom: 0 }]}
          value={zoneInput}
          onChangeText={setZoneInput}
          placeholder="ex: Plateau"
          placeholderTextColor={theme.colors.textMuted}
        />
        <TouchableOpacity style={styles.addZoneButton} onPress={addZone}>
          <Text style={styles.addZoneText}>Ajouter</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.zonesWrap}>
        {zones.map((zone) => (
          <TouchableOpacity key={zone} style={styles.zoneChip} onPress={() => removeZone(zone)}>
            <Text style={styles.zoneChipText}>{zone} ✕</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.section}>Configuration terrain</Text>
      <Text style={styles.hint}>2 photos obligatoires (Face A / Face B), GPS et heure automatiques.</Text>

      <Text style={styles.label}>Instructions (texte libre)</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={instructions}
        onChangeText={setInstructions}
        multiline
        placeholderTextColor={theme.colors.textMuted}
      />

      <Text style={styles.label}>Agent assigné (code ou email)</Text>
      <TextInput
        style={styles.input}
        value={assignedAgent}
        onChangeText={setAssignedAgent}
        placeholder="ex: agent.plateau@xmind.com"
        placeholderTextColor={theme.colors.textMuted}
      />

      <Text style={styles.section}>Branding rapport</Text>
      <Text style={styles.label}>Logo client</Text>
      <TouchableOpacity style={styles.secondaryButton} onPress={() => pickLogo(setClientLogoUri, setClientLogoDataUri)}>
        <Text style={styles.secondaryText}>Choisir image</Text>
      </TouchableOpacity>
      {!!clientLogoUri && <Image source={{ uri: clientLogoUri }} style={styles.logoPreview} />}

      <Text style={styles.label}>Logo entreprise</Text>
      <TouchableOpacity style={styles.secondaryButton} onPress={() => pickLogo(setCompanyLogoUri, setCompanyLogoDataUri)}>
        <Text style={styles.secondaryText}>Choisir image</Text>
      </TouchableOpacity>
      {!!companyLogoUri && <Image source={{ uri: companyLogoUri }} style={styles.logoPreview} />}

      <Text style={styles.label}>Couleur principale</Text>
      <TextInput style={styles.input} value={primaryColor} onChangeText={setPrimaryColor} placeholder="#2563EB" placeholderTextColor={theme.colors.textMuted} />

      <Text style={styles.label}>Titre du rapport</Text>
      <TextInput style={styles.input} value={reportTitle} onChangeText={setReportTitle} placeholderTextColor={theme.colors.textMuted} />

      <Button title="Créer campagne" variant="primary" onPress={onSubmit} loading={loading} disabled={loading} style={styles.primaryButton} />
      {!!error && <Text style={styles.error}>{error}</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: theme.spacing.md, backgroundColor: theme.colors.background },
  title: { fontSize: 22, fontWeight: "800", color: theme.colors.text, marginBottom: theme.spacing.md },
  section: { marginTop: theme.spacing.lg, marginBottom: 6, fontWeight: "700", color: theme.colors.text },
  label: { fontWeight: "600", color: theme.colors.textSecondary, marginBottom: 6, marginTop: theme.spacing.sm },
  input: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 6,
    color: theme.colors.text,
  },
  textArea: { minHeight: 90, textAlignVertical: "top" },
  zoneRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  addZoneButton: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  addZoneText: { color: "#fff", fontWeight: "700" },
  zonesWrap: { flexDirection: "row", flexWrap: "wrap", marginTop: theme.spacing.sm, marginBottom: 4 },
  zoneChip: {
    backgroundColor: theme.colors.pastels.blue,
    borderRadius: theme.radius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  zoneChipText: { color: theme.colors.accent, fontWeight: "700" },
  hint: { color: theme.colors.textMuted, marginBottom: 6 },
  primaryButton: { marginTop: theme.spacing.xl },
  secondaryButton: {
    borderWidth: 1,
    borderColor: theme.colors.accent,
    borderRadius: theme.radius.md,
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryText: { color: theme.colors.accent, fontWeight: "700" },
  logoPreview: { width: "100%", height: 120, borderRadius: theme.radius.md, marginTop: 8, marginBottom: 4 },
  error: { color: theme.colors.error, marginTop: theme.spacing.md, fontSize: 14 },
});
