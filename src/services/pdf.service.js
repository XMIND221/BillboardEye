const PDFDocument = require("pdfkit");
const supabase = require("../config/supabase");
const { createClient } = require("@supabase/supabase-js");
const fetch = typeof globalThis.fetch === "function" ? globalThis.fetch : require("node-fetch");

const PDF_BUCKET = process.env.PDF_BUCKET_NAME || "panneaux-pdf";
const MAPBOX_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;
const PHOTOS_BUCKET = "panneaux-images";
const DEBUG_PDF = process.env.DEBUG_PDF === "true";

const supabaseStorage = process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : supabase;

// Identité BillboardEye — empreinte entreprise sur tous les rapports
const BILLBOARD_EYE = {
  name: "BillboardEye",
  tagline: "Rapport généré par BillboardEye",
  primary: "#0F172A",
  accent: "#2563EB",
  muted: "#64748B",
  light: "#F8FAFC",
};

// ——— Design premium : constantes ———
const MARGIN_X = 80;
const MARGIN_Y = 80;
const FOOTER_H = 50;
const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN_X;
const CONTENT_HEIGHT = PAGE_HEIGHT - 2 * MARGIN_Y - FOOTER_H;

const FONT_TITLE = 42;
const FONT_SECTION = 24;
const FONT_SUBSECTION = 16;
const FONT_BODY = 11;
const FONT_CAPTION = 9;

const IMG_SIZE = 220;
const IMG_GAP = 24;
const MAP_HEIGHT = 380;

const formatGps = (lat, lng) => {
  if (lat == null || lng == null) return "N/A";
  return `${Number(lat).toFixed(6)} / ${Number(lng).toFixed(6)}`;
};

const getStoragePath = (url) => {
  if (!url || typeof url !== "string") return null;
  const idx = url.indexOf(`/${PHOTOS_BUCKET}/`);
  if (idx !== -1) {
    const p = url.substring(idx + PHOTOS_BUCKET.length + 2).split("?")[0];
    return p ? decodeURIComponent(p) : null;
  }
  if (url.startsWith(`${PHOTOS_BUCKET}/`)) {
    return decodeURIComponent(url.substring(PHOTOS_BUCKET.length + 1).split("?")[0]);
  }
  if (url.startsWith("photos/") || (!url.startsWith("http") && url.includes("/"))) {
    return url.split("?")[0];
  }
  return null;
};

const fetchImageAsBuffer = async (url) => {
  if (!url || typeof url !== "string") return null;
  const storagePath = getStoragePath(url);
  if (storagePath) {
    try {
      const { data, error } = await supabaseStorage.storage.from(PHOTOS_BUCKET).download(storagePath);
      if (!error && data) return Buffer.from(await data.arrayBuffer());
    } catch (_) {}
  }
  try {
    const res = await fetch(url);
    if (res.ok) return Buffer.from(await res.arrayBuffer());
  } catch (_) {}
  return null;
};

const fetchStaticMapBuffer = async (panneaux) => {
  const points = panneaux
    .map((p) => p.localisation)
    .filter((l) => l?.latitude != null && l?.longitude != null);
  if (points.length === 0 || !MAPBOX_TOKEN) return null;
  const centerLng = points.reduce((s, p) => s + p.longitude, 0) / points.length;
  const centerLat = points.reduce((s, p) => s + p.latitude, 0) / points.length;
  const pins = points.map((p) => `pin-l+2563eb(${p.longitude},${p.latitude})`).join(",");
  const mapUrl = `https://api.mapbox.com/styles/v1/mapbox/light-v11/static/${pins}/${centerLng},${centerLat},12/800x500?access_token=${MAPBOX_TOKEN}`;
  return fetchImageAsBuffer(mapUrl);
};

const ensurePdfBucketExists = async () => {
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) throw new Error(`Erreur lecture buckets Supabase: ${listError.message}`);
  const exists = buckets.some((b) => b.name === PDF_BUCKET);
  if (!exists) {
    const { error: createError } = await supabase.storage.createBucket(PDF_BUCKET, { public: true });
    if (createError) throw new Error(`Erreur creation bucket PDF: ${createError.message}`);
  }
};

