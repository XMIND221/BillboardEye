import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { theme } from "../theme";

export default function RoleGateScreen({ onSelectRole }) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoBlock}>
          <Text style={styles.logo}>BillboardEye</Text>
          <Text style={styles.tagline}>Choisissez votre mode</Text>
        </View>

        <View style={styles.card}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => onSelectRole("gestionnaire")}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>Mode Gestionnaire</Text>
            <Text style={styles.primaryButtonSub}>Créer campagnes, gérer les missions</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => onSelectRole("agent")}
            activeOpacity={0.85}
          >
            <Text style={styles.secondaryButtonText}>Mode Agent terrain</Text>
            <Text style={styles.secondaryButtonSub}>Exécuter les missions, capturer les panneaux</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tertiaryButton}
            onPress={() => onSelectRole("reporting")}
            activeOpacity={0.85}
          >
            <Text style={styles.tertiaryButtonText}>Mode Reporting</Text>
            <Text style={styles.tertiaryButtonSub}>Générer des rapports PDF professionnels</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: theme.spacing.lg,
  },
  logoBlock: {
    alignItems: "center",
    marginBottom: theme.spacing.xxl,
  },
  logo: {
    fontSize: 36,
    fontWeight: "800",
    color: theme.colors.text,
    letterSpacing: -0.5,
  },
  tagline: {
    marginTop: theme.spacing.sm,
    fontSize: 15,
    color: theme.colors.textSecondary,
    letterSpacing: 0.3,
  },
  card: {
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.lg,
  },
  primaryButton: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.lg,
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginBottom: theme.spacing.md,
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 17,
  },
  primaryButtonSub: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    marginTop: 4,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: theme.colors.accent,
    borderRadius: theme.radius.lg,
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  secondaryButtonText: {
    color: theme.colors.accent,
    fontWeight: "700",
    fontSize: 17,
  },
  secondaryButtonSub: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },
  tertiaryButton: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginTop: theme.spacing.md,
  },
  tertiaryButtonText: {
    color: theme.colors.text,
    fontWeight: "700",
    fontSize: 17,
  },
  tertiaryButtonSub: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },
});
