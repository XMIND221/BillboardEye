import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import * as Location from "expo-location";
import { createPanneau, isNetworkError } from "../services/api";
import { savePanneauOffline } from "../services/offlineStorage";

export default function CreatePanneauScreen({ navigation }) {
  const [entreprise, setEntreprise] = useState("");
  const [adresse, setAdresse] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [nombreFaces, setNombreFaces] = useState("2");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const getCurrentPosition = async () => {
    try {
      setLoading(true);
      setError("");
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        setError("Permission localisation refusee.");
        return;
      }

      const position = await Location.getCurrentPositionAsync({});
      setLatitude(String(position.coords.latitude));
      setLongitude(String(position.coords.longitude));
    } catch (_err) {
      setError("Impossible de recuperer la position GPS.");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async () => {
    if (!entreprise || !latitude || !longitude) {
      setError("Entreprise, latitude et longitude sont obligatoires.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const panneau = await createPanneau({
        entreprise,
        adresse,
        latitude: Number(latitude),
        longitude: Number(longitude),
        nombreFaces: Number(nombreFaces) || 1,
      });

      navigation.navigate("Photos", { panneau });
    } catch (err) {
      if (isNetworkError(err)) {
        const offlinePanneau = {
          id: `offline-${Date.now()}`,
          entreprise,
          localisation: {
            adresse,
            latitude: Number(latitude),
            longitude: Number(longitude),
          },
          nombreFaces: Number(nombreFaces) || 1,
          statut: "pending",
          createdAt: new Date().toISOString(),
          offline: true,
        };

        await savePanneauOffline({
          id: offlinePanneau.id,
          entreprise: offlinePanneau.entreprise,
          localisation: offlinePanneau.localisation,
          nombreFaces: offlinePanneau.nombreFaces,
          statut: offlinePanneau.statut,
          createdAt: offlinePanneau.createdAt,
        });

        navigation.navigate("Photos", { panneau: offlinePanneau });
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>Entreprise</Text>
      <TextInput style={styles.input} value={entreprise} onChangeText={setEntreprise} />

      <Text style={styles.label}>Adresse</Text>
      <TextInput style={styles.input} value={adresse} onChangeText={setAdresse} />

      <TouchableOpacity style={styles.secondaryButton} onPress={getCurrentPosition}>
        <Text style={styles.secondaryButtonText}>Obtenir position GPS</Text>
      </TouchableOpacity>

      <Text style={styles.label}>Latitude</Text>
      <TextInput style={styles.input} value={latitude} onChangeText={setLatitude} />

      <Text style={styles.label}>Longitude</Text>
      <TextInput style={styles.input} value={longitude} onChangeText={setLongitude} />

      <Text style={styles.label}>Nombre de faces</Text>
      <TextInput
        style={styles.input}
        value={nombreFaces}
        onChangeText={setNombreFaces}
        keyboardType="numeric"
      />

      <TouchableOpacity style={styles.primaryButton} onPress={onSubmit} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryText}>Continuer vers photos</Text>
        )}
      </TouchableOpacity>

      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#fff",
  },
  label: {
    fontWeight: "600",
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d0d0d0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  secondaryButton: {
    marginTop: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#1f6feb",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#1f6feb",
    fontWeight: "600",
  },
  primaryButton: {
    marginTop: 16,
    backgroundColor: "#1f6feb",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  primaryText: {
    color: "#fff",
    fontWeight: "700",
  },
  errorText: {
    marginTop: 12,
    color: "#b42318",
  },
});
