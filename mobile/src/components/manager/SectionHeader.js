import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { theme } from "../../theme";

/**
 * Titre de section type SaaS (hiérarchie claire).
 */
export default function SectionHeader({ title, subtitle, right }) {
  return (
    <View style={styles.row}>
      <View style={styles.textBlock}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  textBlock: { flex: 1, minWidth: 0 },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: theme.colors.text,
    letterSpacing: -0.4,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  right: { justifyContent: "center", minHeight: 28 },
});
