const { getPanneauReport } = require("../services/rapport.service");
const { generatePanneauPDF } = require("../services/pdf.service");

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

  return generatePanneauPDF(res, report);
};

module.exports = {
  getPanneauReportHandler,
  getPanneauReportPDFHandler,
};
