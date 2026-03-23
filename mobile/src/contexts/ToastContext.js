import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { View, Text, StyleSheet, Animated, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "../theme";

const ToastContext = createContext({
  showToast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }) {
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState("");
  const [kind, setKind] = useState("success");
  const opacity = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef(null);

  const showToast = useCallback(
    (text, type = "success") => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      setMessage(String(text || ""));
      setKind(type === "error" ? "error" : "success");
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
      hideTimer.current = setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => setMessage(""));
      }, 2600);
    },
    [opacity],
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {!!message && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.wrap,
            {
              opacity,
              bottom: insets.bottom + (Platform.OS === "ios" ? 72 : 64),
            },
            kind === "error" ? styles.wrapErr : styles.wrapOk,
          ]}
        >
          <Text style={styles.text}>{message}</Text>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: theme.spacing.md,
    right: theme.spacing.md,
    paddingVertical: 14,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    alignItems: "center",
    justifyContent: "center",
    ...theme.shadows.md,
  },
  wrapOk: {
    backgroundColor: theme.colors.text,
  },
  wrapErr: {
    backgroundColor: theme.colors.error,
  },
  text: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
    textAlign: "center",
  },
});
