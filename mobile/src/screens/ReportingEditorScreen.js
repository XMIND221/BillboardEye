import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Image,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { theme } from "../theme";
import { addPhoto, previewProjetPDF, updateProjet, uploadLogo } from "../services/api";
import { PDF_TEMPLATE_OPTIONS } from "../constants/pdfTemplates";
import { MANAGER_REPORT_SCREENS } from "../navigation/reportScreens";
import { useToast } from "../contexts/ToastContext";

const buildPanelOverrides = (reportData) =>
  (reportData?.panneaux || []).map((p) => ({
    id: p.id,
    enabled: true,
    observationsFaceA: p.observationsFaceA || "",
    observationsFaceB: p.observationsFaceB || "",
    label: p.localisation?.adresse || "Zone",
    zoneName: p.localisation?.adresse || "",
    latitude: p.localisation?.latitude != null ? String(p.localisation.latitude) : "",
    longitude: p.localisation?.longitude != null ? String(p.localisation.longitude) : "",
  }));

function buildOverridesPayload({
  titreRapport,
  entreprise,
  duree,
  date,
  zone,
  assignedAgent,
  instructions,
  legendeVisuelle,
  legendeCarte,
  reportPdfVariant,
  reportLayout,
  panelOverrides,
}) {
  return {
    overrides: {
      titreRapport,
      entreprise,
      duree,
      date,
      zone,
      assignedAgent,
      instructions,
      legendeVisuelle,
      legendeCarte,
      reportPdfVariant,
      reportLayout,
      panneaux: panelOverrides.map((p, index) => ({
        id: p.id,
        enabled: p.enabled,
        order: index,
        zoneName: p.zoneName,
        latitude: p.latitude,
        longitude: p.longitude,
        observationsFaceA: p.observationsFaceA,
        observationsFaceB: p.observationsFaceB,
      })),
    },
  };
}

const buildSectionStateFromLayout = (layout) => {
  const incoming = Array.isArray(layout?.sections) ? layout.sections : [];
  const map = new Map(incoming.map((s) => [String(s?.key || "").trim().toLowerCase(), s]));
  return DEFAULT_SECTIONS.map((d) => {
    const row = map.get(d.key);
    if (!row) return d;
    return {
      ...d,
      visible: row.visible !== false,
      deleted: row.deleted === true,
    };
  });
};

const SECTION_KEYS = Object.freeze({
  cover: "cover",
  summary: "summary",
  panels: "panels",
  visual: "visual",
  closing: "closing",
});

const DEFAULT_SECTIONS = [
  { key: SECTION_KEYS.cover, title: "Couverture", visible: true, deleted: false, editing: true },
  { key: SECTION_KEYS.summary, title: "Résumé", visible: true, deleted: false, editing: false },
  { key: SECTION_KEYS.panels, title: "Panneaux", visible: true, deleted: false, editing: false },
  { key: SECTION_KEYS.visual, title: "Grande photo", visible: true, deleted: false, editing: false },
  { key: SECTION_KEYS.closing, title: "Conclusion", visible: true, deleted: false, editing: false },
];

function InlineEditableText({ value, onCommit, placeholder, multiline = false, style, textStyle }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || "");

  useEffect(() => {
    if (!editing) setDraft(value || "");
  }, [value, editing]);

  const commit = () => {
    setEditing(false);
    onCommit?.(draft);
  };

  if (editing) {
    return (
      <TextInput
        style={[styles.inlineInput, multiline && styles.inlineInputMultiline, style]}
        value={draft}
        onChangeText={setDraft}
        onBlur={commit}
        onSubmitEditing={multiline ? undefined : commit}
        multiline={multiline}
        autoFocus
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textMuted}
      />
    );
  }

  return (
    <TouchableOpacity style={styles.inlineTextTap} onPress={() => setEditing(true)} activeOpacity={0.85}>
      <Text style={[styles.inlineText, textStyle, !value && styles.inlinePlaceholder]}>
        {value || placeholder || "Cliquer pour modifier"}
      </Text>
      <Ionicons name="create-outline" size={15} color={theme.colors.textMuted} />
    </TouchableOpacity>
  );
}

const appendPhotoField = async (formData, uri, filename) => {
  if (Platform.OS === "web") {
    const response = await fetch(uri);
    const blob = await response.blob();
    formData.append("image", blob, filename);
    return;
  }
  formData.append("image", { uri, name: filename, type: "image/jpeg" });
};

