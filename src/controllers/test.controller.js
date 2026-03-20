const { getAllProjets } = require("../services/projets.service");
const { getProjetReport } = require("../services/rapport.service");
const { generateProjetPDF } = require("../services/pdf.service");

const getTestStatus = (_req, res) => {
  res.status(200).json({
    success: true,
    message: "API BillboardEye fonctionne parfaitement",
  });
};

const getTestPdf = async (_req, res) => {
  try {
    const projets = await getAllProjets();
    if (!projets?.length) {
      return res.status(404).json({
        success: false,
        message: "Aucun projet trouvé. Créez une campagne d'abord.",
      });
    }
    const report = await getProjetReport(projets[0].id);
    if (!report) {
      return res.status(404).json({ success: false, message: "Rapport introuvable." });
    }
    const { url } = await generateProjetPDF(report);
    res.redirect(302, url);
  } catch (err) {
    console.error("[test-pdf]", err?.message);
    res.status(500).json({
      success: false,
      message: err?.message || "Erreur lors de la génération du PDF.",
    });
  }
};

module.exports = {
  getTestStatus,
  getTestPdf,
};
