import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { theme } from "../theme";

const STATUS_UI = {
  pending: { icon: "🟠", label: "En attente" },
  synced: { icon: "🟢", label: "Synchronise" },
  error: { icon: "🔴", label: "Erreur" },
};

export default function PanelCard({ panneau }) {
  const status = STATUS_UI[panneau.statut] || STATUS_UI.pending;
  const hasPhotos = panneau.photos && (panneau.photos.faceA?.url || panneau.photos.faceB?.url);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{panneau.entreprise}</Text>
      <Text style={styles.meta}>{panneau.localisation?.adresse || "Adresse non renseignee"}</Text>
      <Text style={styles.meta}>Campagne: {panneau.projetId || "Non liee"}</Text>
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
      <Text style={styles.status}>
        {status.icon} Statut: {status.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  title: { fontSize: 16, fontWeight: "700", marginBottom: 4, color: theme.colors.text },
  meta: { fontSize: 13, color: theme.colors.textSecondary, marginBottom: 2 },
  status: { marginTop: theme.spacing.sm, fontWeight: "500", color: theme.colors.textSecondary, fontSize: 13 },
  photosRow: { flexDirection: "row", marginTop: theme.spacing.md },
  photoBlock: { flex: 1, marginHorizontal: 4 },
  photoLabel: { fontSize: 12, fontWeight: "600", color: theme.colors.textSecondary, marginBottom: 4 },
  photo: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: theme.radius.sm,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
});
