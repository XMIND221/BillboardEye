import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { theme } from "../../theme";

/**
 * @param {{ label: string, current: number, total: number, percent?: number, accentColor?: string }} props
 */
export default function ProgressBarBlock({ label, current, total, percent, accentColor }) {
  const pct = percent != null ? Math.min(100, Math.max(0, percent)) : total > 0 ? Math.round((current / total) * 100) : 0;
  const fillColor = accentColor || theme.colors.success;

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>
          {current} / {total} ({pct}%)
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: fillColor }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginVertical: theme.spacing.sm },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  label: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: "600" },
  value: { color: theme.colors.text, fontSize: 13, fontWeight: "700" },
  track: {
    height: 8,
    backgroundColor: "rgba(0,0,0,0.06)",
    borderRadius: theme.radius.sm,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: theme.radius.sm,
  },
});
