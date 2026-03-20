import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { theme } from "../theme";

export default function AgentMissionCompleteScreen({ navigation, route }) {
  const mission = route.params?.mission;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Mission terminée</Text>
        <Text style={styles.subtitle}>{mission?.nom || "Mission"} est complète.</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate("AgentMissions")} activeOpacity={0.85}>
          <Text style={styles.primaryText}>Retour aux missions</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate("AgentPanneaux")} activeOpacity={0.85}>
          <Text style={styles.secondaryText}>Voir mes panneaux validés</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, justifyContent: "center", padding: theme.spacing.md },
  card: {
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.lg,
  },
  title: { color: theme.colors.text, fontSize: 24, fontWeight: "800", marginBottom: theme.spacing.sm },
  subtitle: { color: theme.colors.textSecondary, marginBottom: theme.spacing.lg },
  primaryButton: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.lg,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  primaryText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  secondaryButton: {
    borderWidth: 1,
    borderColor: theme.colors.accent,
    borderRadius: theme.radius.lg,
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryText: { color: theme.colors.accent, fontWeight: "600", fontSize: 15 },
});