const buildPdfFileName = (type, id) =>
  type === "projet" ? `rapport-projet-${id}.pdf` : `rapport-panneau-${id}.pdf`;

// ——— Helpers design premium ———
const addFooter = (doc, pageNum, totalPages, accentColor) => {
  const y = PAGE_HEIGHT - FOOTER_H + 14;
  doc.strokeColor(accentColor).lineWidth(0.3).moveTo(MARGIN_X, PAGE_HEIGHT - FOOTER_H).lineTo(PAGE_WIDTH - MARGIN_X, PAGE_HEIGHT - FOOTER_H).stroke();
  doc.fontSize(FONT_CAPTION).fillColor(BILLBOARD_EYE.muted);
  doc.text(BILLBOARD_EYE.tagline, MARGIN_X, y);
  doc.text(totalPages ? `${pageNum} / ${totalPages}` : String(pageNum), PAGE_WIDTH - MARGIN_X - 40, y, { width: 40, align: "right" });
};

const drawCoverPage = (doc, reportTitle, clientName, accentColor) => {
  doc.y = MARGIN_Y;
  doc.fillColor(BILLBOARD_EYE.primary).fontSize(FONT_CAPTION).font("Helvetica").text(`${BILLBOARD_EYE.name.toUpperCase()} · Premium`, 0, doc.y, { width: PAGE_WIDTH, align: "center" });
  doc.y = PAGE_HEIGHT / 2 - 100;
  doc.strokeColor(accentColor).lineWidth(2).moveTo(PAGE_WIDTH / 2 - 60, doc.y).lineTo(PAGE_WIDTH / 2 + 60, doc.y).stroke();
  doc.y += 24;
  doc.fillColor(BILLBOARD_EYE.primary).fontSize(FONT_TITLE).font("Helvetica-Bold").text(reportTitle, MARGIN_X, doc.y, { width: CONTENT_WIDTH, align: "center" });
  doc.y += 52;
  doc.font("Helvetica").fontSize(FONT_BODY).fillColor(BILLBOARD_EYE.muted).text(clientName, { width: PAGE_WIDTH, align: "center" });
  doc.y = PAGE_HEIGHT - FOOTER_H - 40;
  doc.fontSize(FONT_CAPTION).fillColor(BILLBOARD_EYE.muted).text(BILLBOARD_EYE.tagline, { width: PAGE_WIDTH, align: "center" });
};

const drawStatsPage = (doc, projet, summary, zones, mapBuffer, accentColor) => {
  doc.y = MARGIN_Y;
  doc.fontSize(FONT_SECTION).font("Helvetica-Bold").fillColor(BILLBOARD_EYE.primary).text("Résultats terrain", MARGIN_X, doc.y);
  doc.y += 36;

  const statW = CONTENT_WIDTH / 3;
  const statH = 70;
  const stats = [
    { label: "Total panneaux", value: String(summary.total) },
    { label: "Complétés", value: String(summary.completed) },
    { label: "Restants", value: String(summary.remaining) },
  ];
  stats.forEach((s, i) => {
    const x = MARGIN_X + i * (statW + 12);
    doc.rect(x, doc.y, statW, statH).strokeColor("#E2E8F0").lineWidth(0.5).stroke();
    doc.fontSize(28).font("Helvetica-Bold").fillColor(accentColor).text(s.value, x + 12, doc.y + 18, { width: statW - 24, align: "center" });
    doc.fontSize(FONT_CAPTION).fillColor(BILLBOARD_EYE.muted).text(s.label, x + 12, doc.y + 50, { width: statW - 24, align: "center" });
  });
  doc.y += statH + 28;

  doc.fontSize(FONT_BODY).fillColor(BILLBOARD_EYE.primary);
  doc.text(`Client : ${projet.entreprise}`, MARGIN_X, doc.y);
  doc.y += 14;
  doc.text(`Campagne : ${projet.nom}`, MARGIN_X, doc.y);
  doc.y += 14;
  doc.text(`Durée : ${projet.duree || "Non renseignée"}`, MARGIN_X, doc.y);
  doc.y += 14;
  doc.text(`Zones : ${zones.length}`, MARGIN_X, doc.y);
  doc.y += 14;
  doc.text(`Date : ${projet.date ? new Date(projet.date).toLocaleDateString("fr-FR") : "N/A"}`, MARGIN_X, doc.y);
  doc.y += 24;

  if (mapBuffer) {
    doc.fontSize(FONT_SUBSECTION).font("Helvetica-Bold").fillColor(BILLBOARD_EYE.primary).text("Zones couvertes", MARGIN_X, doc.y);
    doc.y += 24;
    doc.rect(MARGIN_X, doc.y, CONTENT_WIDTH, MAP_HEIGHT).strokeColor("#E2E8F0").lineWidth(0.5).stroke();
    doc.image(mapBuffer, MARGIN_X + 2, doc.y + 2, { width: CONTENT_WIDTH - 4, height: MAP_HEIGHT - 4 });
    doc.y += MAP_HEIGHT + 12;
  }
};

