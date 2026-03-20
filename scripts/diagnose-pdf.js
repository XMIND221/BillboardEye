#!/usr/bin/env node
/**
 * Script de diagnostic PDF - à lancer avec: node scripts/diagnose-pdf.js [projetId]
 * Sans projetId: utilise le premier projet trouvé.
 */
require("dotenv").config();
const { getProjetReport } = require("../src/services/rapport.service");
const { getAllProjets } = require("../src/services/projets.service");
const { diagnosePhotoLoad } = require("../src/services/pdf.service");

let projetId = process.argv[2];

const fs = require("fs");
const path = require("path");
const outPath = path.join(__dirname, "..", "diagnose-pdf-output.txt");

function log(...args) {
  const s = args.join(" ");
  console.log(...args);
  fs.appendFileSync(outPath, s + "\n");
}

async function run() {
  fs.writeFileSync(outPath, "");
  if (!projetId) {
    const projets = await getAllProjets();
    if (!projets?.length) {
      log("Aucun projet trouvé. Créez une campagne d'abord.");
      process.exit(1);
    }
    projetId = projets[0].id;
    log("ProjetId non fourni, utilisation du premier:", projetId, projets[0].nom);
  }
  log("Diagnostic PDF pour projet:", projetId);
  const report = await getProjetReport(projetId);
  if (!report) {
    log("Projet introuvable");
    process.exit(1);
  }
  log("Panneaux:", report.panneaux.length);
  for (const p of report.panneaux) {
    log("\n--- Panneau", p.id, p.localisation?.adresse || "");
    log("  FaceA URL:", p.photos?.faceA?.url || "AUCUNE");
    log("  FaceB URL:", p.photos?.faceB?.url || "AUCUNE");
  }
  log("\n--- Test chargement photos ---");
  const results = await diagnosePhotoLoad(report);
  for (const r of results) {
    log("\n", r.adresse || r.panneauId);
    log("  FaceA:", r.faceA.load, r.faceA.url ? `(${r.faceA.url})` : "");
    log("  FaceB:", r.faceB.load, r.faceB.url ? `(${r.faceB.url})` : "");
  }
  log("\nRésultat écrit dans", outPath);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
