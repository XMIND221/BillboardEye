import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import PanelCard from "../components/PanelCard";
import { syncOfflineData } from "../services/syncService";

export default function HomeScreen({ navigation, route }) {
  const [panneaux, setPanneaux] = useState([]);
  const [isOnline, setIsOnline] = useState(true);
  const [syncMessage, setSyncMessage] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (!route.params?.createdPanneau) {
      return;
    }

    const createdPanneau = route.params.createdPanneau;
    setPanneaux((prev) => {
      const alreadyExists = prev.some((item) => item.id === createdPanneau.id);
      if (alreadyExists) {
        return prev;
      }
      return [createdPanneau, ...prev];
    });
    navigation.setParams({ createdPanneau: undefined });
  }, [route.params?.createdPanneau, navigation]);

  const runSync = async () => {
    if (isSyncing) {
      return;
    }

    setIsSyncing(true);
    setSyncMessage("Synchronisation en cours...");

    const result = await syncOfflineData();
    setSyncMessage(result.message);
    setIsSyncing(false);
  };

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = Boolean(state.isConnected && state.isInternetReachable !== false);
      setIsOnline(online);

      if (online) {
        runSync();
      } else {
        setSyncMessage("Mode offline");
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => navigation.navigate("CreatePanneau")}
      >
        <Text style={styles.primaryButtonText}>Creer panneau</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.syncButton} onPress={runSync} disabled={isSyncing}>
        <Text style={styles.syncButtonText}>Synchroniser</Text>
      </TouchableOpacity>
      <Text style={styles.networkText}>{isOnline ? "En ligne" : "Mode offline"}</Text>
      {!!syncMessage && <Text style={styles.syncMessage}>{syncMessage}</Text>}

      <Text style={styles.sectionTitle}>Panneaux envoyes</Text>

      <FlatList
        data={panneaux}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PanelCard panneau={item} />}
        ListEmptyComponent={<Text>Aucun panneau envoye pour le moment.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f7f7f7",
  },
  syncButton: {
    backgroundColor: "#0f766e",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
  },
  syncButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  networkText: {
    fontWeight: "600",
    marginBottom: 4,
  },
  syncMessage: {
    marginBottom: 12,
    color: "#4b5563",
  },
  primaryButton: {
    backgroundColor: "#1f6feb",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 16,
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
});