const drawPhotoPair = (doc, faceABuf, faceBBuf, zoneName, gps, accentColor) => {
  const halfW = (CONTENT_WIDTH - IMG_GAP) / 2;
  const imgW = Math.min(IMG_SIZE, halfW - 8);
  const imgH = (imgW * 3) / 4;

  doc.fontSize(FONT_SUBSECTION).font("Helvetica-Bold").fillColor(BILLBOARD_EYE.primary).text(zoneName);
  doc.moveDown(0.3);
  doc.fontSize(FONT_CAPTION).fillColor(BILLBOARD_EYE.muted).text(`GPS ${gps}`);
  doc.moveDown(0.8);

  const startY = doc.y;
  const leftX = MARGIN_X;
  const rightX = MARGIN_X + halfW + IMG_GAP;

  if (faceABuf) {
    doc.rect(leftX, startY, imgW + 4, imgH + 4).strokeColor("#E2E8F0").lineWidth(0.5).stroke();
    doc.image(faceABuf, leftX + 2, startY + 2, { width: imgW, height: imgH });
    doc.fontSize(FONT_CAPTION).fillColor(BILLBOARD_EYE.muted).text("Face A", leftX, startY + imgH + 8);
  } else {
    doc.rect(leftX, startY, imgW + 4, imgH + 4).strokeColor("#E2E8F0").lineWidth(0.5).stroke();
    doc.fontSize(FONT_CAPTION).fillColor(BILLBOARD_EYE.muted).text("Face A — Aucune photo", leftX, startY + imgH / 2 - 6, { width: imgW + 4, align: "center" });
  }

  if (faceBBuf) {
    doc.rect(rightX, startY, imgW + 4, imgH + 4).strokeColor("#E2E8F0").lineWidth(0.5).stroke();
    doc.image(faceBBuf, rightX + 2, startY + 2, { width: imgW, height: imgH });
    doc.fontSize(FONT_CAPTION).fillColor(BILLBOARD_EYE.muted).text("Face B", rightX, startY + imgH + 8);
  } else {
    doc.rect(rightX, startY, imgW + 4, imgH + 4).strokeColor("#E2E8F0").lineWidth(0.5).stroke();
    doc.fontSize(FONT_CAPTION).fillColor(BILLBOARD_EYE.muted).text("Face B — Aucune photo", rightX, startY + imgH / 2 - 6, { width: imgW + 4, align: "center" });
  }

  doc.y = startY + imgH + 28;
};