export default function ReportingEditorScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const reportScreens = route.params?.reportScreens || MANAGER_REPORT_SCREENS;
  const campaign = route.params?.campaign || null;
  const reportData = route.params?.reportData || null;

  const [titreRapport, setTitreRapport] = useState(
    reportData?.projet?.titreRapport || reportData?.projet?.nom || "",
  );
  const [entreprise, setEntreprise] = useState(reportData?.projet?.entreprise || "");
  const [duree, setDuree] = useState(reportData?.projet?.duree || "");
  const [date, setDate] = useState(reportData?.projet?.date ? String(reportData.projet.date).slice(0, 10) : "");
  const [zone, setZone] = useState(reportData?.projet?.zone || "");
  const [assignedAgent, setAssignedAgent] = useState(reportData?.projet?.assignedAgent || "");
  const [instructions, setInstructions] = useState(reportData?.projet?.instructions || "");
  const [legendeVisuelle, setLegendeVisuelle] = useState(reportData?.projet?.legendeVisuelle || "");
  const [legendeCarte, setLegendeCarte] = useState(reportData?.projet?.legendeCarte || "");
  const [reportPdfVariant, setReportPdfVariant] = useState(
    reportData?.projet?.reportPdfVariant || "default",
  );
  const [clientLogoUrl, setClientLogoUrl] = useState(reportData?.projet?.clientLogoUrl || "");
  const [entrepriseLogoUrl, setEntrepriseLogoUrl] = useState(reportData?.projet?.entrepriseLogoUrl || "");
  const [sections, setSections] = useState(DEFAULT_SECTIONS);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [autosaveState, setAutosaveState] = useState("idle");
  const [panelOverrides, setPanelOverrides] = useState(() => buildPanelOverrides(reportData));
  const [lastPreviewUrl, setLastPreviewUrl] = useState("");
  const [panelLocalPhotos, setPanelLocalPhotos] = useState({});
  const autosaveTimerRef = useRef(null);

  useEffect(() => {
    if (!campaign?.id || !reportData) return;
    setTitreRapport(reportData?.projet?.titreRapport || reportData?.projet?.nom || "");
    setEntreprise(reportData?.projet?.entreprise || "");
    setDuree(reportData?.projet?.duree || "");
    setDate(reportData?.projet?.date ? String(reportData.projet.date).slice(0, 10) : "");
    setZone(reportData?.projet?.zone || "");
    setAssignedAgent(reportData?.projet?.assignedAgent || "");
    setInstructions(reportData?.projet?.instructions || "");
    setLegendeVisuelle(reportData?.projet?.legendeVisuelle || "");
    setLegendeCarte(reportData?.projet?.legendeCarte || "");
    setReportPdfVariant(reportData?.projet?.reportPdfVariant || "default");
    setClientLogoUrl(reportData?.projet?.clientLogoUrl || "");
    setEntrepriseLogoUrl(reportData?.projet?.entrepriseLogoUrl || "");
    setSections(buildSectionStateFromLayout(reportData?.projet?.reportLayout));
    setPanelOverrides(buildPanelOverrides(reportData));
    setPanelLocalPhotos({});
    setError("");
    setLastPreviewUrl("");
    setAutosaveState("idle");
  }, [campaign?.id]);

  const visibleSectionKeys = useMemo(
    () => sections.filter((s) => !s.deleted && s.visible).map((s) => s.key),
    [sections],
  );
  const isSectionVisible = useCallback((key) => visibleSectionKeys.includes(key), [visibleSectionKeys]);
  const reportLayout = useMemo(
    () => ({
      sections: sections.map((s) => ({ key: s.key, visible: s.visible, deleted: s.deleted })),
    }),
    [sections],
  );

  const enabledCount = useMemo(() => {
    if (!isSectionVisible(SECTION_KEYS.panels)) return 0;
    return panelOverrides.filter((p) => p.enabled).length;
  }, [panelOverrides, isSectionVisible]);

  const updatePanel = (id, patch) => {
    setPanelOverrides((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  const movePanel = (id, direction) => {
    setPanelOverrides((prev) => {
      const idx = prev.findIndex((p) => p.id === id);
      if (idx < 0) return prev;
      const target = direction === "up" ? idx - 1 : idx + 1;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      const tmp = next[idx];
      next[idx] = next[target];
      next[target] = tmp;
      return next;
    });
  };

  const mutateSection = (key, patch) => {
    setSections((prev) => prev.map((s) => (s.key === key ? { ...s, ...patch } : s)));
  };

  const persistProjet = useCallback(
    async (overrides = {}) => {
      if (!campaign?.id) return;
      await updateProjet(campaign.id, {
        titreRapport,
        entreprise,
        duree,
        date,
        zone,
        assignedAgent,
        instructions,
        legendeVisuelle,
        legendeCarte,
        reportPdfVariant,
        clientLogoUrl,
        entrepriseLogoUrl,
        reportLayout,
        ...overrides,
      });
    },
    [
      campaign?.id,
      titreRapport,
      entreprise,
      duree,
      date,
      zone,
      assignedAgent,
      instructions,
      legendeVisuelle,
      legendeCarte,
      reportPdfVariant,
      clientLogoUrl,
      entrepriseLogoUrl,
    ],
  );

  useEffect(() => {
    if (!campaign?.id) return;
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    setAutosaveState("saving");
    autosaveTimerRef.current = setTimeout(async () => {
      try {
        await persistProjet();
        setAutosaveState("saved");
      } catch {
        setAutosaveState("error");
      }
    }, 800);
    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  }, [campaign?.id, persistProjet]);

  const pickAndUploadLogo = async (setter, fieldName) => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== "granted") {
        showToast("Permission galerie refusée", "error");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.8,
      });
      if (result.canceled || !result.assets?.length) return;
      const uri = result.assets[0].uri;
      setter(uri);
      const url = await uploadLogo(uri);
      if (!url) throw new Error("Upload logo impossible.");
      setter(url);
      await persistProjet({ [fieldName]: url });
      showToast("Logo mis à jour");
    } catch (e) {
      showToast(e?.message || "Impossible de mettre à jour le logo", "error");
    }
  };

  const panelPhotoMap = useMemo(() => {
    const map = new Map();
    (reportData?.panneaux || []).forEach((p) => {
      map.set(String(p.id), {
        faceA: p?.photos?.faceA?.url || "",
        faceB: p?.photos?.faceB?.url || "",
      });
    });
    return map;
  }, [reportData?.panneaux]);

  const replacePanelPhoto = async (panelId, faceType) => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== "granted") {
        showToast("Permission galerie refusée", "error");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.8,
      });
      if (result.canceled || !result.assets?.length) return;
      const uri = result.assets[0].uri;
      setPanelLocalPhotos((prev) => ({
        ...prev,
        [panelId]: { ...(prev[panelId] || {}), [faceType]: uri },
      }));
      const formData = new FormData();
      formData.append("panneauId", String(panelId));
      formData.append("type", faceType);
      await appendPhotoField(formData, uri, `${faceType}-${Date.now()}.jpg`);
      await addPhoto(formData);
      showToast(`Image ${faceType === "faceA" ? "Face A" : "Face B"} mise à jour`);
    } catch (e) {
      showToast(e?.message || "Mise à jour image impossible", "error");
    }
  };

  const previewPayload = useCallback(() => {
    return buildOverridesPayload({
      titreRapport,
      entreprise,
      duree,
      date,
      zone,
      assignedAgent,
      instructions,
      legendeVisuelle,
      legendeCarte,
      reportPdfVariant,
      reportLayout,
      panelOverrides: panelOverrides.map((p) => ({
        ...p,
        enabled: isSectionVisible(SECTION_KEYS.panels) ? p.enabled : false,
      })),
    });
  }, [
    titreRapport,
    entreprise,
    duree,
    date,
    zone,
    assignedAgent,
    instructions,
    legendeVisuelle,
    legendeCarte,
    reportPdfVariant,
    reportLayout,
    panelOverrides,
    isSectionVisible,
  ]);

  const onPickTemplate = async (value) => {
    setReportPdfVariant(value);
    if (!campaign?.id) return;
    try {
      await updateProjet(campaign.id, { reportPdfVariant: value });
      showToast("Modèle PDF enregistré sur la campagne");
    } catch {
      showToast("Enregistrement du modèle impossible (réseau ou droits).", "error");
    }
  };

  const runPreview = async () => {
    if (!campaign?.id) return;
    setSaving(true);
    setError("");
    try {
      const payload = previewPayload();
      const result = await previewProjetPDF(campaign.id, payload);
      const url = result?.url || "";
      setLastPreviewUrl(url);
      if (url) {
        showToast("Aperçu PDF prêt");
      }
      navigation.navigate(reportScreens.Preview, {
        campaign: { ...campaign, entreprise },
        reportData: {
          ...reportData,
          projet: {
            ...(reportData?.projet || {}),
            titreRapport,
            entreprise,
            duree,
            date,
            zone,
            assignedAgent,
            instructions,
            legendeVisuelle,
            legendeCarte,
            reportPdfVariant,
            reportLayout,
          },
          panneaux: panelOverrides
            .filter((p) => p.enabled)
            .map((p) => {
              const original = (reportData?.panneaux || []).find((x) => x.id === p.id) || {};
              return {
                ...original,
                localisation: {
                  ...(original.localisation || {}),
                  adresse: p.zoneName,
                  latitude: p.latitude ? Number(p.latitude) : original.localisation?.latitude,
                  longitude: p.longitude ? Number(p.longitude) : original.localisation?.longitude,
                },
                observationsFaceA: p.observationsFaceA,
                observationsFaceB: p.observationsFaceB,
              };
            }),
          summary: { ...(reportData?.summary || {}), total: enabledCount },
        },
        pdfUrl: url,
        editorPayload: payload,
        reportScreens,
      });
    } catch (err) {
      setError(err.message || "Impossible de générer l’aperçu.");
      showToast("Aperçu impossible", "error");
    } finally {
      setSaving(false);
    }
  };

  const openLastPreview = async () => {
    if (!lastPreviewUrl) return;
    try {
      await Linking.openURL(lastPreviewUrl);
    } catch {
      showToast("Ouverture du lien impossible", "error");
    }
  };

  const inputProps = {
    placeholderTextColor: theme.colors.textMuted,
  };

  const autosaveLabel =
    autosaveState === "saving"
      ? "Enregistrement…"
      : autosaveState === "saved"
        ? "Enregistré automatiquement"
        : autosaveState === "error"
          ? "Échec autosave (réseau)"
          : "Autosave actif";

  return (
    <View style={styles.root}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Éditeur visuel du rapport</Text>
        <Text style={styles.campaignBadge}>
          {campaign?.nom || "Campagne"} · {campaign?.entreprise || ""}
        </Text>
        <Text style={styles.subtitle}>Cliquez dans le visuel pour modifier. Tout se sauvegarde automatiquement.</Text>
        <Text
          style={[
            styles.autosave,
            autosaveState === "error" ? styles.autosaveError : autosaveState === "saved" && styles.autosaveOk,
          ]}
        >
          {autosaveLabel}
        </Text>

        <View style={styles.templateRow}>
          {PDF_TEMPLATE_OPTIONS.map((opt) => {
            const selected = reportPdfVariant === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[styles.templateChip, selected && styles.templateChipSelected]}
                onPress={() => onPickTemplate(opt.value)}
                activeOpacity={0.85}
              >
                <Text style={[styles.templateChipTitle, selected && styles.templateChipTitleSelected]}>{opt.label}</Text>
                <Text style={styles.templateChipHint} numberOfLines={2}>
                  {opt.hint}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {!!error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.doc}>
          {sections
            .filter((s) => !s.deleted)
            .map((section) => (
              <View key={section.key} style={styles.sectionBlock}>
                <View style={styles.sectionToolbar}>
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                  <View style={styles.sectionButtons}>
                    <TouchableOpacity
                      style={styles.sectionBtn}
                      onPress={() => mutateSection(section.key, { visible: !section.visible })}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.sectionBtnText}>{section.visible ? "Masquer" : "Afficher"}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.sectionBtn, styles.sectionBtnDanger]}
                      onPress={() => mutateSection(section.key, { deleted: true })}
                      activeOpacity={0.85}
                    >
                      <Text style={[styles.sectionBtnText, styles.sectionBtnDangerText]}>Supprimer</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                {!section.visible ? (
                  <Text style={styles.sectionHidden}>Section masquée</Text>
                ) : section.key === SECTION_KEYS.cover ? (
                  <View style={styles.coverBox}>
                    <View style={styles.logoRow}>
                      <TouchableOpacity
                        style={styles.logoBox}
                        onPress={() => pickAndUploadLogo(setClientLogoUrl, "clientLogoUrl")}
                        activeOpacity={0.85}
                      >
                        {clientLogoUrl ? (
                          <Image source={{ uri: clientLogoUrl }} style={styles.logoImg} />
                        ) : (
                          <Text style={styles.logoPlaceholder}>Logo client</Text>
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.logoBox}
                        onPress={() => pickAndUploadLogo(setEntrepriseLogoUrl, "entrepriseLogoUrl")}
                        activeOpacity={0.85}
                      >
                        {entrepriseLogoUrl ? (
                          <Image source={{ uri: entrepriseLogoUrl }} style={styles.logoImg} />
                        ) : (
                          <Text style={styles.logoPlaceholder}>Logo entreprise</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                    <InlineEditableText
                      value={titreRapport}
                      onCommit={setTitreRapport}
                      placeholder="Titre du rapport"
                      textStyle={styles.coverTitle}
                    />
                    <InlineEditableText
                      value={entreprise}
                      onCommit={setEntreprise}
                      placeholder="Nom client"
                      textStyle={styles.coverSub}
                    />
                    <InlineEditableText
                      value={zone}
                      onCommit={setZone}
                      placeholder="Zone / périmètre"
                      textStyle={styles.coverSub}
                    />
                    <InlineEditableText value={date} onCommit={setDate} placeholder="AAAA-MM-JJ" textStyle={styles.coverSub} />
                  </View>
                ) : section.key === SECTION_KEYS.summary ? (
                  <View>
                    <InlineEditableText value={duree} onCommit={setDuree} placeholder="Durée campagne" textStyle={styles.kpiBig} />
                    <InlineEditableText
                      value={instructions}
                      onCommit={setInstructions}
                      placeholder="Consignes & note"
                      multiline
                    />
                    <InlineEditableText
                      value={legendeCarte}
                      onCommit={setLegendeCarte}
                      placeholder="Légende carte"
                    />
                    <InlineEditableText
                      value={assignedAgent}
                      onCommit={setAssignedAgent}
                      placeholder="Agent assigné"
                    />
                  </View>
                ) : section.key === SECTION_KEYS.panels ? (
                  <View>
                    <Text style={styles.panelsCount}>Panneaux actifs: {enabledCount}</Text>
                    {panelOverrides.slice(0, 12).map((p) => (
                      <View key={p.id} style={styles.panelLite}>
                        <View style={styles.panelLiteHead}>
                          <InlineEditableText
                            value={p.zoneName}
                            onCommit={(v) => updatePanel(p.id, { zoneName: v, label: v || "Zone" })}
                            placeholder="Nom zone"
                            style={{ flex: 1 }}
                          />
                          <TouchableOpacity
                            style={[styles.sectionBtn, !p.enabled && styles.sectionBtnDanger]}
                            onPress={() => updatePanel(p.id, { enabled: !p.enabled })}
                          >
                            <Text
                              style={[styles.sectionBtnText, !p.enabled && styles.sectionBtnDangerText]}
                            >
                              {p.enabled ? "Masquer" : "Afficher"}
                            </Text>
                          </TouchableOpacity>
                        </View>
                        <View style={styles.moveRow}>
                          <TouchableOpacity style={styles.moveButton} onPress={() => movePanel(p.id, "up")} activeOpacity={0.85}>
                            <Text style={styles.moveButtonText}>Monter</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.moveButton} onPress={() => movePanel(p.id, "down")} activeOpacity={0.85}>
                            <Text style={styles.moveButtonText}>Descendre</Text>
                          </TouchableOpacity>
                        </View>
                        <InlineEditableText
                          value={p.observationsFaceA}
                          onCommit={(v) => updatePanel(p.id, { observationsFaceA: v })}
                          placeholder="Observation Face A"
                        />
                        <InlineEditableText
                          value={p.observationsFaceB}
                          onCommit={(v) => updatePanel(p.id, { observationsFaceB: v })}
                          placeholder="Observation Face B"
                        />
                        <View style={styles.panelPhotosRow}>
                          <View style={styles.panelPhotoCard}>
                            <Image
                              source={{
                                uri:
                                  panelLocalPhotos[p.id]?.faceA ||
                                  panelPhotoMap.get(String(p.id))?.faceA ||
                                  "https://via.placeholder.com/320x200?text=Face+A",
                              }}
                              style={styles.panelPhoto}
                            />
                            <TouchableOpacity
                              style={styles.replaceImageBtn}
                              onPress={() => replacePanelPhoto(p.id, "faceA")}
                              activeOpacity={0.85}
                            >
                              <Text style={styles.replaceImageText}>Remplacer Face A</Text>
                            </TouchableOpacity>
                          </View>
                          <View style={styles.panelPhotoCard}>
                            <Image
                              source={{
                                uri:
                                  panelLocalPhotos[p.id]?.faceB ||
                                  panelPhotoMap.get(String(p.id))?.faceB ||
                                  "https://via.placeholder.com/320x200?text=Face+B",
                              }}
                              style={styles.panelPhoto}
                            />
                            <TouchableOpacity
                              style={styles.replaceImageBtn}
                              onPress={() => replacePanelPhoto(p.id, "faceB")}
                              activeOpacity={0.85}
                            >
                              <Text style={styles.replaceImageText}>Remplacer Face B</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                ) : section.key === SECTION_KEYS.visual ? (
                  <View style={styles.visualBox}>
                    <InlineEditableText
                      value={legendeVisuelle}
                      onCommit={setLegendeVisuelle}
                      placeholder="Texte de légende de la grande image"
                      multiline
                      textStyle={styles.visualCaption}
                    />
                  </View>
                ) : (
                  <View style={styles.closingBox}>
                    <Text style={styles.closingTitle}>Merci pour votre confiance</Text>
                    <Text style={styles.closingSub}>Section de conclusion du rapport</Text>
                  </View>
                )}
              </View>
            ))}
        </View>

        <View style={styles.sectionActions}>
          <Text style={styles.sectionActionsTitle}>Ajouter une section supprimée</Text>
          <View style={styles.templateRow}>
            {sections
              .filter((s) => s.deleted)
              .map((s) => (
                <TouchableOpacity key={s.key} style={styles.templateChip} onPress={() => mutateSection(s.key, { deleted: false, visible: true })}>
                  <Text style={styles.templateChipTitle}>+ {s.title}</Text>
                </TouchableOpacity>
              ))}
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        {!!lastPreviewUrl && (
          <TouchableOpacity style={styles.previewLinkRow} onPress={openLastPreview} activeOpacity={0.85}>
            <Ionicons name="document-text-outline" size={20} color={theme.colors.accent} />
            <Text style={styles.previewLinkText}>Rouvrir le dernier aperçu PDF</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={[styles.primaryButton, saving && styles.primaryButtonDisabled]} onPress={runPreview} disabled={saving} activeOpacity={0.85}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Aperçu PDF</Text>}
        </TouchableOpacity>
        <Text style={styles.footerHint}>Édition inline + autosave actif. Lancez un aperçu pour contrôler le rendu final PDF.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { flex: 1 },
  content: { padding: theme.spacing.lg, paddingBottom: theme.spacing.md },
  title: { fontSize: 24, fontWeight: "800", color: theme.colors.text, marginBottom: 4 },
  campaignBadge: { fontSize: 14, fontWeight: "700", color: theme.colors.accent, marginBottom: 8 },
  subtitle: { fontSize: 14, color: theme.colors.textSecondary, marginBottom: theme.spacing.md, lineHeight: 20 },
  autosave: { fontSize: 12, marginBottom: theme.spacing.md, color: theme.colors.textMuted, fontWeight: "700" },
  autosaveOk: { color: "#16a34a" },
  autosaveError: { color: theme.colors.error },
  templateRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  templateChip: {
    width: "47%",
    minWidth: 140,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: 12,
    backgroundColor: theme.colors.surface,
  },
  templateChipSelected: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.pastels?.blue || "rgba(37, 99, 235, 0.08)",
  },
  templateChipTitle: { fontSize: 14, fontWeight: "800", color: theme.colors.text },
  templateChipTitleSelected: { color: theme.colors.accent },
  templateChipHint: { fontSize: 11, color: theme.colors.textMuted, marginTop: 4, lineHeight: 14 },
  doc: {
    marginTop: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },
  sectionBlock: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: 12,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  sectionToolbar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  sectionTitle: { fontSize: 14, fontWeight: "800", color: theme.colors.text },
  sectionButtons: { flexDirection: "row", gap: 8 },
  sectionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
  },
  sectionBtnDanger: { borderColor: "rgba(239,68,68,0.35)", backgroundColor: "rgba(239,68,68,0.08)" },
  sectionBtnText: { fontSize: 12, fontWeight: "800", color: theme.colors.textSecondary },
  sectionBtnDangerText: { color: theme.colors.error },
  sectionHidden: { fontSize: 13, color: theme.colors.textMuted, fontStyle: "italic" },
  logoRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  logoBox: {
    flex: 1,
    height: 70,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: theme.colors.surface,
  },
  logoImg: { width: "100%", height: "100%", resizeMode: "contain" },
  logoPlaceholder: { color: theme.colors.textMuted, fontSize: 12, fontWeight: "700" },
  coverBox: {
    backgroundColor: "#fbfbfd",
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 10,
  },
  coverTitle: { fontSize: 24, fontWeight: "800", color: theme.colors.text },
  coverSub: { fontSize: 14, color: theme.colors.textSecondary },
  inlineTextTap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 8,
    paddingVertical: 4,
  },
  inlineText: { color: theme.colors.text, fontSize: 15, fontWeight: "600", flex: 1 },
  inlinePlaceholder: { color: theme.colors.textMuted, fontStyle: "italic", fontWeight: "500" },
  inlineInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === "ios" ? 10 : 8,
    fontSize: 15,
    color: theme.colors.text,
    backgroundColor: theme.colors.surface,
    marginBottom: 8,
  },
  inlineInputMultiline: { minHeight: 78, textAlignVertical: "top" },
  kpiBig: { fontSize: 30, fontWeight: "800", color: theme.colors.accent },
  panelsCount: { marginBottom: 10, color: theme.colors.textSecondary, fontWeight: "700" },
  panelLite: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: 10,
    marginBottom: 10,
  },
  panelPhotosRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  panelPhotoCard: { flex: 1 },
  panelPhoto: { width: "100%", height: 86, borderRadius: theme.radius.md, backgroundColor: theme.colors.surface },
  replaceImageBtn: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingVertical: 6,
    alignItems: "center",
  },
  replaceImageText: { fontSize: 11, fontWeight: "800", color: theme.colors.textSecondary },
  panelLiteHead: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  visualBox: {
    minHeight: 120,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "rgba(17,24,39,0.85)",
    padding: 12,
    justifyContent: "flex-end",
  },
  visualCaption: { color: "#fff", fontSize: 18, fontWeight: "700" },
  closingBox: {
    minHeight: 80,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  closingTitle: { fontSize: 18, fontWeight: "800", color: theme.colors.text },
  closingSub: { fontSize: 13, color: theme.colors.textMuted },
  sectionActions: { marginTop: 10 },
  sectionActionsTitle: { fontSize: 12, color: theme.colors.textMuted, marginBottom: 8, fontWeight: "700" },
  label: { fontSize: 13, fontWeight: "700", color: theme.colors.textSecondary, marginBottom: 6, marginTop: 10 },
  input: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.colors.text,
  },
  textarea: { minHeight: 88, textAlignVertical: "top", paddingTop: 12 },
  panelRow: { borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 12, marginTop: 12 },
  panelHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  moveRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  moveButton: { paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: theme.colors.accent, borderRadius: theme.radius.md },
  moveButtonText: { color: theme.colors.accent, fontSize: 12, fontWeight: "800" },
  gpsRow: { flexDirection: "row", gap: 8 },
  gpsInput: { flex: 1 },
  panelLabel: { flex: 1, marginRight: 8, color: theme.colors.text, fontWeight: "700" },
  smallInput: { marginBottom: 8 },
  primaryButton: {
    backgroundColor: theme.colors.accent,
    paddingVertical: 16,
    borderRadius: theme.radius.lg,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
  },
  primaryButtonDisabled: { opacity: 0.6 },
  primaryText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  errorCard: {
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.25)",
  },
  errorText: { color: theme.colors.error, fontSize: 14, fontWeight: "600" },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  previewLinkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: theme.spacing.sm,
    paddingVertical: 8,
  },
  previewLinkText: { color: theme.colors.accent, fontWeight: "800", fontSize: 14 },
  footerHint: { marginTop: 10, fontSize: 11, color: theme.colors.textMuted, textAlign: "center", lineHeight: 15 },
});
