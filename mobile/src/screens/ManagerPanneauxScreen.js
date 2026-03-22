import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator } from "react-native";
import { theme } from "../theme";
import AppHeader from "../components/AppHeader";
import PanelCard from "../components/PanelCard";
import { getPanneaux, getProjets } from "../services/api";
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

export default function ManagerPanneauxScreen() {
  const [panneaux, setPanneaux] = useState([]);
  const [projetsById, setProjetsById] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      const [projets, panels] = await Promise.all([getProjets(), getPanneaux()]);
      const map = {};
      (projets || []).forEach((p) => {
        map[p.id] = p.nom;
      });
      setProjetsById(map);
      let list = (panels || []).map((item) => ({
        id: item.id,
        serverId: item.id,
        entreprise: item.entreprise,
        projetId: item.projetId,
        localisation: item.localisation,
        nombreFaces: item.nombreFaces,
        statut: item.statut,
        createdAt: item.createdAt,
        photos: item.photos || null,
      }));
      list = await Promise.all(list.map(enrichWithPhotos));
      setPanneaux(list);
    } catch (err) {
      setError(err.message || "Impossible de charger les panneaux.");
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await load();
      setLoading(false);
    })();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <View style={styles.root}>
      <AppHeader />
      <View style={styles.container}>
        <Text style={styles.title}>Tous les panneaux</Text>
        <Text style={styles.subtitle}>Vue gestionnaire — panneaux synchronisés depuis le serveur.</Text>
        {!!error && <Text style={styles.error}>{error}</Text>}
        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
        ) : (
          <FlatList
            data={panneaux}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
            renderItem={({ item }) => <PanelCard panneau={item} projetNom={projetsById[item.projetId]} />}
            ListEmptyComponent={<Text style={styles.empty}>Aucun panneau enregistré.</Text>}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  container: { flex: 1, paddingHorizontal: theme.spacing.lg },
  title: { fontSize: 22, fontWeight: "800", color: theme.colors.text, marginTop: theme.spacing.sm },
  subtitle: { marginTop: 4, marginBottom: theme.spacing.md, color: theme.colors.textSecondary, fontSize: 14 },
  list: { paddingBottom: theme.spacing.xxl },
  empty: { color: theme.colors.textMuted, marginTop: theme.spacing.xl, textAlign: "center", fontSize: 15 },
  error: { color: theme.colors.error, marginBottom: theme.spacing.sm, fontSize: 14 },
  loader: { marginTop: 48 },
});
