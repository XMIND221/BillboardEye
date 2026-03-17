import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function PanelCard({ panneau }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{panneau.entreprise}</Text>
      <Text style={styles.meta}>{panneau.localisation?.adresse || "Adresse non renseignee"}</Text>
      <Text style={styles.meta}>
        {panneau.localisation?.latitude}, {panneau.localisation?.longitude}
      </Text>
      <Text style={styles.status}>Statut: {panneau.statut}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e6e6e6",
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  meta: {
    fontSize: 13,
    color: "#666",
  },
  status: {
    marginTop: 8,
    fontWeight: "500",
  },
});
