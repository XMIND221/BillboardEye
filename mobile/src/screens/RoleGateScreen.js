import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { theme } from "../theme";

const ROLE_CONFIG = {
  gestionnaire: {
    label: "Mode Gestionnaire",
    sub: "Créer campagnes, gérer les missions",
    color: theme.colors.accent,
    bg: theme.colors.pastels.pink,
  },
  agent: {
    label: "Mode Agent terrain",
    sub: "Exécuter les missions, capturer les panneaux",
    color: theme.colors.accent,
    bg: theme.colors.pastels.blue,
  },
  reporting: {
    label: "Mode Reporting",
    sub: "Générer des rapports PDF professionnels",
    color: theme.colors.primary,
    bg: theme.colors.pastels.purple,
  },
};

export default function RoleGateScreen({ onSelectRole, onSignOut }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image source={require("../../assets/logo.png")} style={styles.logoImage} resizeMode="contain" />
        <Text style={styles.tagline}>Choisissez votre mode</Text>
      </View>

      <View style={styles.content}>
        {onSignOut && (
          <TouchableOpacity style={styles.signOutButton} onPress={onSignOut} activeOpacity={0.85}>
            <Text style={styles.signOutText}>Se déconnecter</Text>
          </TouchableOpacity>
        )}

        {(["gestionnaire", "agent", "reporting"]).map((role) => {
          const config = ROLE_CONFIG[role];
          return (
            <TouchableOpacity
              key={role}
              style={[styles.roleCard, { backgroundColor: config.bg }]}
              onPress={() => onSelectRole(role)}
              activeOpacity={0.85}
            >
              <Text style={[styles.roleLabel, { color: config.color }]}>{config.label}</Text>
              <Text style={styles.roleSub}>{config.sub}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundDark,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    alignItems: "center",
  },
  logoImage: {
    width: 100,
    height: 100,
    marginBottom: theme.spacing.sm,
  },
  tagline: {
    marginTop: theme.spacing.sm,
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    letterSpacing: 0.3,
  },
  content: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
  },
  signOutButton: {
    alignSelf: "flex-end",
    marginBottom: theme.spacing.lg,
  },
  signOutText: {
    color: theme.colors.textMuted,
    fontSize: 14,
    fontWeight: "600",
  },
  roleCard: {
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  roleLabel: {
    fontWeight: "700",
    fontSize: 17,
  },
  roleSub: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },
});
