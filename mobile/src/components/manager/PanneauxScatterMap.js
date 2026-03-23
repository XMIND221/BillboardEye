import React, { useState } from "react";
import { View, Text, StyleSheet, LayoutChangeEvent } from "react-native";
import { theme } from "../../theme";

/**
 * Carte simplifiée (repères proportionnels aux GPS, numérotés) — sans module natif.
 * @param {{ points: Array<{ id: string, lat: number, lng: number, label?: string }> }} props
 */
export default function PanneauxScatterMap({ points }) {
  const [size, setSize] = useState({ w: 320, h: 220 });

  const onLayout = (e) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) setSize({ w: width, h: height });
  };

  const valid = points.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
  if (!valid.length) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Aucune coordonnée GPS pour afficher la carte.</Text>
      </View>
    );
  }

  const lats = valid.map((p) => p.lat);
  const lngs = valid.map((p) => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const pad = 28;
  const w = size.w;
  const h = size.h;
  const innerW = Math.max(1, w - pad * 2);
  const innerH = Math.max(1, h - pad * 2);
  const dLat = maxLat - minLat || 1e-6;
  const dLng = maxLng - minLng || 1e-6;

  const px = (lng) => pad + ((lng - minLng) / dLng) * innerW;
  const py = (lat) => pad + ((maxLat - lat) / dLat) * innerH;

  return (
    <View style={styles.mapBox} onLayout={onLayout}>
      <Text style={styles.mapHint}>Vue relative — numéros = liste ci-dessous</Text>
      <View style={[styles.plot, { height: h }]}>
        {valid.map((p, i) => (
          <View
            key={p.id}
            style={[
              styles.pin,
              {
                left: px(p.lng) - 15,
                top: py(p.lat) - 15,
              },
            ]}
          >
            <Text style={styles.pinText}>{i + 1}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mapBox: { marginBottom: theme.spacing.md },
  mapHint: { fontSize: 11, color: theme.colors.textMuted, marginBottom: 8 },
  plot: {
    width: "100%",
    borderRadius: theme.radius.lg,
    backgroundColor: "#E8ECF1",
    borderWidth: 1,
    borderColor: theme.colors.border,
    position: "relative",
    overflow: "hidden",
  },
  pin: {
    position: "absolute",
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...theme.shadows.sm,
  },
  pinText: { color: "#fff", fontWeight: "900", fontSize: 12 },
  empty: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.pastels.pink,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  emptyText: { color: theme.colors.textSecondary, textAlign: "center", fontSize: 14 },
});
