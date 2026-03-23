import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../theme";
import { useDemo } from "../contexts/DemoContext";

/**
 * En-tête type v0 MobileShell : logo BE + BillboardEye, badge sync (NetInfo).
 * @param {{ title?: string, onBack?: () => void, rightExtra?: React.ReactNode }} props
 */
export default function AppHeader({ title, onBack, rightExtra }) {
  const insets = useSafeAreaInsets();
  const { isDemo } = useDemo();
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const sub = NetInfo.addEventListener((state) => {
      setOnline(state.isConnected === true && state.isInternetReachable !== false);
    });
    NetInfo.fetch().then((state) => {
      setOnline(state.isConnected === true && state.isInternetReachable !== false);
    });
    return () => sub();
  }, []);

  return (
    <View
      style={[
        styles.wrap,
        {
          paddingTop: Math.max(insets.top, Platform.OS === "android" ? 8 : 12),
        },
      ]}
    >
      <View style={styles.row}>
        <View style={styles.left}>
          {onBack ? (
            <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={12} accessibilityRole="button" accessibilityLabel="Retour">
              <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          ) : null}
          {title ? (
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
          ) : (
            <View style={styles.brandRow}>
              <View style={styles.logoBox}>
                <Text style={styles.logoText}>BE</Text>
              </View>
              <Text style={styles.brand}>BillboardEye</Text>
            </View>
          )}
        </View>
        <View style={styles.right}>
          {isDemo ? (
            <View style={styles.demoPill}>
              <Text style={styles.demoPillText}>Démo</Text>
            </View>
          ) : null}
          {rightExtra}
          <SyncBadge online={online} />
        </View>
      </View>
    </View>
  );
}

function SyncBadge({ online }) {
  return (
    <View style={[styles.badge, online ? styles.badgeOn : styles.badgeOff]}>
      <Ionicons name={online ? "wifi" : "cloud-offline-outline"} size={14} color={online ? theme.colors.success : "#EA580C"} />
      <Text style={[styles.badgeText, { color: online ? theme.colors.success : "#C2410C" }]}>{online ? "En ligne" : "Hors ligne"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: theme.colors.canvas,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.md,
    minHeight: 52,
  },
  left: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  backBtn: {
    marginRight: 4,
    marginLeft: -4,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.colors.text,
    flex: 1,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logoBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    color: theme.colors.primaryForeground,
    fontWeight: "800",
    fontSize: 13,
  },
  brand: {
    fontSize: 17,
    fontWeight: "600",
    color: theme.colors.text,
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radius.pill,
  },
  badgeOn: {
    backgroundColor: "rgba(22, 163, 74, 0.12)",
  },
  badgeOff: {
    backgroundColor: "rgba(234, 88, 12, 0.12)",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  demoPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radius.pill,
    backgroundColor: "rgba(217, 119, 6, 0.18)",
  },
  demoPillText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#B45309",
  },
});
