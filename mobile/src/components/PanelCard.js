import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { theme } from "../theme";

const STATUS_UI = {
  pending: { icon: "🟠", label: "En attente", color: theme.colors.warning },
  synced: { icon: "🟢", label: "Synchronisé", color: theme.colors.success },
  error: { icon: "🔴", label: "Erreur", color: theme.colors.error },
};

export default function PanelCard({ panneau, projetNom }) {
  const status = STATUS_UI[panneau.statut] || STATUS_UI.pending;
  const hasPhotos = panneau.photos && (panneau.photos.faceA?.url || panneau.photos.faceB?.url);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{panneau.entreprise}</Text>
      <Text style={styles.meta}>{panneau.localisation?.adresse || "Adresse non renseignée"}</Text>
      <Text style={styles.meta}>Campagne : {projetNom || panneau.projetId || "Non liée"}</Text>
      <Text style={styles.meta}>
        {panneau.localisation?.latitude}, {panneau.localisation?.longitude}
      </Text>
      {hasPhotos && (
        <View style={styles.photosRow}>
          {panneau.photos?.faceA?.url && (
            <View style={styles.photoBlock}>
              <Text style={styles.photoLabel}>Face A</Text>
              <Image
                source={{ uri: panneau.photos.faceA.url }}
                style={styles.photo}
                contentFit="cover"
                transition={200}
              />
            </View>
          )}
          {panneau.photos?.faceB?.url && (
            <View style={styles.photoBlock}>
              <Text style={styles.photoLabel}>Face B</Text>
              <Image
                source={{ uri: panneau.photos.faceB.url }}
                style={styles.photo}
                contentFit="cover"
                transition={200}
              />
            </View>
          )}
        </View>
      )}
      <Text style={[styles.status, { color: status.color }]}>
        {status.icon} Statut: {status.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  title: { fontSize: 17, fontWeight: "700", marginBottom: 4, color: theme.colors.text },
  meta: { fontSize: 14, color: theme.colors.textSecondary, marginBottom: 2 },
  status: { marginTop: theme.spacing.sm, fontWeight: "600", fontSize: 13 },
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
