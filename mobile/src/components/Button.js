import React from "react";
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from "react-native";
import { theme } from "../theme";

export default function Button({
  title,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  style,
  textStyle,
}) {
  const variantStyles = {
    primary: styles.primary,
    secondary: styles.secondary,
    ghost: styles.ghost,
    success: styles.success,
  };
  const textVariantStyles = {
    primary: styles.primaryText,
    secondary: styles.secondaryText,
    ghost: styles.ghostText,
    success: styles.successText,
  };
  return (
    <TouchableOpacity
      style={[styles.base, variantStyles[variant] || styles.primary, disabled && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" || variant === "success" ? "#fff" : theme.colors.accent} />
      ) : (
        <Text style={[textVariantStyles[variant] || styles.primaryText, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.radius.xl,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
  },
  primary: {
    backgroundColor: theme.colors.accent,
  },
  primaryText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  secondary: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: theme.colors.accent,
  },
  secondaryText: {
    color: theme.colors.accent,
    fontWeight: "700",
    fontSize: 16,
  },
  ghost: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  ghostText: {
    color: theme.colors.text,
    fontWeight: "600",
    fontSize: 16,
  },
  success: {
    backgroundColor: theme.colors.success,
  },
  successText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  disabled: {
    opacity: 0.6,
  },
});
