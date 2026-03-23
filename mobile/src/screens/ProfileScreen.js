import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../theme";
import AppHeader from "../components/AppHeader";
import SectionHeader from "../components/manager/SectionHeader";

/**
 * @param {{ userEmail?: string, onSwitchRole?: () => void, onSignOut?: () => void }} props
 */
export default function ProfileScreen({ userEmail = "", onSwitchRole, onSignOut }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <AppHeader />
      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 28 }]}
        showsVerticalScrollIndicator={false}
      >
        <SectionHeader title="Profil" subtitle="Compte, rôle et déconnexion sécurisée." />

        <View style={styles.card}>
          <Text style={styles.cardKicker}>COMPTE</Text>
          {userEmail ? (
            <Text style={styles.email}>{userEmail}</Text>
          ) : (
            <Text style={styles.muted}>Session locale ou email non disponible</Text>
          )}
          <View style={styles.appRow}>
            <Ionicons name="apps-outline" size={18} color={theme.colors.textSecondary} />
            <Text style={styles.appName}>BillboardEye · mobile</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Actions</Text>
        {onSwitchRole ? (
          <TouchableOpacity style={styles.rowAction} onPress={onSwitchRole} activeOpacity={0.88}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconWrap, { backgroundColor: theme.colors.primaryMuted }]}>
                <Ionicons name="swap-horizontal" size={20} color={theme.colors.primary} />
              </View>
              <View>
                <Text style={styles.rowTitle}>Changer de mode</Text>
                <Text style={styles.rowHint}>Gestionnaire, terrain ou reporting</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
          </TouchableOpacity>
        ) : null}

        {onSignOut ? (
          <TouchableOpacity style={styles.rowActionMuted} onPress={onSignOut} activeOpacity={0.88}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconWrap, { backgroundColor: "rgba(115,115,115,0.1)" }]}>
                <Ionicons name="log-out-outline" size={20} color={theme.colors.textSecondary} />
              </View>
              <View>
                <Text style={styles.rowTitle}>Se déconnecter</Text>
                <Text style={styles.rowHint}>Ferme la session sur cet appareil</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.canvas,
  },
  container: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.xs,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  cardKicker: {
    fontSize: 11,
    fontWeight: "800",
    color: theme.colors.textMuted,
    letterSpacing: 1,
    marginBottom: theme.spacing.sm,
  },
  email: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: "700",
    marginBottom: theme.spacing.md,
  },
  muted: {
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.md,
    fontSize: 15,
  },
  appRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: theme.spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
  },
  appName: { fontSize: 14, color: theme.colors.textSecondary, fontWeight: "600" },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: theme.colors.textMuted,
    letterSpacing: 1,
    marginBottom: theme.spacing.sm,
    marginLeft: 4,
  },
  rowAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  rowActionMuted: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: theme.spacing.md, flex: 1 },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitle: { fontSize: 16, fontWeight: "700", color: theme.colors.text },
  rowHint: { fontSize: 12, color: theme.colors.textMuted, marginTop: 2 },
});
