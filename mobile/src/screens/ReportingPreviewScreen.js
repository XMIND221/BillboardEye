import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Share,
  Linking,
  ScrollView,
  Alert,
  TouchableOpacity,
} from "react-native";
import { theme } from "../theme";
import Button from "../components/Button";
import { generateProjetPDFFinal } from "../services/api";

const parseZones = (zoneStr) =>
  String(zoneStr || "")
    .split(/[;,/|]/)
    .map((z) => z.trim())
    .filter(Boolean);

export default function ReportingPreviewScreen({ route, navigation }) {
  const campaign = route.params?.campaign;
  const reportData = route.params?.reportData;
  const pdfUrl = route.params?.pdfUrl || "";
  const editorPayload = route.params?.editorPayload || null;
  const [finalizing, setFinalizing] = React.useState(false);
  const zones = parseZones(reportData?.projet?.zone);
  const total = reportData?.summary?.total ?? 0;
  const completed = reportData?.summary?.completed ?? 0;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  const openPdf = async () => {
    if (!pdfUrl) {
      Alert.alert("PDF non disponible", "Le rapport n'a pas pu être généré.");
      return;
    }
    try {
      await Linking.openURL(pdfUrl);
    } catch (err) {
      Alert.alert("Erreur", "Impossible d'ouvrir le PDF.");
    }
  };

  const sharePdf = async () => {
    if (!pdfUrl) {
      Alert.alert("PDF non disponible", "Le rapport n'a pas pu être généré.");
      return;
    }
    try {
      await Share.share({
        title: `Rapport - ${campaign?.nom || "Campagne"}`,
        message: `Rapport BillboardEye : ${campaign?.nom || "Campagne"}\n${pdfUrl}`,
        url: pdfUrl,
      });
    } catch (err) {
      if (err.message !== "User did not share") {
        Alert.alert("Erreur", "Impossible de partager le PDF.");
      }
    }
  };

  const generateFinal = async () => {
    if (!campaign?.id || !editorPayload) return;
    try {
      setFinalizing(true);
      const result = await generateProjetPDFFinal(campaign.id, editorPayload);
      navigation.setParams({ pdfUrl: result?.url || "" });
      Alert.alert("PDF final prêt", "La version finale a été générée.");
    } catch (err) {
      Alert.alert("Erreur", err.message || "Impossible de générer la version finale.");
    } finally {
      setFinalizing(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={[styles.statusBadge, pdfUrl ? styles.statusSuccess : styles.statusError]}>
          <Text style={[styles.statusIcon, pdfUrl ? styles.statusIconSuccess : styles.statusIconError]}>
            {pdfUrl ? "✓" : "!"}
          </Text>
          <Text style={[styles.statusText, pdfUrl ? styles.statusTextSuccess : styles.statusTextError]}>
            {pdfUrl ? "Rapport généré" : "Génération échouée"}
          </Text>
        </View>
        <Text style={styles.title}>{campaign?.nom || "Rapport"}</Text>
        <Text style={styles.subtitle}>{campaign?.entreprise || "-"}</Text>
      </View>

      {pdfUrl ? (
        <View style={styles.summaryCard}>
          <Text style={styles.cardTitle}>Contenu du rapport</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Pages</Text>
            <Text style={styles.summaryValue}>1. Couverture • 2. Résumé • 3+. Détails par zone</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Panneaux</Text>
            <Text style={styles.summaryValue}>
              {completed} / {total} complétés ({progress}%)
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Zones</Text>
            <Text style={styles.summaryValue}>{zones.length}</Text>
          </View>
        </View>
      ) : (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>
            Le PDF n'a pas pu être généré. Vérifiez votre connexion et réessayez.
          </Text>
        </View>
      )}

      {(reportData?.panneaux || []).length > 0 && (
        <View style={styles.detailsCard}>
          <Text style={styles.cardTitle}>Détails par zone</Text>
          {(reportData.panneaux || []).map((p, i) => (
            <View key={p.id} style={styles.zoneRow}>
              <Text style={styles.zoneIndex}>{i + 1}.</Text>
              <View style={styles.zoneContent}>
                <Text style={styles.zoneName}>{p.localisation?.adresse || `Zone ${i + 1}`}</Text>
                <View style={styles.zoneMeta}>
                  <Text style={styles.zoneMetaItem}>
                    Face A {p.photos?.faceA ? "✓" : "—"}
                  </Text>
                  <Text style={styles.zoneMetaItem}>
                    Face B {p.photos?.faceB ? "✓" : "—"}
                  </Text>
                  <Text style={styles.zoneMetaItem}>
                    GPS {p.localisation?.latitude ? "✓" : "—"}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity
        style={styles.templateLink}
        onPress={() => navigation.navigate("ReportingTemplatePreview")}
        activeOpacity={0.85}
      >
        <Text style={styles.templateLinkText}>Voir le template du rapport</Text>
      </TouchableOpacity>

      <View style={styles.actions}>
        {editorPayload ? (
          <Button
            title={finalizing ? "Génération finale..." : "Valider et générer final"}
            variant="primary"
            onPress={generateFinal}
            disabled={finalizing}
            style={styles.primaryButton}
          />
        ) : null}
        <Button
          title="Ouvrir / Télécharger PDF"
          variant="primary"
          onPress={openPdf}
          disabled={!pdfUrl}
          style={[styles.primaryButton, !pdfUrl && styles.buttonDisabled]}
        />
        <Button
          title="Partager"
          variant="secondary"
          onPress={sharePdf}
          disabled={!pdfUrl}
          style={[styles.secondaryButton, !pdfUrl && styles.buttonDisabled]}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.md, paddingBottom: theme.spacing.xxl },
  header: { marginBottom: theme.spacing.lg },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.full,
    marginBottom: theme.spacing.sm,
  },
  statusSuccess: { backgroundColor: theme.colors.success + "30" },
  statusError: { backgroundColor: theme.colors.error + "30" },
  statusIcon: { fontWeight: "800", fontSize: 14, marginRight: 6 },
  statusIconSuccess: { color: theme.colors.success },
  statusIconError: { color: theme.colors.error },
  statusText: { fontWeight: "700", fontSize: 13 },
  statusTextSuccess: { color: theme.colors.success },
  statusTextError: { color: theme.colors.error },
  title: { fontSize: 24, fontWeight: "800", color: theme.colors.text },
  subtitle: { fontSize: 15, color: theme.colors.textSecondary, marginTop: 4 },
  summaryCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: theme.colors.text, marginBottom: theme.spacing.md },
  summaryRow: { marginBottom: 8 },
  summaryLabel: { color: theme.colors.textSecondary, fontSize: 12, marginBottom: 2 },
  summaryValue: { color: theme.colors.text, fontSize: 14 },
  errorCard: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  errorText: { color: theme.colors.error, fontSize: 14 },
  detailsCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  zoneRow: { flexDirection: "row", marginBottom: theme.spacing.md },
  zoneIndex: { color: theme.colors.textMuted, fontSize: 14, marginRight: 8, width: 24 },
  zoneContent: { flex: 1 },
  zoneName: { color: theme.colors.text, fontSize: 14, fontWeight: "600" },
  zoneMeta: { flexDirection: "row", marginTop: 4, gap: 12 },
  zoneMetaItem: { color: theme.colors.textSecondary, fontSize: 12 },
  templateLink: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: theme.spacing.md,
  },
  templateLinkText: { color: theme.colors.accent, fontWeight: "600", fontSize: 14 },
  actions: { gap: theme.spacing.md },
  primaryButton: {},
  secondaryButton: {},
  buttonDisabled: { opacity: 0.5 },
});
