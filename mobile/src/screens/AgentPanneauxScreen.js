import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from "react-native";
import { theme } from "../theme";
import AppHeader from "../components/AppHeader";
import PanelCard from "../components/PanelCard";
import { getAllOfflineData } from "../services/offlineStorage";
import { getRapport, getProjets } from "../services/api";

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
  const [projetsById, setProjetsById] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  const loadPanneaux = useCallback(async () => {
    const [stored, projets] = await Promise.all([getAllOfflineData(), getProjets().catch(() => [])]);
    const map = {};
    (projets || []).forEach((p) => { map[p.id] = p.nom; });
    setProjetsById(map);
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
    <View style={styles.root}>
      <AppHeader />
      <View style={styles.container}>
        <View style={styles.headRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Mes panneaux</Text>
            <Text style={styles.subtitle}>Panneaux validés lors des missions terrain.</Text>
          </View>
          <TouchableOpacity style={styles.uploadBtn} onPress={() => navigation.navigate("UploadPanneau")} activeOpacity={0.85}>
            <Text style={styles.uploadBtnText}>Upload</Text>
          </TouchableOpacity>
        </View>
        <FlatList
        data={panneaux}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.accent} />}
        renderItem={({ item }) => <PanelCard panneau={item} projetNom={projetsById[item.projetId]} />}
        ListEmptyComponent={<Text style={styles.empty}>Aucun panneau validé pour le moment.</Text>}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  container: { flex: 1, paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.md },
  headRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: theme.spacing.md, gap: theme.spacing.sm },
  title: { fontSize: 22, fontWeight: "800", color: theme.colors.text },
  subtitle: { marginTop: 4, color: theme.colors.textSecondary, fontSize: 14 },
  uploadBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: theme.radius.md,
  },
  uploadBtnText: { color: theme.colors.primaryForeground, fontWeight: "700", fontSize: 13 },
  list: { paddingBottom: theme.spacing.xxl },
  empty: { color: theme.colors.textMuted, marginTop: theme.spacing.xl, textAlign: "center", fontSize: 15 },
});
