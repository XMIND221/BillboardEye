const PDFDocument = require("pdfkit");

const generatePanneauPDF = (res, rapport) => {
  const document = new PDFDocument({ margin: 50, size: "A4" });
  const { panneau, photos, isComplete } = rapport;
  const { localisation } = panneau;

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "inline; filename=rapport.pdf");

  document.pipe(res);

  document.fontSize(22).text("Rapport Panneau", { align: "center" });
  document.moveDown(1.5);

  document.fontSize(13).text(`Entreprise: ${panneau.entreprise}`);
  document.moveDown(0.5);
  document.text(`Adresse: ${localisation.adresse || "Non renseignee"}`);
  document.moveDown(0.5);
  document.text(`Latitude / Longitude: ${localisation.latitude} / ${localisation.longitude}`);
  document.moveDown(0.5);
  document.text(`Date de creation: ${new Date(panneau.createdAt).toLocaleString("fr-FR")}`);
  document.moveDown(0.5);
  document.text(`Statut: ${isComplete ? "COMPLET" : "INCOMPLET"}`);

  document.moveDown(1.5);
  document.fontSize(16).text("Photos");
  document.moveDown(0.7);
  document.fontSize(13).text(`Face A: ${photos.faceA ? photos.faceA.url : "Aucune photo"}`);
  document.moveDown(0.5);
  document.text(`Face B: ${photos.faceB ? photos.faceB.url : "Aucune photo"}`);

  document.end();
};

module.exports = {
  generatePanneauPDF,
};
