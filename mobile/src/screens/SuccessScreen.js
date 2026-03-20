import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

export default function SuccessScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Panneau enregistre avec succes</Text>
        <Text style={styles.subtitle}>Les donnees sont pretes pour la synchronisation.</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate("CreatePanneau")}>
          <Text style={styles.primaryText}>Creer un autre panneau</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate("MainTabs")}
        >
          <Text style={styles.secondaryText}>Retour accueil</Text>
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
    justifyContent: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  subtitle: {
    marginTop: 8,
    color: "#4B5563",
  },
  primaryButton: {
    marginTop: 18,
    backgroundColor: "#2563EB",
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryText: {
    color: "#fff",
    fontWeight: "700",
  },
  secondaryButton: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#2563EB",
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryText: {
    color: "#2563EB",
    fontWeight: "700",
  },
});
