import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { addPhoto, isNetworkError } from "../services/api";
import { savePhotoOffline } from "../services/offlineStorage";

export default function PhotoScreen({ route, navigation }) {
  const { panneau } = route.params;
  const panneauId = panneau.id;
  const [faceAUri, setFaceAUri] = useState("");
  const [faceBUri, setFaceBUri] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const requestPermissions = async () => {
      await ImagePicker.requestMediaLibraryPermissionsAsync();
      await ImagePicker.requestCameraPermissionsAsync();
    };

    requestPermissions();
  }, []);

  const takePhoto = async (setter) => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.length) {
      setter(result.assets[0].uri);
    }
  };

  const uploadPhotos = async () => {
    if (!faceAUri && !faceBUri) {
      setError("Ajoute au moins une photo.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      let savedOfflineCount = 0;

      if (faceAUri) {
        const formA = new FormData();
        formA.append("panneauId", panneauId);
        formA.append("type", "faceA");
        formA.append("image", {
          uri: faceAUri,
          name: `faceA-${Date.now()}.jpg`,
          type: "image/jpeg",
        });
        try {
          await addPhoto(formA);
        } catch (err) {
          if (!isNetworkError(err)) {
            throw err;
          }

          await savePhotoOffline({
            panneauId,
            type: "faceA",
            url: faceAUri,
            createdAt: new Date().toISOString(),
          });
          savedOfflineCount += 1;
        }
      }

      if (faceBUri) {
        const formB = new FormData();
        formB.append("panneauId", panneauId);
        formB.append("type", "faceB");
        formB.append("image", {
          uri: faceBUri,
          name: `faceB-${Date.now()}.jpg`,
          type: "image/jpeg",
        });
        try {
          await addPhoto(formB);
        } catch (err) {
          if (!isNetworkError(err)) {
            throw err;
          }

          await savePhotoOffline({
            panneauId,
            type: "faceB",
            url: faceBUri,
            createdAt: new Date().toISOString(),
          });
          savedOfflineCount += 1;
        }
      }

      if (savedOfflineCount > 0) {
        Alert.alert("Mode offline", "Photos sauvegardees localement. Sync automatique au retour reseau.");
      } else {
        Alert.alert("Succes", "Photos envoyees.");
      }
      navigation.navigate("Home", { createdPanneau: panneau });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.photoButton} onPress={() => takePhoto(setFaceAUri)}>
        <Text style={styles.photoButtonText}>Prendre photo Face A</Text>
      </TouchableOpacity>
      {!!faceAUri && <Image source={{ uri: faceAUri }} style={styles.preview} />}

      <TouchableOpacity style={styles.photoButton} onPress={() => takePhoto(setFaceBUri)}>
        <Text style={styles.photoButtonText}>Prendre photo Face B</Text>
      </TouchableOpacity>
      {!!faceBUri && <Image source={{ uri: faceBUri }} style={styles.preview} />}

      <TouchableOpacity style={styles.sendButton} onPress={uploadPhotos} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.sendText}>Envoyer</Text>}
      </TouchableOpacity>

      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  photoButton: {
    borderWidth: 1,
    borderColor: "#1f6feb",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  photoButtonText: {
    color: "#1f6feb",
    fontWeight: "700",
  },
  preview: {
    width: "100%",
    height: 180,
    borderRadius: 10,
    marginBottom: 14,
  },
  sendButton: {
    marginTop: 8,
    backgroundColor: "#16a34a",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  sendText: {
    color: "#fff",
    fontWeight: "700",
  },
  errorText: {
    marginTop: 10,
    color: "#b42318",
  },
});
