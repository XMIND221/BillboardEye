import React from "react";
import { TextInput, StyleSheet } from "react-native";
import { theme } from "../theme";

export default function Input({
  value,
  onChangeText,
  placeholder,
  placeholderTextColor = theme.colors.textMuted,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  autoComplete,
  style,
  multiline,
  ...props
}) {
  return (
    <TextInput
      style={[styles.input, multiline && styles.multiline, style]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={placeholderTextColor}
      secureTextEntry={secureTextEntry}
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
      autoComplete={autoComplete}
      multiline={multiline}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingVertical: 16,
    paddingHorizontal: 20,
    fontSize: 16,
    color: theme.colors.text,
  },
  multiline: {
    minHeight: 100,
    textAlignVertical: "top",
  },
});
