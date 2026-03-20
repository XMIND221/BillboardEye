import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, RefreshControl } from "react-native";
import { theme } from "../theme";
import PanelCard from "../components/PanelCard";
import { getAllOfflineData } from "../services/offlineStorage";
import { getRapport } from "../services/api";

const enrichWithPhotos = async (panneau) => {
  if (panneau.photos?.faceA?.url || panneau.photos?.faceB?.url) return panneau;
  if (!panneau.serverId) return panneau;
  try {
    const rapport = await getRapport(panneau.serverId);
    const photos = {};
    if (rapport?.photos?.faceA?.url) photos.faceA = { url: rapport.photos.faceA.url };
    if (rapport?.photos?.faceB?.url) photos.faceB = { url: rapport.photos.faceB.url };
    return { ...panneau, photos: Object.keys(photos).length ? photos : null };
  } catch (_err) {
    return panneau;
  }
};

export default function AgentPanneauxScreen({ navigation }) {
  const [panneaux, setPanneaux] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadPanneaux = useCallback(async () => {
    const stored = await getAllOfflineData();
    let tracked = stored.panneaux
      .map((item) => ({
        id: item.serverId || item.localId,
        localId: item.localId,
        serverId: item.serverId,
        entreprise: item.entreprise,
        projetId: item.projetId,
        localisation: item.localisation,
        nombreFaces: item.nombreFaces,
        statut: item.statut,
        createdAt: item.createdAt,
        photos: item.photos || null,
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    tracked = await Promise.all(tracked.map(enrichWithPhotos));
    setPanneaux(tracked);
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", loadPanneaux);
    return unsubscribe;
  }, [navigation, loadPanneaux]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPanneaux();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mes panneaux validés</Text>
      <Text style={styles.subtitle}>Historique des panneaux enregistrés lors des missions terrain.</Text>
      <FlatList
        data={panneaux}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.accent} />}
        renderItem={({ item }) => <PanelCard panneau={item} />}
        ListEmptyComponent={<Text style={styles.empty}>Aucun panneau validé pour le moment.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing.md },
  title: { fontSize: 22, fontWeight: "800", color: theme.colors.text },
  subtitle: { marginTop: 4, marginBottom: theme.spacing.md, color: theme.colors.textSecondary, fontSize: 14 },
  empty: { color: theme.colors.textMuted, marginTop: theme.spacing.lg, textAlign: "center" },
});
