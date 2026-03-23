import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { theme } from "../../theme";

const PASTEL_KEYS = ["blue", "green", "pink", "purple", "orange"];

/**
 * @param {{ label: string, value: string | number, hint?: string, tone?: number, style?: object }} props
 */
export default function KpiCard({ label, value, hint, tone = 0, style }) {
  const key = PASTEL_KEYS[tone % PASTEL_KEYS.length];
  const bg = theme.colors.pastels[key];

  return (
    <View style={[styles.card, { backgroundColor: bg }, style]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  label: {
    color: theme.colors.textSecondary,
    fontWeight: "600",
    fontSize: 13,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  value: {
    color: theme.colors.text,
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  hint: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginTop: 8,
    lineHeight: 17,
  },
});
