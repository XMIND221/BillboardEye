import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

export default function ProfileScreen({ userRole = "employe", onSwitchRole }) {
  const roleLabel = userRole === "directeur" ? "Directeur" : "Employe";

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profil</Text>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Utilisateur</Text>
        <Text style={styles.row}>Application: BillboardEye</Text>
        <Text style={styles.row}>Mode: {roleLabel}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Parametres</Text>
        <Text style={styles.row}>Theme: Clair</Text>
        <Text style={styles.row}>Synchronisation: Active</Text>
        <TouchableOpacity style={styles.switchButton} onPress={onSwitchRole}>
          <Text style={styles.switchButtonText}>Changer de mode</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FB",
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 12,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  sectionTitle: {
    fontWeight: "800",
    marginBottom: 8,
  },
  row: {
    color: "#374151",
    marginBottom: 5,
  },
  switchButton: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#2563EB",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  switchButtonText: {
    color: "#2563EB",
    fontWeight: "700",
  },
});
