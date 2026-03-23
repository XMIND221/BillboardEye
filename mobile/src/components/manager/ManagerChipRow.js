import React from "react";
import { ScrollView, Text, TouchableOpacity, StyleSheet, View } from "react-native";
import { theme } from "../../theme";

/**
 * @param {{ label?: string, items: Array<{ key: string, label: string }>, selectedKey: string, onSelect: (key: string) => void }} props
 */
export default function ManagerChipRow({ label, items, selectedKey, onSelect }) {
  return (
    <View style={styles.block}>
      {label ? <Text style={styles.blockLabel}>{label}</Text> : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {items.map((item) => {
          const on = item.key === selectedKey;
          return (
            <TouchableOpacity
              key={item.key}
              style={[styles.chip, on && styles.chipOn]}
              onPress={() => onSelect(item.key)}
              activeOpacity={0.85}
            >
              <Text style={[styles.chipText, on && styles.chipTextOn]} numberOfLines={1}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { marginBottom: theme.spacing.sm },
  blockLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: theme.colors.textMuted,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  row: { flexDirection: "row", gap: 8, paddingRight: theme.spacing.md },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  chipOn: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryMuted,
  },
  chipText: { fontSize: 13, fontWeight: "600", color: theme.colors.textSecondary },
  chipTextOn: { color: theme.colors.primary, fontWeight: "800" },
});
