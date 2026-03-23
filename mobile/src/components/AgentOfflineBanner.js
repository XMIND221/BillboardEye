import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { theme } from "../theme";
import { useNetworkSync } from "../contexts/NetworkSyncContext";

/**
 * Bandeau discret mode terrain : hors ligne / sync / erreurs.
 */
export default function AgentOfflineBanner({ onPressRetry }) {
  const { isOnline, isSyncing, pendingCount, errorCount, runManualSync } = useNetworkSync();

  const handleRetry = () => {
    if (typeof onPressRetry === "function") onPressRetry();
    runManualSync();
  };

  if (isSyncing) {
    return (
      <View style={[styles.bar, styles.barSync]}>
        <ActivityIndicator size="small" color="#1e40af" style={styles.spinner} />
        <Text style={styles.textSync}>Synchronisation en cours…</Text>
      </View>
    );
  }

  if (!isOnline) {
    return (
      <View style={[styles.bar, styles.barOffline]}>
        <Text style={styles.textOffline}>Mode hors ligne activé — enregistrement local</Text>
      </View>
    );
  }

  if (errorCount > 0 && pendingCount > 0) {
    return (
      <TouchableOpacity style={[styles.bar, styles.barError]} onPress={handleRetry} activeOpacity={0.85}>
        <Text style={styles.textError}>Envoi en erreur — toucher pour réessayer</Text>
      </TouchableOpacity>
    );
  }

  if (pendingCount > 0) {
    return (
      <TouchableOpacity style={[styles.bar, styles.barPending]} onPress={handleRetry} activeOpacity={0.85}>
        <Text style={styles.textPending}>{pendingCount} en attente de sync — toucher pour envoyer</Text>
      </TouchableOpacity>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  bar: {
    paddingVertical: 10,
    paddingHorizontal: theme.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  barOffline: {
    backgroundColor: "rgba(217, 119, 6, 0.2)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(217, 119, 6, 0.35)",
  },
  textOffline: {
    color: "#92400e",
    fontWeight: "700",
    fontSize: 13,
    textAlign: "center",
  },
  barSync: {
    backgroundColor: "rgba(37, 99, 235, 0.14)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(37, 99, 235, 0.25)",
  },
  textSync: {
    color: "#1e40af",
    fontWeight: "700",
    fontSize: 13,
  },
  spinner: { marginRight: 4 },
  barPending: {
    backgroundColor: theme.colors.muted,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  textPending: {
    color: theme.colors.textSecondary,
    fontWeight: "600",
    fontSize: 12,
    textAlign: "center",
  },
  barError: {
    backgroundColor: "rgba(220, 38, 38, 0.12)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(220, 38, 38, 0.25)",
  },
  textError: {
    color: theme.colors.error,
    fontWeight: "700",
    fontSize: 12,
    textAlign: "center",
  },
});
