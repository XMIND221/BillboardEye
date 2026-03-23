import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../theme";
import AppHeader from "../components/AppHeader";
import ManagerChipRow from "../components/manager/ManagerChipRow";
import PanneauxScatterMap from "../components/manager/PanneauxScatterMap";
import { getPanneaux, getProjets, getRapport } from "../services/api";
import { collectPanneauZones } from "../utils/managerVisualStatus";

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

export default function ManagerPanneauxMapScreen({ navigation }) {
  const [panneaux, setPanneaux] = useState([]);
  const [projetsById, setProjetsById] = useState({});
  const [loading, setLoading] = useState(true);
  const [zoneKey, setZoneKey] = useState("all");
  const [projetKey, setProjetKey] = useState("all");

  const load = useCallback(async () => {
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
      nomZone: item.nomZone,
      projetId: item.projetId,
      localisation: item.localisation,
      nombreFaces: item.nombreFaces,
      statut: item.statut,
      createdAt: item.createdAt,
      photos: item.photos || null,
    }));
    list = await Promise.all(list.map(enrichWithPhotos));
    setPanneaux(list);
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        await load();
      } finally {
        setLoading(false);
      }
    })();
  }, [load]);

  const zoneOptions = useMemo(() => {
    const zones = collectPanneauZones(panneaux);
    return [{ key: "all", label: "Toutes zones" }, ...zones.map((z) => ({ key: z, label: z }))];
  }, [panneaux]);

  const projetOptions = useMemo(() => {
    const ids = [...new Set(panneaux.map((p) => p.projetId).filter(Boolean))];
    return [
      { key: "all", label: "Toutes campagnes" },
      ...ids.map((id) => ({ key: id, label: projetsById[id] || id })),
    ];
  }, [panneaux, projetsById]);

  const filtered = useMemo(() => {
    return panneaux.filter((p) => {
      if (projetKey !== "all" && p.projetId !== projetKey) return false;
      if (zoneKey !== "all") {
        const z = p.nomZone && String(p.nomZone).trim();
        if (z !== zoneKey) return false;
      }
      return true;
    });
  }, [panneaux, projetKey, zoneKey]);

  const mapPoints = useMemo(() => {
    return filtered
      .map((p) => {
        const lat = Number(p.localisation?.latitude);
        const lng = Number(p.localisation?.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
        return { id: p.id, lat, lng, label: p.nomZone || p.entreprise };
      })
      .filter(Boolean);
  }, [filtered]);

  const openMaps = (lat, lng) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    Linking.openURL(url).catch(() => {});
  };

  return (
    <View style={styles.root}>
      <AppHeader title="Carte des panneaux" onBack={() => navigation.goBack()} />
      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 48 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <ManagerChipRow label="Campagne" items={projetOptions} selectedKey={projetKey} onSelect={setProjetKey} />
          <ManagerChipRow label="Zone" items={zoneOptions} selectedKey={zoneKey} onSelect={setZoneKey} />

          <PanneauxScatterMap points={mapPoints} />

          <Text style={styles.listTitle}>Liste ({filtered.length})</Text>
          {filtered.map((p, i) => {
            const lat = p.localisation?.latitude;
            const lng = p.localisation?.longitude;
            const ok = lat != null && lng != null && Number.isFinite(Number(lat)) && Number.isFinite(Number(lng));
            return (
              <View key={p.id} style={styles.row}>
                <View style={styles.numBadge}>
                  <Text style={styles.numText}>{i + 1}</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {p.nomZone || p.entreprise}
                  </Text>
                  <Text style={styles.rowSub} numberOfLines={1}>
                    {projetsById[p.projetId] || "—"}
                  </Text>
                </View>
                {ok ? (
                  <TouchableOpacity style={styles.mapsBtn} onPress={() => openMaps(Number(lat), Number(lng))} activeOpacity={0.85}>
                    <Ionicons name="map-outline" size={18} color={theme.colors.primary} />
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.noGps}>Sans GPS</Text>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.canvas },
  content: { padding: theme.spacing.md, paddingBottom: theme.spacing.xxl },
  listTitle: { fontSize: 15, fontWeight: "800", color: theme.colors.text, marginTop: theme.spacing.sm, marginBottom: theme.spacing.sm },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
    gap: 10,
  },
  numBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  numText: { fontWeight: "900", color: theme.colors.primary, fontSize: 12 },
  rowTitle: { fontSize: 15, fontWeight: "700", color: theme.colors.text },
  rowSub: { fontSize: 12, color: theme.colors.textMuted, marginTop: 2 },
  mapsBtn: { padding: 8 },
  noGps: { fontSize: 11, color: theme.colors.textMuted, fontWeight: "600" },
});
