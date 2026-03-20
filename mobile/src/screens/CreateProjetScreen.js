import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { createProjet } from "../services/api";
import { saveSelectedProject } from "../services/projectStorage";

export default function CreateProjetScreen({ navigation }) {
  const [nom, setNom] = useState("");
  const [entreprise, setEntreprise] = useState("");
  const [zone, setZone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async () => {
    if (!nom || !entreprise) {
      setError("Nom et entreprise sont obligatoires.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const projet = await createProjet({ nom, entreprise, zone });
      await saveSelectedProject(projet);
      navigation.replace("CreatePanneau", { selectedProjet: projet });
    } catch (err) {
      setError(err.message || "Erreur lors de la creation du projet.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Nom de la campagne</Text>
      <TextInput style={styles.input} value={nom} onChangeText={setNom} />

      <Text style={styles.label}>Client</Text>
      <TextInput style={styles.input} value={entreprise} onChangeText={setEntreprise} />

      <Text style={styles.label}>Zones a traiter</Text>
      <TextInput
        style={styles.input}
        value={zone}
        onChangeText={setZone}
        placeholder="Ex: Plateau, Medina, Almadies"
      />

      <TouchableOpacity style={styles.primaryButton} onPress={onSubmit} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryText}>Creer la campagne</Text>
        )}
      </TouchableOpacity>

      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FB",
    padding: 16,
  },
  label: {
    fontWeight: "700",
    marginBottom: 6,
    marginTop: 10,
    color: "#111827",
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  primaryButton: {
    marginTop: 18,
    backgroundColor: "#2563EB",
    borderRadius: 16,
    alignItems: "center",
    paddingVertical: 14,
  },
  primaryText: {
    color: "#fff",
    fontWeight: "700",
  },
  errorText: {
    marginTop: 12,
    color: "#DC2626",
  },
});
