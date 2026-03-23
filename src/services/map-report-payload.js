/**
 * Données rapport campagne (aligné types v0 : templates/report/v0-reference/types.ts)
 * + URL carte Mapbox statique numérotée → mapImageUrl.
 */

const MAPBOX_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;
const PRIMARY_FALLBACK = "#e11d48";

const formatReportDate = (date) => {
  if (!date) return "Non renseignée";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return String(date);
  return d.toLocaleDateString("fr-FR");
};

const formatTime = (raw) => {
  if (!raw) return "--:--";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "--:--";
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
};

const formatGpsShort = (lat, lng) => {
  if (lat == null || lng == null) return "N/A";
  return `${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}`;
};

const hexToMapboxColor = (hex) => {
  const s = String(hex || "").replace(/^#/, "").trim();
  if (/^[0-9A-Fa-f]{6}$/.test(s)) return s.toLowerCase();
  if (/^[0-9A-Fa-f]{3}$/.test(s)) {
    return `${s[0]}${s[0]}${s[1]}${s[1]}${s[2]}${s[2]}`.toLowerCase();
  }
  return "e11d48";
};

const normalizePrimaryCss = (projet) => {
  const raw = projet?.couleurPrincipale;
  if (raw && /^#[0-9A-Fa-f]{3}([0-9A-Fa-f]{3})?$/.test(String(raw).trim())) {
    return String(raw).trim();
  }
  return PRIMARY_FALLBACK;
};

/** Centre France (fallback si aucun GPS sur la campagne) */
const MAP_FALLBACK_CENTER = { lat: 46.603354, lng: 1.888334 };

/**
 * Collecte les coordonnées réelles pour calculer un centroïde.
 * @param {Array<{ localisation?: { latitude?: unknown, longitude?: unknown } }>} panneaux
 */
const collectRealCoords = (panneaux) => {
  const out = [];
  for (const p of panneaux) {
    const loc = p?.localisation;
    if (loc?.latitude == null || loc?.longitude == null) continue;
    const lat = Number(loc.latitude);
    const lng = Number(loc.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    out.push({ lat, lng });
  }
  return out;
};

const centroidOf = (coords) => {
  if (!coords.length) return null;
  return {
    lat: coords.reduce((s, c) => s + c.lat, 0) / coords.length,
    lng: coords.reduce((s, c) => s + c.lng, 0) / coords.length,
  };
};

/**
 * Un repère par panneau : coordonnées réelles ou position indicative en couronne autour du centroïde.
 * @returns {Array<{ lat: number, lng: number, hasRealGps: boolean }>}
 */
const resolveMapPinPositions = (panneaux) => {
  if (!Array.isArray(panneaux) || panneaux.length === 0) return [];
  const realSamples = collectRealCoords(panneaux);
  const center = centroidOf(realSamples) || MAP_FALLBACK_CENTER;
  const n = panneaux.length;
  return panneaux.map((p, i) => {
    const loc = p?.localisation;
    if (loc?.latitude != null && loc?.longitude != null) {
      const lat = Number(loc.latitude);
      const lng = Number(loc.longitude);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        return { lat, lng, hasRealGps: true };
      }
    }
    const angle = (i * 2 * Math.PI) / Math.max(n, 1);
    const radiusDeg = 0.045;
    return {
      lat: center.lat + radiusDeg * Math.sin(angle),
      lng: center.lng + radiusDeg * Math.cos(angle),
      hasRealGps: false,
    };
  });
};

/**
 * Pins numérotés : exactement un pin par panneau (même indice que fiches 01, 02…).
 * @param {Array<{ localisation?: { latitude?: number, longitude?: number } }>} panneaux
 * @param {Array<{ lat: number, lng: number }>} positions — sortie de resolveMapPinPositions
 */
const buildMapImageUrlFromPositions = (panneaux, positions, primaryHex) => {
  if (!MAPBOX_TOKEN || !Array.isArray(panneaux) || panneaux.length === 0) return "";
  if (!Array.isArray(positions) || positions.length !== panneaux.length) return "";

  const pinOverlays = [];
  const coordsForCenter = [];
  const color = hexToMapboxColor(primaryHex || PRIMARY_FALLBACK);

  for (let i = 0; i < panneaux.length; i += 1) {
    const pos = positions[i];
    if (!pos || !Number.isFinite(pos.lat) || !Number.isFinite(pos.lng)) continue;
    const displayNum = i + 1;
    coordsForCenter.push({ lat: pos.lat, lng: pos.lng });
    const label = displayNum <= 99 ? String(displayNum) : "m";
    pinOverlays.push(`pin-l-${label}+${color}(${pos.lng},${pos.lat})`);
  }

  if (pinOverlays.length === 0) return "";

  const centerLng = coordsForCenter.reduce((s, p) => s + p.lng, 0) / coordsForCenter.length;
  const centerLat = coordsForCenter.reduce((s, p) => s + p.lat, 0) / coordsForCenter.length;
  const pins = pinOverlays.join(",");

  return `https://api.mapbox.com/styles/v1/mapbox/light-v11/static/${pins}/${centerLng},${centerLat},11,0/1100x620@2x?access_token=${encodeURIComponent(MAPBOX_TOKEN)}`;
};

/** @deprecated préférer resolveMapPinPositions + buildMapImageUrlFromPositions */
const buildMapImageUrl = (panneaux, primaryHex) => {
  const positions = resolveMapPinPositions(panneaux);
  return buildMapImageUrlFromPositions(panneaux, positions, primaryHex);
};

const DEFAULT_MAP_CAPTION = "Distribution géographique des panneaux";

/**
 * Contexte métier + URLs brutes (images à résoudre en data URI côté report-template.service).
 * @param {{ projet?: object, panneaux?: any[], summary?: { total?: number } }} report
 */
const buildMapReportContext = (report) => {
  const projet = report.projet || {};
  const panneaux = report.panneaux || [];
  const primaryCss = normalizePrimaryCss(projet);
  const pinPositions = resolveMapPinPositions(panneaux);

  const zones = panneaux.map((p, index) => {
    const photos = p.photos || {};
    const faceA = photos.faceA;
    const faceB = photos.faceB;
    const loc = p.localisation || {};
    const nomGestion =
      (p.nomZone && String(p.nomZone).trim()) ||
      (p.nom_zone && String(p.nom_zone).trim()) ||
      "";
    const name = nomGestion || loc.adresse || `Zone ${index + 1}`;
    const showOnMap = loc.latitude != null && loc.longitude != null;
    return {
      index: index + 1,
      name,
      showOnMap,
      faceAUrl: faceA?.url || null,
      faceBUrl: faceB?.url || null,
      faceALabel: "Face A",
      faceBLabel: "Face B",
      gpsCoordinates: formatGpsShort(loc.latitude, loc.longitude),
      timestamp: formatTime(faceA?.createdAt || faceB?.createdAt),
    };
  });

  const legendeV = projet.legendeVisuelle ?? projet.legende_visuelle;
  const legendeC = projet.legendeCarte ?? projet.legende_carte;
  const instructions = projet.instructions ? String(projet.instructions).trim() : "";

  const mapImageUrl = buildMapImageUrlFromPositions(panneaux, pinPositions, primaryCss);
  const mapCaption = legendeC ? String(legendeC).trim() : DEFAULT_MAP_CAPTION;

  /** Légende : un ligne par panneau ; pinUsesRealGps = coordonnées réelles vs position indicative */
  const mapLegend = zones.map((z, idx) => ({
    num: z.index,
    numPadded: String(z.index).padStart(2, "0"),
    name: z.name,
    onMap: true,
    pinUsesRealGps: Boolean(pinPositions[idx]?.hasRealGps),
  }));

  const visualCaption = legendeV ? String(legendeV).trim() : "";

  const firstVisualUrl =
    zones.map((z) => z.faceAUrl).find(Boolean) || zones.map((z) => z.faceBUrl).find(Boolean) || "";

  const count = panneaux.length;
  /** Indique si le serveur peut appeler l’API Mapbox Static (sinon message d’aide dans le PDF) */
  const mapboxConfigured = Boolean(MAPBOX_TOKEN && String(MAPBOX_TOKEN).trim().length > 0);

  const campaignTitle = projet.titreRapport || projet.nom || "Rapport campagne";
  const defaultClosingBody = `Document généré pour la campagne « ${campaignTitle} ». Les données terrain (photos, GPS, horodatages) sont celles enregistrées au moment de la mission.`;

  return {
    projet,
    primaryCss,
    mapboxConfigured,
    documentTitle: campaignTitle,
    campaignName: campaignTitle,
    clientLine: projet.entreprise ? `Client : ${projet.entreprise}` : "Client : —",
    /** Nom client seul (variantes PDF v0 : ligne « Client » sans préfixe) */
    clientDisplay: projet.entreprise ? String(projet.entreprise).trim() : "—",
    zoneLine: projet.zone ? String(projet.zone).trim() : "",
    date: formatReportDate(projet.date),
    footerBrand: projet.footerBrand || projet.footer_brand || "BillboardEye",
    footerNote:
      projet.footerNote ||
      projet.footer_note ||
      "Rapport généré par BillboardEye",
    closingHeading:
      projet.closingHeading || projet.closing_heading || "Merci pour votre confiance",
    closingBody:
      (projet.closingBody && String(projet.closingBody).trim()) ||
      (projet.closing_body && String(projet.closing_body).trim()) ||
      defaultClosingBody,
    closingSignatureLabel:
      projet.closingSignatureLabel ||
      projet.closing_signature_label ||
      "Contact BillboardEye",
    closingSignatureValue:
      projet.closingSignatureValue ||
      projet.closing_signature_value ||
      "contact@billboardeye.fr",
    /** Toujours aligné sur le tableau panneaux du rapport (évite écart avec la carte / summary.total obsolète) */
    zonesCount: count,
    billboardsCount: count,
    duration: projet.duree || "N/R",
    noteResume: instructions || undefined,
    mapImageUrl: mapImageUrl || undefined,
    mapCaption: mapCaption || undefined,
    mapLegend,
    zones,
    visualImageUrl: firstVisualUrl || undefined,
    visualCaption: visualCaption || undefined,
  };
};

module.exports = {
  buildMapReportContext,
  buildMapImageUrl,
  buildMapImageUrlFromPositions,
  resolveMapPinPositions,
  formatReportDate,
  formatTime,
};
