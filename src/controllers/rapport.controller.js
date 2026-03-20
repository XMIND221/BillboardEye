const { getPanneauReport, getProjetReport } = require("../services/rapport.service");
const { generatePanneauPDF, generateProjetPDF, diagnosePhotoLoad } = require("../services/pdf.service");

const getPanneauReportHandler = async (req, res) => {
  let report;

  try {
    report = await getPanneauReport(req.params.id);
  } catch (_error) {
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
  } catch (_error) {
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
  } catch (_error) {
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

const getProjetReportPDFUrlHandler = async (req, res) => {
  let report;

  try {
    report = await getProjetReport(req.params.id);
  } catch (_error) {
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
  } catch (_error) {
    return res.status(500).json({
      success: false,
      message: "Erreur interne lors de l'upload du PDF campagne.",
    });
  }
};

module.exports = {
  getPanneauReportHandler,
  getPanneauReportPDFHandler,
  getPanneauReportPDFUrlHandler,
  getProjetReportHandler,
  getProjetReportDebugHandler,
  getProjetReportPDFUrlHandler,
};
