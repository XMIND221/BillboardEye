import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { theme } from "../theme";
import { useDemo } from "../contexts/DemoContext";

/**
 * Actions compactes pour l’en-tête gestionnaire (Changer / Déconnexion).
 */
export default function ManagerHeaderActions({ onSwitchRole, onSignOut, userEmail, compact }) {
  const { isDemo, demoUserEmail } = useDemo();
  const displayEmail = isDemo ? `${demoUserEmail} · démo` : userEmail;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: compact ? 8 : 10,
        maxWidth: compact ? 160 : 220,
      }}
    >
      {displayEmail && !compact ? (
        <Text style={{ color: theme.colors.textMuted, fontSize: 11 }} numberOfLines={1}>
          {displayEmail}
        </Text>
      ) : null}
      <TouchableOpacity onPress={onSwitchRole} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
        <Text style={{ color: theme.colors.primary, fontWeight: "700", fontSize: 13 }}>Changer</Text>
      </TouchableOpacity>
      {onSignOut ? (
        <TouchableOpacity onPress={onSignOut} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={{ color: theme.colors.textSecondary, fontWeight: "600", fontSize: 11 }} numberOfLines={1}>
            Déconnexion
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
