import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "../theme";

const ROLE_CONFIG = {
  gestionnaire: {
    label: "Mode Gestionnaire",
    sub: "Créer campagnes, gérer les missions",
    bg: theme.colors.pastels.pink,
  },
  agent: {
    label: "Mode Agent terrain",
    sub: "Exécuter les missions, capturer les panneaux",
    bg: theme.colors.pastels.blue,
  },
  reporting: {
    label: "Mode Reporting",
    sub: "Générer des rapports PDF professionnels",
    bg: theme.colors.pastels.purple,
  },
};

export default function RoleGateScreen({ onSelectRole, onSignOut, isDemo, onEnterDemo }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View style={[styles.hero, { paddingTop: Math.max(insets.top, 12) + 20 }]}>
        <View style={styles.heroBrand}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>BE</Text>
          </View>
          <Text style={styles.heroTitle}>BillboardEye</Text>
        </View>
        <Text style={styles.tagline}>Choisissez votre mode</Text>
        <Text style={styles.taglineHint}>Chaque mode ouvre un espace dédié. Les listes campagnes / PDF suivent votre compte (et le rôle synchronisé).</Text>
        {isDemo ? (
          <View style={styles.demoBanner}>
            <Text style={styles.demoBannerText}>Mode démo — données fictives, rien n’est enregistré sur le serveur.</Text>
          </View>
        ) : null}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {onSignOut && (
          <TouchableOpacity style={styles.signOutButton} onPress={onSignOut} activeOpacity={0.85}>
            <Text style={styles.signOutText}>Se déconnecter</Text>
          </TouchableOpacity>
        )}

        {["gestionnaire", "agent", "reporting"].map((role) => {
          const config = ROLE_CONFIG[role];
          return (
            <TouchableOpacity
              key={role}
              style={[styles.roleCard, { backgroundColor: config.bg }]}
              onPress={() => onSelectRole(role)}
              activeOpacity={0.85}
            >
              <Text style={styles.roleLabel}>{config.label}</Text>
              <Text style={styles.roleSub}>{config.sub}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  hero: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    alignItems: "center",
  },
  heroBrand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: theme.spacing.sm,
  },
  logoBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    color: theme.colors.primaryForeground,
    fontWeight: "800",
    fontSize: 16,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: theme.colors.primaryForeground,
  },
  tagline: {
    fontSize: 15,
    color: "rgba(255,255,255,0.9)",
  },
  taglineHint: {
    fontSize: 12,
    color: "rgba(255,255,255,0.75)",
    textAlign: "center",
    marginTop: 10,
    paddingHorizontal: theme.spacing.md,
    lineHeight: 16,
  },
  scroll: {
    flex: 1,
    marginTop: -20,
  },
  content: {
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
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  roleLabel: {
    fontWeight: "700",
    fontSize: 17,
    color: theme.colors.text,
  },
  roleSub: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },
  demoBanner: {
    marginTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    borderRadius: theme.radius.md,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  demoBannerText: {
    color: theme.colors.primaryForeground,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 16,
  },
  demoEntry: {
    marginTop: theme.spacing.lg,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryMuted,
  },
  demoEntryTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: theme.colors.primary,
    textAlign: "center",
  },
  demoEntrySub: {
    marginTop: 6,
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: "center",
  },
});
