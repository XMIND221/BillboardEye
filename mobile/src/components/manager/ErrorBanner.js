import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { theme } from "../../theme";

export default function ErrorBanner({ message, onRetry }) {
  if (!message) return null;
  return (
    <View style={styles.card}>
      <Text style={styles.text}>{message}</Text>
      {onRetry ? (
        <TouchableOpacity style={styles.btn} onPress={onRetry} activeOpacity={0.85}>
          <Text style={styles.btnText}>Réessayer</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.25)",
  },
  text: { color: theme.colors.error, fontSize: 14, lineHeight: 20, marginBottom: theme.spacing.sm },
  btn: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.accent,
  },
  btnText: { color: theme.colors.accent, fontWeight: "700", fontSize: 13 },
});
