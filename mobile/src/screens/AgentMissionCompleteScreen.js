import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Linking, Share, Alert } from "react-native";
import { theme } from "../theme";
import { getProjetPDFUrl } from "../services/api";
import Button from "../components/Button";

export default function AgentMissionCompleteScreen({ navigation, route }) {
  const mission = route.params?.mission;
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");
  const [error, setError] = useState("");

  const generatePdf = async () => {
    if (!mission?.id) return;
    try {
      setGeneratingPdf(true);
      setError("");
      const result = await getProjetPDFUrl(mission.id);
      const url = result?.url || "";
      if (!url) throw new Error("URL PDF indisponible.");
      setPdfUrl(url);
      await Linking.openURL(url);
    } catch (err) {
      setError(err.message || "Impossible de générer le PDF.");
    } finally {
      setGeneratingPdf(false);
    }
  };

  const sharePdf = async () => {
    if (!pdfUrl) {
      Alert.alert("PDF requis", "Générez d'abord le rapport PDF.");
      return;
    }
    try {
      await Share.share({
        title: `Rapport - ${mission?.nom || "Mission"}`,
        message: `Rapport BillboardEye : ${mission?.nom || "Mission"}\n${pdfUrl}`,
        url: pdfUrl,
      });
    } catch (err) {
      if (err.message !== "User did not share") {
        Alert.alert("Erreur", "Impossible de partager.");
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Mission terminée</Text>
        <Text style={styles.subtitle}>{mission?.nom || "Mission"} est complète.</Text>

        <Button
          title="Générer rapport PDF"
          variant="success"
          onPress={generatePdf}
          loading={generatingPdf}
          disabled={generatingPdf}
          style={styles.pdfButton}
        />
        {pdfUrl ? (
          <TouchableOpacity style={styles.shareButton} onPress={sharePdf} activeOpacity={0.85}>
            <Text style={styles.shareButtonText}>Partager le rapport</Text>
          </TouchableOpacity>
        ) : null}
        {!!error && <Text style={styles.error}>{error}</Text>}

        <Button
          title="Retour aux missions"
          variant="primary"
          onPress={() => navigation.navigate("AgentMissions")}
          style={styles.primaryButton}
        />
        <Button
          title="Voir mes panneaux validés"
          variant="secondary"
          onPress={() => navigation.navigate("AgentPanneaux")}
          style={styles.secondaryButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: "center",
    padding: theme.spacing.lg,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.xl,
    ...theme.shadows.md,
  },
  title: { color: theme.colors.text, fontSize: 24, fontWeight: "800", marginBottom: theme.spacing.sm },
  subtitle: { color: theme.colors.textSecondary, marginBottom: theme.spacing.lg, fontSize: 15 },
  pdfButton: { marginBottom: theme.spacing.md },
  shareButton: {
    borderWidth: 2,
    borderColor: theme.colors.success,
    borderRadius: theme.radius.xl,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  shareButtonText: { color: theme.colors.success, fontWeight: "700", fontSize: 15 },
  primaryButton: { marginBottom: theme.spacing.md },
  secondaryButton: {},
  error: { color: theme.colors.error, fontSize: 14, marginBottom: theme.spacing.md },
});
