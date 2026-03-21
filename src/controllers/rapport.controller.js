const { getPanneauReport, getProjetReport } = require("../services/rapport.service");
const { generatePanneauPDF, generateProjetPDF, diagnosePhotoLoad } = require("../services/pdf.service");

const MAX_PANELS_PER_REPORT = 500;
const MAX_TEXT_LEN = 5000;

const sanitizeText = (value, max = 255) => {
  if (value == null) return undefined;
  const text = String(value).trim();
  if (!text) return "";
  return text.slice(0, max);
};

const sanitizeLatitude = (value) => {
  if (value == null || value === "") return undefined;
  const n = Number(value);
  if (!Number.isFinite(n) || n < -90 || n > 90) return null;
  return n;
};

const sanitizeLongitude = (value) => {
  if (value == null || value === "") return undefined;
  const n = Number(value);
  if (!Number.isFinite(n) || n < -180 || n > 180) return null;
  return n;
};

const sanitizeOverrides = (overrides = {}) => {
  const safe = {
    titreRapport: sanitizeText(overrides.titreRapport, 180),
    entreprise: sanitizeText(overrides.entreprise, 180),
    duree: sanitizeText(overrides.duree, 120),
    instructions: sanitizeText(overrides.instructions, MAX_TEXT_LEN),
    /** Légende grande image visuelle (bas de page photo) */
    legendeVisuelle: sanitizeText(overrides.legendeVisuelle, 500),
    /** Légende affichée sur la carte « Résumé de la campagne » */
    legendeCarte: sanitizeText(overrides.legendeCarte, 220),
    zone: sanitizeText(overrides.zone, 2000),
    assignedAgent: sanitizeText(overrides.assignedAgent, 180),
    date: sanitizeText(overrides.date, 30),
    panneaux: [],
  };

  const panneauxInput = Array.isArray(overrides.panneaux) ? overrides.panneaux.slice(0, MAX_PANELS_PER_REPORT) : [];
  safe.panneaux = panneauxInput.map((p, idx) => ({
    id: sanitizeText(p?.id, 120),
    enabled: p?.enabled !== false,
    order: Number.isFinite(Number(p?.order)) ? Number(p.order) : idx,
    zoneName: sanitizeText(p?.zoneName, 220),
    latitude: sanitizeLatitude(p?.latitude),
    longitude: sanitizeLongitude(p?.longitude),
    observationsFaceA: sanitizeText(p?.observationsFaceA, 1000),
    observationsFaceB: sanitizeText(p?.observationsFaceB, 1000),
  }));

  const invalidCoord = safe.panneaux.some((p) => p.latitude === null || p.longitude === null);
  if (invalidCoord) {
    const err = new Error("Coordonnées GPS invalides dans les modifications.");
    err.statusCode = 400;
    throw err;
  }

  return safe;
};

const getPanneauReportHandler = async (req, res) => {
  let report;

  try {
    report = await getPanneauReport(req.params.id);
  } catch (error) {
    console.error("[rapport] getPanneauReport error:", error?.message || error);
    return res.status(500).json({
      success: false,
      message: "Erreur interne lors de la generation du rapport.",
    });
  }

  if (!report) {
    return res.status(404).json({
      success: false,
      message: "Panneau introuvable.",
    });
  }

  return res.status(200).json({
    success: true,
    data: report,
  });
};

