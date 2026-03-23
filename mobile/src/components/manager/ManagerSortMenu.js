import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../theme";

/**
 * @param {{ label: string, value: string, options: Array<{ key: string, label: string }>, onChange: (key: string) => void }} props
 */
export default function ManagerSortMenu({ label, value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.key === value)?.label || label;

  return (
    <>
      <TouchableOpacity style={styles.trigger} onPress={() => setOpen(true)} activeOpacity={0.88}>
        <Text style={styles.triggerText} numberOfLines={1}>
          {current}
        </Text>
        <Ionicons name="chevron-down" size={18} color={theme.colors.textMuted} />
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>{label}</Text>
            {options.map((o) => (
              <TouchableOpacity
                key={o.key}
                style={[styles.option, o.key === value && styles.optionOn]}
                onPress={() => {
                  onChange(o.key);
                  setOpen(false);
                }}
              >
                <Text style={[styles.optionText, o.key === value && styles.optionTextOn]}>{o.label}</Text>
                {o.key === value ? <Ionicons name="checkmark" size={20} color={theme.colors.primary} /> : null}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.close} onPress={() => setOpen(false)}>
              <Text style={styles.closeText}>Fermer</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    alignSelf: "flex-start",
    maxWidth: "100%",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    gap: 8,
  },
  triggerText: { fontSize: 13, fontWeight: "700", color: theme.colors.text, flexShrink: 1 },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: theme.spacing.lg,
  },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sheetTitle: { fontSize: 12, fontWeight: "800", color: theme.colors.textMuted, marginBottom: theme.spacing.sm },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  optionOn: { backgroundColor: theme.colors.primaryMuted, borderRadius: theme.radius.sm, marginVertical: 2 },
  optionText: { fontSize: 16, color: theme.colors.text, fontWeight: "600" },
  optionTextOn: { color: theme.colors.primary, fontWeight: "800" },
  close: { paddingVertical: 14, alignItems: "center" },
  closeText: { fontWeight: "700", color: theme.colors.textMuted },
});
