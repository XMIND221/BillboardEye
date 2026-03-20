import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Share, Linking } from "react-native";
import { getProjetPDFUrl } from "../services/api";
import { resetMissionProgress } from "../services/missionStorage";

export default function MissionCompleteScreen({ route, navigation }) {
  const mission = route.params?.mission;
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");
  const [error, setError] = useState("");

  const generatePdf = async () => {
    if (!mission?.id) {
      return;
    }

    try {
      setLoading(true);
      setError("");
      const result = await getProjetPDFUrl(mission.id);
      const url = result?.url || "";
      if (!url) {
        throw new Error("URL PDF indisponible.");
      }
      setPdfUrl(url);
      await Linking.openURL(url);
    } catch (err) {
      setError(err.message || "Impossible de générer le PDF.");
    } finally {
      setLoading(false);
    }
  };

  const shareReport = async () => {
    if (!pdfUrl) {
      setError("Génère d'abord le PDF.");
      return;
    }
    await Share.share({
      message: `Rapport mission ${mission?.nom}: ${pdfUrl}`,
    });
  };

  const finishMission = async () => {
    if (mission?.id) {
      await resetMissionProgress(mission.id);
    }
    navigation.navigate("MainTabs", { screen: "Missions" });
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Mission terminée</Text>
        <Text style={styles.subtitle}>Toutes les zones ont été couvertes avec preuves terrain.</Text>

        <TouchableOpacity style={styles.primaryButton} onPress={generatePdf} disabled={loading}>
          <Text style={styles.primaryButtonText}>{loading ? "Génération..." : "Générer rapport PDF"}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={shareReport}>
          <Text style={styles.secondaryButtonText}>Envoyer rapport</Text>
        </TouchableOpacity>

        {pdfUrl ? <Text style={styles.linkText}>PDF prêt: {pdfUrl}</Text> : null}
        {!!error && <Text style={styles.errorText}>{error}</Text>}

        <TouchableOpacity style={styles.ghostButton} onPress={finishMission}>
          <Text style={styles.ghostButtonText}>Retour missions</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FB",
    padding: 16,
    justifyContent: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 14,
    color: "#4B5563",
  },
  primaryButton: {
    backgroundColor: "#2563EB",
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#2563EB",
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#2563EB",
    fontWeight: "700",
  },
  linkText: {
    marginTop: 10,
    color: "#374151",
    fontSize: 12,
  },
  errorText: {
    marginTop: 8,
    color: "#DC2626",
  },
  ghostButton: {
    marginTop: 14,
    alignItems: "center",
  },
  ghostButtonText: {
    color: "#4B5563",
    fontWeight: "700",
  },
});
