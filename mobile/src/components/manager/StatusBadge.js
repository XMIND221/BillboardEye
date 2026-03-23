import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { theme } from "../../theme";

const VARIANTS = {
  success: { bg: "rgba(22, 163, 74, 0.12)", color: theme.colors.success },
  warning: { bg: "rgba(217, 119, 6, 0.14)", color: theme.colors.warning },
  neutral: { bg: "rgba(115, 115, 115, 0.1)", color: theme.colors.textSecondary },
  accent: { bg: theme.colors.primaryMuted, color: theme.colors.primary },
  error: { bg: "rgba(220, 38, 38, 0.12)", color: theme.colors.error },
  /** Terminé / synchro complète */
  info: { bg: "rgba(37, 99, 235, 0.12)", color: "#2563EB" },
};

/**
 * @param {{ children: string, variant?: keyof typeof VARIANTS }} props
 */
export default function StatusBadge({ children, variant = "neutral" }) {
  const v = VARIANTS[variant] || VARIANTS.neutral;
  return (
    <View style={[styles.badge, { backgroundColor: v.bg }]}>
      <Text style={[styles.text, { color: v.color }]} numberOfLines={1}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.pill,
  },
  text: { fontSize: 12, fontWeight: "700" },
});
