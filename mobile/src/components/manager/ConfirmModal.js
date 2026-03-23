import React from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet, Pressable } from "react-native";
import { theme } from "../../theme";

/**
 * @param {{ visible: boolean, title?: string, message: string, confirmLabel?: string, cancelLabel?: string, destructive?: boolean, onConfirm: () => void, onCancel: () => void }} props
 */
export default function ConfirmModal({
  visible,
  title = "Confirmation",
  message,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  destructive,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.row}>
            <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={onCancel} activeOpacity={0.85}>
              <Text style={styles.btnGhostText}>{cancelLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, destructive ? styles.btnDanger : styles.btnPrimary]}
              onPress={onConfirm}
              activeOpacity={0.85}
            >
              <Text style={styles.btnPrimaryText}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: theme.spacing.lg,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.lg,
  },
  title: { fontSize: 18, fontWeight: "800", color: theme.colors.text, marginBottom: theme.spacing.sm },
  message: { fontSize: 15, color: theme.colors.textSecondary, lineHeight: 22, marginBottom: theme.spacing.lg },
  row: { flexDirection: "row", justifyContent: "flex-end", gap: theme.spacing.sm },
  btn: { paddingVertical: 12, paddingHorizontal: 18, borderRadius: theme.radius.md, minWidth: 110, alignItems: "center" },
  btnGhost: { borderWidth: 1, borderColor: theme.colors.border },
  btnGhostText: { color: theme.colors.text, fontWeight: "700", fontSize: 14 },
  btnPrimary: { backgroundColor: theme.colors.primary },
  btnDanger: { backgroundColor: theme.colors.error },
  btnPrimaryText: { color: "#fff", fontWeight: "800", fontSize: 14 },
});