const getPanneauReportPDFHandler = async (req, res) => {
  let report;

  try {
    report = await getPanneauReport(req.params.id);
  } catch (_error) {
    return res.status(500).json({
      success: false,
      message: "Erreur interne lors de la generation du rapport PDF.",
    });
  }

  if (!report) {
    return res.status(404).json({
      success: false,
      message: "Panneau introuvable.",
    });
  }

  try {
    const { buffer, fileName } = await generatePanneauPDF(report);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename=${fileName}`);
    return res.status(200).send(buffer);
  } catch (_error) {
    return res.status(500).json({
      success: false,
      message: "Erreur interne lors de la generation/upload du rapport PDF.",
    });
  }
};

const getPanneauReportPDFUrlHandler = async (req, res) => {
  let report;

  try {
    report = await getPanneauReport(req.params.id);
  } catch (error) {
    console.error("[rapport] getPanneauReport PDF-URL error:", error?.message || error);
    return res.status(500).json({
      success: false,
      message: "Erreur interne lors de la generation du lien PDF.",
    });
  }

  if (!report) {
    return res.status(404).json({
      success: false,
      message: "Panneau introuvable.",
    });
  }

  try {
    const { url } = await generatePanneauPDF(report);
    return res.status(200).json({
      success: true,
      data: {
        url,
      },
    });
  } catch (error) {
    console.error("[rapport] generatePanneauPDF URL error:", error?.message || error);
    return res.status(500).json({
      success: false,
      message: "Erreur interne lors de l'upload du PDF.",
    });
  }
};

const getProjetReportHandler = async (req, res) => {
  let report;

  try {
    report = await getProjetReport(req.params.id);
  } catch (_error) {
    return res.status(500).json({
      success: false,
      message: "Erreur interne lors de la generation du rapport campagne.",
    });
  }

  if (!report) {
    return res.status(404).json({
      success: false,
      message: "Campagne introuvable.",
    });
  }

  return res.status(200).json({
    success: true,
    data: report,
  });
};

const getProjetReportDebugHandler = async (req, res) => {
  let report;
  try {
    report = await getProjetReport(req.params.id);
  } catch (err) {
    return res.status(500).json({ success: false, message: err?.message || "Erreur" });
  }
  if (!report) return res.status(404).json({ success: false, message: "Campagne introuvable" });
  const photoLoadResults = await diagnosePhotoLoad(report);
  const debug = {
    projet: { id: report.projet.id, nom: report.projet.nom },
    panneaux: report.panneaux.map((p) => ({
      id: p.id,
      adresse: p.localisation?.adresse,
      photos: {
        faceA: p.photos?.faceA ? { url: p.photos.faceA.url } : null,
        faceB: p.photos?.faceB ? { url: p.photos.faceB.url } : null,
      },
    })),
    photoLoadResults,
  };
  return res.status(200).json({ success: true, data: debug });
};

const applyProjetOverrides = (report, overrides = {}) => {
  const next = {
    ...report,
    projet: { ...report.projet },
    panneaux: (report.panneaux || []).map((p) => ({ ...p })),
  };

  if (overrides.titreRapport != null) next.projet.titreRapport = String(overrides.titreRapport);
  if (overrides.entreprise != null) next.projet.entreprise = String(overrides.entreprise);
  if (overrides.duree != null) next.projet.duree = String(overrides.duree);
  if (overrides.instructions != null) next.projet.instructions = String(overrides.instructions);
  if (overrides.legendeVisuelle != null) next.projet.legendeVisuelle = String(overrides.legendeVisuelle);
  if (overrides.legendeCarte != null) next.projet.legendeCarte = String(overrides.legendeCarte);
  if (overrides.zone != null) next.projet.zone = String(overrides.zone);
  if (overrides.assignedAgent != null) next.projet.assignedAgent = String(overrides.assignedAgent);
  if (overrides.date != null) next.projet.date = String(overrides.date);

  const panneauOverrides = Array.isArray(overrides.panneaux) ? overrides.panneaux : [];
  const byId = new Map(panneauOverrides.map((p) => [String(p.id), p]));
  const orderById = new Map(panneauOverrides.map((p, idx) => [String(p.id), Number.isFinite(p.order) ? p.order : idx]));
  next.panneaux = next.panneaux
    .map((p) => {
      const ov = byId.get(String(p.id));
      if (!ov) return p;
      return {
        ...p,
        observationsFaceA: ov.observationsFaceA != null ? String(ov.observationsFaceA) : p.observationsFaceA,
        observationsFaceB: ov.observationsFaceB != null ? String(ov.observationsFaceB) : p.observationsFaceB,
        disabledInReport: ov.enabled === false,
        localisation: {
          ...(p.localisation || {}),
          adresse: ov.zoneName != null ? String(ov.zoneName) : p.localisation?.adresse,
          latitude: ov.latitude != null && ov.latitude !== "" ? Number(ov.latitude) : p.localisation?.latitude,
          longitude: ov.longitude != null && ov.longitude !== "" ? Number(ov.longitude) : p.localisation?.longitude,
        },
        __order: orderById.get(String(p.id)) ?? 99999,
      };
    })
    .filter((p) => !p.disabledInReport)
    .sort((a, b) => (a.__order || 0) - (b.__order || 0))
    .map((p) => {
      const { __order, ...clean } = p;
      return clean;
    });

  next.summary = {
    ...next.summary,
    total: next.panneaux.length,
    completed: next.panneaux.filter((p) => p.isComplete).length,
    remaining: next.panneaux.filter((p) => !p.isComplete).length,
  };

  return next;
};

const getProjetReportPDFUrlHandler = async (req, res) => {
  let report;

  try {
    report = await getProjetReport(req.params.id);
  } catch (error) {
    console.error("[rapport] getProjetReport PDF-URL error:", error?.message || error);
    return res.status(500).json({
      success: false,
      message: "Erreur interne lors de la generation PDF campagne.",
    });
  }

  if (!report) {
    return res.status(404).json({
      success: false,
      message: "Campagne introuvable.",
    });
  }

  try {
    const { url } = await generateProjetPDF(report);
    const data = { url };
    if (req.query.debug === "1") {
      data.photoLoadResults = await diagnosePhotoLoad(report);
    }
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("[rapport] generateProjetPDF URL error:", error?.message || error);
    return res.status(500).json({
      success: false,
      message: "Erreur interne lors de l'upload du PDF campagne.",
    });
  }
};

const getProjetReportPDFHandler = async (req, res) => {
  let report;

  try {
    report = await getProjetReport(req.params.id);
  } catch (error) {
    console.error("[rapport] getProjetReport PDF error:", error?.message || error);
    return res.status(500).json({
      success: false,
      message: "Erreur interne lors de la generation du rapport PDF campagne.",
    });
  }

  if (!report) {
    return res.status(404).json({
      success: false,
      message: "Campagne introuvable.",
    });
  }

  try {
    const { buffer, fileName } = await generateProjetPDF(report);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename=${fileName}`);
    return res.status(200).send(buffer);
  } catch (error) {
    console.error("[rapport] generateProjetPDF error:", error?.message || error);
    return res.status(500).json({
      success: false,
      message: "Erreur interne lors de la generation/upload du rapport PDF campagne.",
    });
  }
};

