import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "../theme";
import AppHeader from "../components/AppHeader";

/**
 * @param {{ userEmail?: string, onSwitchRole?: () => void, onSignOut?: () => void }} props
 */
export default function ProfileScreen({ userEmail = "", onSwitchRole, onSignOut }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <AppHeader />
      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Profil</Text>
        <Text style={styles.lead}>Compte et préférences</Text>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Compte</Text>
          {userEmail ? (
            <Text style={styles.email}>{userEmail}</Text>
          ) : (
            <Text style={styles.muted}>Non connecté</Text>
          )}
          <Text style={styles.row}>Application BillboardEye</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Actions</Text>
          {onSwitchRole && (
            <TouchableOpacity style={styles.primaryBtn} onPress={onSwitchRole} activeOpacity={0.85}>
              <Text style={styles.primaryBtnText}>Changer de mode</Text>
            </TouchableOpacity>
          )}
          {onSignOut && (
            <TouchableOpacity style={styles.outlineBtn} onPress={onSignOut} activeOpacity={0.85}>
              <Text style={styles.outlineBtnText}>Se déconnecter</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: theme.colors.text,
  },
  lead: {
    marginTop: 4,
    fontSize: 14,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.lg,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  sectionTitle: {
    fontWeight: "800",
    marginBottom: theme.spacing.sm,
    fontSize: 15,
    color: theme.colors.text,
  },
  email: {
    fontSize: 15,
    color: theme.colors.primary,
    fontWeight: "600",
    marginBottom: 8,
  },
  muted: {
    color: theme.colors.textMuted,
    marginBottom: 8,
  },
  row: {
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  primaryBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  primaryBtnText: {
    color: theme.colors.primaryForeground,
    fontWeight: "700",
    fontSize: 16,
  },
  outlineBtn: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingVertical: 14,
    alignItems: "center",
  },
  outlineBtnText: {
    color: theme.colors.text,
    fontWeight: "700",
    fontSize: 16,
  },
});