const drawClosingPage = (doc, accentColor) => {
  doc.y = PAGE_HEIGHT / 2 - 80;
  doc.strokeColor(accentColor).lineWidth(2).moveTo(PAGE_WIDTH / 2 - 50, doc.y).lineTo(PAGE_WIDTH / 2 + 50, doc.y).stroke();
  doc.y += 28;
  doc.fillColor(BILLBOARD_EYE.primary).fontSize(FONT_SECTION).font("Helvetica-Bold").text(BILLBOARD_EYE.name.toUpperCase(), { width: PAGE_WIDTH, align: "center" });
  doc.y += 28;
  doc.fontSize(FONT_BODY).fillColor(BILLBOARD_EYE.muted).text(BILLBOARD_EYE.tagline, { width: PAGE_WIDTH, align: "center" });
  doc.y += 16;
  doc.fontSize(FONT_CAPTION).fillColor(BILLBOARD_EYE.muted).text(new Date().toLocaleDateString("fr-FR"), { width: PAGE_WIDTH, align: "center" });
};

const createPanneauPDFBuffer = async (rapport) => {
  const { panneau, photos, isComplete } = rapport;
  const faceABuf = photos?.faceA?.url ? await fetchImageAsBuffer(photos.faceA.url) : null;
  const faceBBuf = photos?.faceB?.url ? await fetchImageAsBuffer(photos.faceB.url) : null;
  const accentColor = BILLBOARD_EYE.accent;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 0, size: "A4" });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("error", reject);
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    drawCoverPage(doc, "Rapport Panneau", panneau.entreprise, accentColor);
    addFooter(doc, 1, 2, accentColor);

    doc.addPage({ margin: 0 });
    doc.fillColor(BILLBOARD_EYE.primary).fontSize(FONT_CAPTION).text(BILLBOARD_EYE.name.toUpperCase(), 0, MARGIN_Y - 10, { width: PAGE_WIDTH, align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(FONT_SECTION).font("Helvetica-Bold").fillColor(BILLBOARD_EYE.primary).text("Preuves visuelles", MARGIN_X, MARGIN_Y);
    doc.moveDown(1);
    doc.fontSize(FONT_BODY).fillColor(BILLBOARD_EYE.muted);
    doc.text(`Adresse : ${panneau.localisation?.adresse || "Non renseignée"}`);
    doc.text(`GPS : ${formatGps(panneau.localisation?.latitude, panneau.localisation?.longitude)}`);
    doc.text(`Date : ${new Date(panneau.createdAt).toLocaleString("fr-FR")}`);
    doc.text(`Statut : ${isComplete ? "Complet" : "Incomplet"}`);
    doc.moveDown(1.2);

    const zoneName = panneau.localisation?.adresse || "Panneau";
    drawPhotoPair(doc, faceABuf, faceBBuf, zoneName, formatGps(panneau.localisation?.latitude, panneau.localisation?.longitude), accentColor);

    addFooter(doc, 2, 2, accentColor);
    doc.end();
  });
};

