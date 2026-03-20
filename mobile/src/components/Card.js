import React from "react";
import { View, StyleSheet } from "react-native";
import { theme } from "../theme";

export default function Card({ children, style, variant = "default" }) {
  const variantStyles = {
    default: styles.card,
    elevated: styles.cardElevated,
    pastel: styles.cardPastel,
  };
  return <View style={[variantStyles[variant] || styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  cardElevated: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.md,
  },
  cardPastel: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    ...theme.shadows.sm,
  },
});
