import React from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../theme";

/**
 * @param {{ visible: boolean, onClose: () => void, title?: string, actions: Array<{ key: string, label: string, icon?: keyof typeof Ionicons.glyphMap, destructive?: boolean, onPress: () => void }> }} props
 */
export default function ManagerActionSheet({ visible, onClose, title, actions }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          {title ? <Text style={styles.sheetTitle}>{title}</Text> : null}
          {actions.map((a) => (
            <TouchableOpacity
              key={a.key}
              style={styles.actionRow}
              onPress={() => {
                onClose();
                setTimeout(() => a.onPress(), 0);
              }}
              activeOpacity={0.85}
            >
              {a.icon ? (
                <Ionicons
                  name={a.icon}
                  size={22}
                  color={a.destructive ? theme.colors.error : theme.colors.primary}
                  style={styles.actionIcon}
                />
              ) : null}
              <Text style={[styles.actionLabel, a.destructive && styles.actionLabelDanger]}>{a.label}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.85}>
            <Text style={styles.cancelText}>Fermer</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    paddingBottom: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sheetTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: theme.colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  actionIcon: { marginRight: theme.spacing.md },
  actionLabel: { fontSize: 16, fontWeight: "600", color: theme.colors.text },
  actionLabelDanger: { color: theme.colors.error },
  cancelBtn: { marginTop: theme.spacing.sm, paddingVertical: 14, alignItems: "center" },
  cancelText: { fontSize: 16, fontWeight: "700", color: theme.colors.textMuted },
});
