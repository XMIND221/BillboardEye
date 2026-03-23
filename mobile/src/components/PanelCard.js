import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../theme";
import VisualStatusBadge from "./manager/VisualStatusBadge";
import { getPanneauVisualTone } from "../utils/managerVisualStatus";

export default function PanelCard({ panneau, projetNom, onMenuPress }) {
  const visualTone = getPanneauVisualTone(panneau);
  const uriFaceA = panneau.photos?.faceA?.url || panneau.photos?.faceA?.localUri;
  const uriFaceB = panneau.photos?.faceB?.url || panneau.photos?.faceB?.localUri;
  const hasPhotos = Boolean(uriFaceA || uriFaceB);
  const displayName = (panneau.nomZone && String(panneau.nomZone).trim()) || panneau.entreprise || "Sans nom";
  const lat = panneau.localisation?.latitude;
  const lng = panneau.localisation?.longitude;
  const coordStr =
    lat != null && lng != null && Number.isFinite(Number(lat)) && Number.isFinite(Number(lng))
      ? `${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}`
      : "GPS non renseigné";

  return (
    <View style={styles.card}>
      <View style={styles.headRow}>
        <View style={styles.headText}>
          <Text style={styles.nameKicker}>Nom</Text>
          <Text style={styles.title} numberOfLines={2}>
            {displayName}
          </Text>
          {!!panneau.nomZone && panneau.entreprise && displayName !== panneau.entreprise ? (
            <Text style={styles.zoneLabel} numberOfLines={1}>
              Enseigne · {panneau.entreprise}
            </Text>
          ) : null}
        </View>
        <View style={styles.headRight}>
          <VisualStatusBadge tone={visualTone} />
          {onMenuPress ? (
            <TouchableOpacity
              style={styles.kebab}
              onPress={onMenuPress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="Actions panneau"
            >
              <Ionicons name="ellipsis-vertical" size={22} color={theme.colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <Text style={styles.metaLine} numberOfLines={2}>
        {panneau.localisation?.adresse || "—"}
      </Text>
      <Text style={styles.campaignLine} numberOfLines={1}>
        Campagne · {projetNom || panneau.projetId || "Non liée"}
      </Text>
      <Text style={styles.coords} numberOfLines={1}>
        {coordStr}
      </Text>

      {hasPhotos && (
        <View style={styles.photosRow}>
          {uriFaceA ? (
            <View style={styles.photoBlock}>
              <Text style={styles.photoLabel}>Face A</Text>
              <Image source={{ uri: uriFaceA }} style={styles.photo} contentFit="cover" transition={200} />
            </View>
          ) : null}
          {uriFaceB ? (
            <View style={styles.photoBlock}>
              <Text style={styles.photoLabel}>Face B</Text>
              <Image source={{ uri: uriFaceB }} style={styles.photo} contentFit="cover" transition={200} />
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  headRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  headText: { flex: 1, minWidth: 0 },
  headRight: { alignItems: "flex-end", gap: 8 },
  kebab: { padding: 4, marginTop: 4 },
  nameKicker: {
    fontSize: 10,
    fontWeight: "800",
    color: theme.colors.textMuted,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  title: { fontSize: 17, fontWeight: "800", color: theme.colors.text, letterSpacing: -0.2 },
  zoneLabel: { fontSize: 13, fontWeight: "600", color: theme.colors.primary, marginTop: 4 },
  metaLine: { fontSize: 14, color: theme.colors.textSecondary, marginBottom: 6, lineHeight: 20 },
  campaignLine: { fontSize: 13, color: theme.colors.text, fontWeight: "600", marginBottom: 4 },
  coords: { fontSize: 12, color: theme.colors.textMuted },
  photosRow: { flexDirection: "row", marginTop: theme.spacing.md, gap: theme.spacing.sm },
  photoBlock: { flex: 1 },
  photoLabel: { fontSize: 12, fontWeight: "600", color: theme.colors.textSecondary, marginBottom: 4 },
  photo: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.borderLight,
  },
});
