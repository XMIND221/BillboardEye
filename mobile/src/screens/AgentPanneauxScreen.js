import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from "react-native";
import { theme } from "../theme";
import AppHeader from "../components/AppHeader";
import PanelCard from "../components/PanelCard";
import AgentOfflineBanner from "../components/AgentOfflineBanner";
import { getAllOfflineData } from "../services/offlineStorage";
import { getAgentMissionsCache } from "../services/agentMissionCache";
import { getRapport, getProjets } from "../services/api";
import { useNetworkSync } from "../contexts/NetworkSyncContext";
import { useFocusRefresh } from "../hooks/useFocusRefresh";

const enrichWithPhotos = async (panneau) => {
  if (
    panneau.photos?.faceA?.url ||
    panneau.photos?.faceB?.url ||
    panneau.photos?.faceA?.localUri ||
    panneau.photos?.faceB?.localUri
  ) {
    return panneau;
  }
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
const INITIAL_ENRICH_LIMIT = 12;

export default function AgentPanneauxScreen({ navigation }) {
  const { refreshQueueStats, errorCount, runManualSync } = useNetworkSync();
  const [panneaux, setPanneaux] = useState([]);
  const [projetsById, setProjetsById] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  const loadPanneaux = useCallback(async () => {
    const [stored, projets] = await Promise.all([getAllOfflineData(), getProjets().catch(() => [])]);
    const map = {};
    (projets || []).forEach((p) => {
      map[p.id] = p.nom;
    });
    if (Object.keys(map).length === 0) {
      const cached = await getAgentMissionsCache();
      (cached.missions || []).forEach((p) => {
        if (p?.id) map[p.id] = p.nom;
      });
    }
    setProjetsById(map);
    const allowedProjetIds = new Set((projets || []).map((p) => p.id));
    const strictFilter = allowedProjetIds.size > 0;

    let tracked = stored.panneaux
      .filter((item) => {
        if (!strictFilter) return true;
        return !item.projetId || allowedProjetIds.has(item.projetId);
      })
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

    const firstBatch = tracked.slice(0, INITIAL_ENRICH_LIMIT);
    const remainingBatch = tracked.slice(INITIAL_ENRICH_LIMIT);
    const enrichedFirst = await Promise.all(firstBatch.map(enrichWithPhotos));
    setPanneaux([...enrichedFirst, ...remainingBatch]);
    if (remainingBatch.length > 0) {
      setTimeout(async () => {
        try {
          const enrichedRemaining = await Promise.all(remainingBatch.map(enrichWithPhotos));
          setPanneaux([...enrichedFirst, ...enrichedRemaining]);
        } catch {
          // Keep first visible batch responsive even if rest fails.
        }
      }, 0);
    }
    await refreshQueueStats();
  }, [refreshQueueStats]);

  const runFocusRefresh = useFocusRefresh(navigation, loadPanneaux, {
    minIntervalMs: 20000,
    runOnMount: true,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await runFocusRefresh(true);
    setRefreshing(false);
  };

  return (
    <View style={styles.root}>
      <AppHeader />
      <AgentOfflineBanner />
      <View style={styles.container}>
        <View style={styles.headRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Mes panneaux</Text>
            <Text style={styles.subtitle}>Locaux ou synchronisés · statut sur chaque fiche.</Text>
          </View>
          <TouchableOpacity style={styles.uploadBtn} onPress={() => navigation.navigate("UploadPanneau")} activeOpacity={0.85}>
            <Text style={styles.uploadBtnText}>Upload</Text>
          </TouchableOpacity>
        </View>
        {errorCount > 0 ? (
          <TouchableOpacity
            style={styles.retryRow}
            onPress={() => runManualSync().then(() => runFocusRefresh(true))}
            activeOpacity={0.85}
          >
            <Text style={styles.retryRowText}>Réessayer l’envoi</Text>
          </TouchableOpacity>
        ) : null}
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
  retryRow: {
    marginBottom: theme.spacing.sm,
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primaryMuted,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  retryRowText: { color: theme.colors.primary, fontWeight: "800", fontSize: 14 },
  list: { paddingBottom: theme.spacing.xxl },
  empty: { color: theme.colors.textMuted, marginTop: theme.spacing.xl, textAlign: "center", fontSize: 15 },
});
