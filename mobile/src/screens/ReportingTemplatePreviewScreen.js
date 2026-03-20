import React from "react";
import { View, Text, StyleSheet, ScrollView, Image, Dimensions } from "react-native";
import { theme } from "../theme";

const { width } = Dimensions.get("window");
const IMAGE_WIDTH = width - theme.spacing.md * 2;

const TEMPLATES = [
  { key: "page1", source: require("../../assets/rapport-templates/page1-couverture.png"), label: "Page 1 — Couverture" },
  { key: "page2", source: require("../../assets/rapport-templates/page2-stats.png"), label: "Page 2 — Résultats terrain" },
  { key: "page3", source: require("../../assets/rapport-templates/page3-panneau.png"), label: "Page 3 — Détail panneau (Face A/B)" },
  { key: "page4", source: require("../../assets/rapport-templates/page4-closing.png"), label: "Page 4 — Clôture" },
];

export default function ReportingTemplatePreviewScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Aperçu du template</Text>
      <Text style={styles.subtitle}>
        Voici le rendu visuel des pages de votre rapport PDF professionnel.
      </Text>

      {TEMPLATES.map((t) => (
        <View key={t.key} style={styles.card}>
          <Text style={styles.cardLabel}>{t.label}</Text>
          <Image
            source={t.source}
            style={styles.image}
            resizeMode="contain"
          />
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.md, paddingBottom: theme.spacing.xxl },
  title: { fontSize: 24, fontWeight: "800", color: theme.colors.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: theme.colors.textSecondary, marginBottom: theme.spacing.lg },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  image: {
    width: IMAGE_WIDTH,
    height: IMAGE_WIDTH * 1.4,
    alignSelf: "center",
  },
});