const createProjetPDFBuffer = async (report) => {
  const { projet, panneaux, summary } = report;
  const accentColor = projet.couleurPrincipale || BILLBOARD_EYE.accent;
  const reportTitle = projet.titreRapport || projet.nom || "Rapport Campagne";
  const zones = String(projet.zone || "")
    .split(/[;,/|]/)
    .map((v) => v.trim())
    .filter(Boolean);

  const imageBuffers = {};
  for (const p of panneaux) {
    const bufs = {};
    if (p.photos?.faceA?.url) bufs.faceA = await fetchImageAsBuffer(p.photos.faceA.url);
    if (p.photos?.faceB?.url) bufs.faceB = await fetchImageAsBuffer(p.photos.faceB.url);
    imageBuffers[p.id] = bufs;
  }
  const mapBuffer = await fetchStaticMapBuffer(panneaux);

  const totalPages = 3 + panneaux.length;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 0, size: "A4" });
    const chunks = [];
    let pageNum = 1;
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("error", reject);
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    // 1. Cover
    drawCoverPage(doc, reportTitle, projet.entreprise, accentColor);
    addFooter(doc, pageNum++, totalPages, accentColor);

    // 2. Stats + map
    doc.addPage({ margin: 0 });
    doc.fontSize(FONT_CAPTION).fillColor(BILLBOARD_EYE.muted).text(BILLBOARD_EYE.name.toUpperCase(), 0, MARGIN_Y - 10, { width: PAGE_WIDTH, align: "center" });
    doc.moveDown(0.5);
    drawStatsPage(doc, projet, summary, zones, mapBuffer, accentColor);
    addFooter(doc, pageNum++, totalPages, accentColor);

    // 3. Photos — 1 panneau par page
    panneaux.forEach((panneau, index) => {
      doc.addPage({ margin: 0 });
      doc.fontSize(FONT_CAPTION).fillColor(BILLBOARD_EYE.muted).text(BILLBOARD_EYE.name.toUpperCase(), 0, MARGIN_Y - 10, { width: PAGE_WIDTH, align: "center" });
      doc.moveDown(0.5);
      doc.y = MARGIN_Y;

      const zoneName = panneau.localisation?.adresse || `Zone ${index + 1}`;
      const bufs = imageBuffers[panneau.id] || {};
      drawPhotoPair(
        doc,
        bufs.faceA,
        bufs.faceB,
        `${index + 1}. ${zoneName}`,
        formatGps(panneau.localisation?.latitude, panneau.localisation?.longitude),
        accentColor
      );
      addFooter(doc, pageNum++, totalPages, accentColor);
    });

    // 4. Closing
    doc.addPage({ margin: 0 });
    drawClosingPage(doc, accentColor);
    addFooter(doc, pageNum, totalPages, accentColor);

    doc.end();
  });
};

const uploadPDFToSupabase = async (buffer, fileName) => {
  await ensurePdfBucketExists();
  const filePath = `rapports/${fileName}`;
  const { error: uploadError } = await supabase.storage.from(PDF_BUCKET).upload(filePath, buffer, {
    contentType: "application/pdf",
    upsert: true,
  });
  if (uploadError) throw new Error(`Erreur upload PDF: ${uploadError.message}`);
  const { data } = supabase.storage.from(PDF_BUCKET).getPublicUrl(filePath);
  if (!data?.publicUrl) throw new Error("Impossible de récupérer l'URL du PDF.");
  return `${data.publicUrl}?v=${Date.now()}`;
};

const savePanneauPdfUrlBestEffort = async (panneauId, url) => {
  try {
    await supabase.from("panneaux").update({ pdf_url: url }).eq("id", panneauId);
  } catch (_) {}
};

const generatePanneauPDF = async (rapport) => {
  const fileName = buildPdfFileName("panneau", rapport.panneau.id);
  const buffer = await createPanneauPDFBuffer(rapport);
  const url = await uploadPDFToSupabase(buffer, fileName);
  await savePanneauPdfUrlBestEffort(rapport.panneau.id, url);
  return { buffer, fileName, url };
};

const generateProjetPDF = async (report) => {
  const fileName = buildPdfFileName("projet", report.projet.id);
  const buffer = await createProjetPDFBuffer(report);
  const url = await uploadPDFToSupabase(buffer, fileName);
  return { buffer, fileName, url };
};

const diagnosePhotoLoad = async (report) => {
  const results = [];
  for (const p of report.panneaux || []) {
    const faceAUrl = p.photos?.faceA?.url;
    const faceBUrl = p.photos?.faceB?.url;
    const faceAResult = faceAUrl ? (await fetchImageAsBuffer(faceAUrl) ? "ok" : "fail") : "no_url";
    const faceBResult = faceBUrl ? (await fetchImageAsBuffer(faceBUrl) ? "ok" : "fail") : "no_url";
    results.push({
      panneauId: p.id,
      adresse: p.localisation?.adresse,
      faceA: { url: faceAUrl?.substring?.(0, 80), load: faceAResult },
      faceB: { url: faceBUrl?.substring?.(0, 80), load: faceBResult },
    });
  }
  return results;
};

module.exports = {
  buildPdfFileName,
  createPanneauPDFBuffer,
  createProjetPDFBuffer,
  uploadPDFToSupabase,
  generatePanneauPDF,
  generateProjetPDF,
  diagnosePhotoLoad,
};
