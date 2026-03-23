import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { theme } from "../../theme";

/**
 * @param {{ step: number, total: number, title: string }} props
 */
export default function StepProgressHeader({ step, total, title }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.rowTop}>
        <Text style={styles.badge}>
          Étape {step} / {total}
        </Text>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
      </View>
      <View style={styles.dots}>
        {Array.from({ length: total }).map((_, i) => (
          <View key={String(i)} style={[styles.dot, i < step ? styles.dotActive : styles.dotIdle]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  rowTop: { gap: 6 },
  badge: {
    fontSize: 12,
    fontWeight: "800",
    color: theme.colors.primary,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  title: { fontSize: 18, fontWeight: "800", color: theme.colors.text },
  dots: { flexDirection: "row", gap: 8, marginTop: theme.spacing.md },
  dot: { flex: 1, height: 4, borderRadius: 2, maxWidth: 72 },
  dotIdle: { backgroundColor: theme.colors.border },
  dotActive: { backgroundColor: theme.colors.accent },
});
