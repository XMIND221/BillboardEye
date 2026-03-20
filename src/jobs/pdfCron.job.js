const { getAllPanneaux } = require("../services/panneaux.service");
const { getPanneauReport } = require("../services/rapport.service");
const { generatePanneauPDF } = require("../services/pdf.service");

let cronLib = null;
try {
  // Chargement tolerant: evite de casser l'API si la dependance manque.
  cronLib = require("node-cron");
} catch (_error) {
  cronLib = null;
}

const DEFAULT_SCHEDULE = process.env.PDF_CRON_SCHEDULE || "*/30 * * * *";
const IS_ENABLED = (process.env.PDF_CRON_ENABLED || "true").toLowerCase() === "true";

const runPdfBatch = async () => {
  const panneaux = await getAllPanneaux();
  for (const panneau of panneaux) {
    try {
      const report = await getPanneauReport(panneau.id);
      if (!report || !report.isComplete) {
        continue;
      }
      await generatePanneauPDF(report);
    } catch (error) {
      console.log(`PDF cron: echec sur panneau ${panneau.id}: ${error.message}`);
    }
  }
};

const startPdfCron = () => {
  if (!IS_ENABLED) {
    return null;
  }

  if (!cronLib?.schedule) {
    console.log("PDF cron desactive: node-cron non installe.");
    return null;
  }

  const task = cronLib.schedule(DEFAULT_SCHEDULE, async () => {
    await runPdfBatch();
  });

  console.log(`PDF cron actif (${DEFAULT_SCHEDULE})`);
  return task;
};

module.exports = {
  runPdfBatch,
  startPdfCron,
};