const previewProjetReportPDFHandler = async (req, res) => {
  let report;
  try {
    report = await getProjetReport(req.params.id);
  } catch (error) {
    return res.status(500).json({ success: false, message: "Erreur interne lors du chargement du rapport." });
  }
  if (!report) {
    return res.status(404).json({ success: false, message: "Campagne introuvable." });
  }
  try {
    const overrides = sanitizeOverrides(req.body?.overrides || {});
    const reportWithOverrides = applyProjetOverrides(report, overrides);
    const suffix = `preview-${Date.now()}`;
    const { url } = await generateProjetPDF(reportWithOverrides, { suffix });
    return res.status(200).json({ success: true, data: { url } });
  } catch (error) {
    const statusCode = Number.isInteger(error?.statusCode) ? error.statusCode : 500;
    console.error("[rapport] previewProjetReportPDFHandler error:", error?.message || error);
    return res.status(statusCode).json({ success: false, message: statusCode === 400 ? error.message : "Erreur lors de la génération de l'aperçu PDF." });
  }
};

const generateProjetReportFinalPDFHandler = async (req, res) => {
  let report;
  try {
    report = await getProjetReport(req.params.id);
  } catch (error) {
    return res.status(500).json({ success: false, message: "Erreur interne lors du chargement du rapport." });
  }
  if (!report) {
    return res.status(404).json({ success: false, message: "Campagne introuvable." });
  }
  try {
    const overrides = sanitizeOverrides(req.body?.overrides || {});
    const reportWithOverrides = applyProjetOverrides(report, overrides);
    const { url } = await generateProjetPDF(reportWithOverrides);
    return res.status(200).json({ success: true, data: { url } });
  } catch (error) {
    const statusCode = Number.isInteger(error?.statusCode) ? error.statusCode : 500;
    console.error("[rapport] generateProjetReportFinalPDFHandler error:", error?.message || error);
    return res.status(statusCode).json({ success: false, message: statusCode === 400 ? error.message : "Erreur lors de la génération du PDF final." });
  }
};

module.exports = {
  getPanneauReportHandler,
  getPanneauReportPDFHandler,
  getPanneauReportPDFUrlHandler,
  getProjetReportHandler,
  getProjetReportDebugHandler,
  getProjetReportPDFUrlHandler,
  getProjetReportPDFHandler,
  previewProjetReportPDFHandler,
  generateProjetReportFinalPDFHandler,
};
