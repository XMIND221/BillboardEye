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

const BILLBOARD_EYE = {
  name: "BillboardEye",
  tagline: "Rapport premium généré par BillboardEye",
};

// 5 templates de rapport — palettes distinctes
const REPORT_TEMPLATES = {
  "1": { id: "1", name: "Begué", primary: "#1A237E", accent: "#2c7a7b", boxBg: "#E0F2F1", muted: "#64748B", border: "#E2E8F0" },
  "2": { id: "2", name: "Classique", primary: "#1E293B", accent: "#2563EB", boxBg: "#EFF6FF", muted: "#64748B", border: "#E2E8F0" },
  "3": { id: "3", name: "Élégant", primary: "#4C1D95", accent: "#B91C1C", boxBg: "#FEF3C7", muted: "#6B7280", border: "#E5E7EB" },
  "4": { id: "4", name: "Moderne", primary: "#0F172A", accent: "#EA580C", boxBg: "#FFF7ED", muted: "#64748B", border: "#E2E8F0" },
  "5": { id: "5", name: "Précis", primary: "#111827", accent: "#059669", boxBg: "#ECFDF5", muted: "#6B7280", border: "#D1FAE5" },
};

const getTemplate = (id) => {
  const key = String(id || "1");
  return REPORT_TEMPLATES[key] || REPORT_TEMPLATES["1"];
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
const FONT_SECTION = 20;
const FONT_SUBSECTION = 14;
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
  const pins = points.map((p) => `pin-l+00d4aa(${p.longitude},${p.latitude})`).join(",");
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

const addFooter = (doc, pageNum, totalPages, theme) => {
  const y = PAGE_HEIGHT - FOOTER_H + 14;
  doc.strokeColor(theme.border).lineWidth(0.3).moveTo(MARGIN_X, PAGE_HEIGHT - FOOTER_H).lineTo(PAGE_WIDTH - MARGIN_X, PAGE_HEIGHT - FOOTER_H).stroke();
  doc.fontSize(8).fillColor(theme.muted);
  doc.text(BILLBOARD_EYE.tagline, MARGIN_X, y);
  doc.text(totalPages ? `${pageNum} / ${totalPages}` : String(pageNum), PAGE_WIDTH - MARGIN_X - 40, y, { width: 40, align: "right" });
};

const BOX_WIDTH = 420;
const BOX_HEIGHT = 220;
const BOX_RADIUS = 24;

const drawCoverPage = (doc, reportTitle, clientName, theme, logos = {}, duree = "") => {
  doc.fillColor("#FFFFFF").rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT).fill();

  const boxX = (PAGE_WIDTH - BOX_WIDTH) / 2;
  const boxY = PAGE_HEIGHT / 2 - BOX_HEIGHT / 2 - 40;

  doc.fillColor(theme.boxBg);
  if (typeof doc.roundedRect === "function") {
    doc.roundedRect(boxX, boxY, BOX_WIDTH, BOX_HEIGHT, BOX_RADIUS).fill();
  } else {
    doc.rect(boxX, boxY, BOX_WIDTH, BOX_HEIGHT).fill();
  }

  doc.strokeColor(theme.accent).lineWidth(3).moveTo(boxX + 80, boxY + 50).lineTo(boxX + BOX_WIDTH - 80, boxY + 50).stroke();

  doc.y = boxY + 70;
  doc.fillColor(theme.primary).fontSize(28).font("Helvetica-Bold").text((reportTitle || "").toUpperCase(), boxX, doc.y, { width: BOX_WIDTH, align: "center" });
  doc.y += 28;
  doc.font("Helvetica").fontSize(14).fillColor(theme.primary).text(`Client : ${clientName || "-"}`, { width: PAGE_WIDTH, align: "center" });
  if (duree) {
    doc.y += 18;
    doc.font("Helvetica").fontSize(13).fillColor(theme.accent).text(`Durée ${duree}`, { width: PAGE_WIDTH, align: "center" });
  }

  doc.y = PAGE_HEIGHT - FOOTER_H - 30;
  doc.fontSize(9).fillColor(theme.muted).text(BILLBOARD_EYE.tagline, { width: PAGE_WIDTH, align: "center" });
};

const drawStatsPage = (doc, projet, summary, zones, mapBuffer, theme) => {
  doc.fillColor("#FFFFFF").rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT).fill();
  doc.y = MARGIN_Y;
  doc.fontSize(FONT_SECTION).font("Helvetica-Bold").fillColor(theme.primary).text("Résultats terrain", MARGIN_X, doc.y);
  doc.y += 8;
  doc.strokeColor(theme.accent).lineWidth(2).moveTo(MARGIN_X, doc.y).lineTo(MARGIN_X + 100, doc.y).stroke();
  doc.y += 28;

  const statW = (CONTENT_WIDTH - 32) / 3;
  const statH = 82;
  const stats = [
    { label: "Total panneaux", value: String(summary.total) },
    { label: "Complétés", value: String(summary.completed) },
    { label: "Restants", value: String(summary.remaining) },
  ];
  stats.forEach((s, i) => {
    const x = MARGIN_X + i * (statW + 16);
    doc.fillColor("#FFFFFF").rect(x + 2, doc.y + 2, statW, statH).fill();
    doc.rect(x, doc.y, statW, statH).strokeColor(theme.border).lineWidth(0.5).stroke();
    doc.fontSize(38).font("Helvetica-Bold").fillColor(theme.accent).text(s.value, x, doc.y + 18, { width: statW, align: "center" });
    doc.fontSize(FONT_CAPTION).fillColor(theme.primary).text(s.label, x, doc.y + 62, { width: statW, align: "center" });
  });
  doc.y += statH + 28;

  const gridY = doc.y;
  const leftCol = MARGIN_X;
  const rightCol = MARGIN_X + CONTENT_WIDTH / 2;
  const rowH = 22;
  const gridRows = [
    { l: "Client", r: projet.entreprise || "-" },
    { l: "Campagne", r: projet.nom || "-" },
    { l: "Durée", r: projet.duree || "Non renseignée" },
    { l: "Zones", r: String(zones.length) },
    { l: "Date", r: projet.date ? new Date(projet.date).toLocaleDateString("fr-FR") : "N/A" },
    { l: "Agent", r: projet.assignedAgent || "Non assigné" },
  ];
  gridRows.forEach((row, i) => {
    const y = gridY + i * rowH;
    doc.strokeColor(theme.border).lineWidth(0.3).moveTo(MARGIN_X, y).lineTo(MARGIN_X + CONTENT_WIDTH, y).stroke();
    doc.fontSize(FONT_BODY).fillColor(theme.muted).text(row.l, leftCol, y + 4);
    doc.fillColor(theme.primary).text(row.r, rightCol, y + 4, { width: CONTENT_WIDTH / 2 - 10 });
  });
  doc.y = gridY + gridRows.length * rowH + 20;

  if (projet.instructions) {
    doc.fontSize(FONT_SUBSECTION).font("Helvetica-Bold").fillColor(theme.primary).text("Instructions terrain", MARGIN_X, doc.y);
    doc.y += 6;
    doc.strokeColor(theme.accent).lineWidth(0.5).moveTo(MARGIN_X, doc.y).lineTo(MARGIN_X + 60, doc.y).stroke();
    doc.y += 20;
    doc.fontSize(FONT_BODY).fillColor(theme.muted);
    const instrH = doc.heightOfString(projet.instructions, { width: CONTENT_WIDTH });
    doc.text(projet.instructions, MARGIN_X, doc.y, { width: CONTENT_WIDTH });
    doc.y += instrH + 24;
  }

  if (mapBuffer) {
    doc.fontSize(FONT_SUBSECTION).font("Helvetica-Bold").fillColor(theme.primary).text("Zones couvertes", MARGIN_X, doc.y);
    doc.y += 6;
    doc.strokeColor(theme.accent).lineWidth(0.5).moveTo(MARGIN_X, doc.y).lineTo(MARGIN_X + 60, doc.y).stroke();
    doc.y += 24;
    doc.rect(MARGIN_X, doc.y, CONTENT_WIDTH, MAP_HEIGHT).strokeColor("#CBD5E1").lineWidth(0.3).stroke();
    doc.image(mapBuffer, MARGIN_X + 2, doc.y + 2, { width: CONTENT_WIDTH - 4, height: MAP_HEIGHT - 4 });
    doc.y += MAP_HEIGHT + 12;
  } else if (zones.length > 0) {
    doc.fontSize(FONT_SUBSECTION).font("Helvetica-Bold").fillColor(theme.primary).text("Zones couvertes", MARGIN_X, doc.y);
    doc.y += 6;
    doc.strokeColor(theme.accent).lineWidth(0.5).moveTo(MARGIN_X, doc.y).lineTo(MARGIN_X + 60, doc.y).stroke();
    doc.y += 24;
    doc.rect(MARGIN_X, doc.y, CONTENT_WIDTH, 120).strokeColor("#E2E8F0").lineWidth(0.5).stroke();
    doc.fontSize(FONT_BODY).fillColor(BILLBOARD_EYE.muted).text("Carte non disponible.", MARGIN_X + 16, doc.y + 24, { width: CONTENT_WIDTH - 32, align: "center" });
    doc.fontSize(FONT_CAPTION).fillColor(BILLBOARD_EYE.muted).text(`Zones : ${zones.join(" · ")}`, MARGIN_X + 16, doc.y + 70, { width: CONTENT_WIDTH - 32, align: "center" });
    doc.y += 132;
  }
};

const drawPhotoPair = (doc, faceABuf, faceBBuf, zoneName, gps, theme, observationsA = "", observationsB = "") => {
  doc.fillColor("#FFFFFF").rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT).fill();
  doc.y = MARGIN_Y;

  doc.fontSize(22).font("Helvetica-Bold").fillColor(theme.primary).text("Panneau page", MARGIN_X, doc.y);
  doc.y += 28;

  const zoneY = doc.y;
  doc.fontSize(10).font("Helvetica-Bold").fillColor(theme.primary).text("NOM DE LA ZONE :", MARGIN_X, zoneY);
  doc.fontSize(10).font("Helvetica-Bold").fillColor(theme.primary).text("COORDONNÉES GPS", MARGIN_X + CONTENT_WIDTH / 2, zoneY);
  doc.y = zoneY + 14;
  doc.fontSize(16).font("Helvetica-Bold").fillColor(theme.primary).text(zoneName, MARGIN_X, doc.y);
  doc.fontSize(FONT_BODY).fillColor(theme.primary).text(`[${gps}]`, MARGIN_X + CONTENT_WIDTH / 2, doc.y, { width: CONTENT_WIDTH / 2 - 20 });
  doc.y += 6;
  doc.strokeColor(theme.accent).lineWidth(2).moveTo(MARGIN_X, doc.y).lineTo(MARGIN_X + 220, doc.y).stroke();
  doc.y += 24;

  const halfW = (CONTENT_WIDTH - IMG_GAP) / 2;
  const imgW = Math.min(IMG_SIZE, halfW - 8);
  const imgH = (imgW * 3) / 4;
  const framePad = 8;
  const startY = doc.y;
  const leftX = MARGIN_X;
  const rightX = MARGIN_X + halfW + IMG_GAP;

  doc.fontSize(12).font("Helvetica-Bold").fillColor(theme.primary).text("FACE A", leftX, startY - 20, { width: halfW, align: "center" });
  doc.fontSize(12).font("Helvetica-Bold").fillColor(theme.primary).text("FACE B", rightX, startY - 20, { width: halfW, align: "center" });

  const drawPhotoFrame = (x, buf, label) => {
    doc.strokeColor(theme.accent).lineWidth(1.5).rect(x, startY, imgW + framePad * 2, imgH + framePad * 2).stroke();
    if (buf) {
      doc.image(buf, x + framePad, startY + framePad, { width: imgW, height: imgH });
    } else {
      doc.fillColor("#F1F5F9").rect(x + framePad, startY + framePad, imgW, imgH).fill();
      doc.fontSize(FONT_CAPTION).fillColor(theme.muted).text(`[Insérer photo ${label} ici]`, x, startY + imgH / 2 + framePad - 6, { width: imgW + framePad * 2, align: "center" });
    }
  };

  drawPhotoFrame(leftX, faceABuf, "Face A");
  drawPhotoFrame(rightX, faceBBuf, "Face B");

  doc.y = startY + imgH + framePad * 2 + 28;

  doc.fontSize(10).font("Helvetica-Bold").fillColor(theme.primary).text("Observations / Notes - Face A :", leftX, doc.y);
  doc.y += 14;
  doc.strokeColor(theme.border).lineWidth(0.3).moveTo(leftX, doc.y).lineTo(leftX + halfW, doc.y).stroke();
  doc.y += 12;
  doc.strokeColor(theme.border).lineWidth(0.3).moveTo(leftX, doc.y).lineTo(leftX + halfW, doc.y).stroke();
  doc.y += 12;
  doc.strokeColor(theme.border).lineWidth(0.3).moveTo(leftX, doc.y).lineTo(leftX + halfW, doc.y).stroke();
  if (observationsA) doc.fontSize(FONT_BODY).fillColor(theme.primary).text(observationsA, leftX, doc.y - 24, { width: halfW - 4 });

  doc.y = startY + imgH + framePad * 2 + 28;
  doc.fontSize(10).font("Helvetica-Bold").fillColor(theme.primary).text("Observations / Notes - Face B :", rightX, doc.y);
  doc.y += 14;
  doc.strokeColor(theme.border).lineWidth(0.3).moveTo(rightX, doc.y).lineTo(rightX + halfW, doc.y).stroke();
  doc.y += 12;
  doc.strokeColor(theme.border).lineWidth(0.3).moveTo(rightX, doc.y).lineTo(rightX + halfW, doc.y).stroke();
  doc.y += 12;
  doc.strokeColor(theme.border).lineWidth(0.3).moveTo(rightX, doc.y).lineTo(rightX + halfW, doc.y).stroke();
  if (observationsB) doc.fontSize(FONT_BODY).fillColor(theme.primary).text(observationsB, rightX, doc.y - 24, { width: halfW - 4 });

  doc.y = startY + imgH + framePad * 2 + 90;
};


const createPanneauPDFBuffer = async (rapport, templateId = "1") => {
  const { panneau, photos } = rapport;
  const [faceABuf, faceBBuf] = await Promise.all([
    photos?.faceA?.url ? fetchImageAsBuffer(photos.faceA.url) : null,
    photos?.faceB?.url ? fetchImageAsBuffer(photos.faceB.url) : null,
  ]);
  const theme = getTemplate(templateId);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 0, size: "A4" });
    doc.info.Title = "Rapport Panneau - BillboardEye";
    doc.info.Author = BILLBOARD_EYE.name;
    doc.info.CreationDate = new Date();
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("error", reject);
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    drawCoverPage(doc, "Rapport Panneau", panneau.entreprise, theme, {}, "");
    addFooter(doc, 1, 2, theme);

    doc.addPage({ margin: 0 });
    const zoneName = panneau.localisation?.adresse || "Panneau";
    drawPhotoPair(doc, faceABuf, faceBBuf, zoneName, formatGps(panneau.localisation?.latitude, panneau.localisation?.longitude), theme, "", "");

    addFooter(doc, 2, 2, theme);
    doc.end();
  });
};

const createProjetPDFBuffer = async (report, templateId = "1") => {
  const { projet, panneaux, summary } = report;
  const theme = getTemplate(templateId);
  const reportTitle = projet.titreRapport || projet.nom || "Rapport Campagne";
  const zones = String(projet.zone || "")
    .split(/[;,/|]/)
    .map((v) => v.trim())
    .filter(Boolean);

  const [logoBuffers, imageBuffersMap, mapBuffer] = await Promise.all([
    Promise.all([
      projet.clientLogoUrl ? fetchImageAsBuffer(projet.clientLogoUrl) : null,
      projet.entrepriseLogoUrl ? fetchImageAsBuffer(projet.entrepriseLogoUrl) : null,
    ]),
    Promise.all(
      panneaux.map(async (p) => {
        const [faceA, faceB] = await Promise.all([
          p.photos?.faceA?.url ? fetchImageAsBuffer(p.photos.faceA.url) : null,
          p.photos?.faceB?.url ? fetchImageAsBuffer(p.photos.faceB.url) : null,
        ]);
        return { id: p.id, faceA, faceB };
      })
    ),
    fetchStaticMapBuffer(panneaux),
  ]);
  const imageBuffers = {};
  for (const item of imageBuffersMap) {
    imageBuffers[item.id] = { faceA: item.faceA, faceB: item.faceB };
  }
  const logos = {
    client: logoBuffers[0] || null,
    entreprise: logoBuffers[1] || null,
  };

  const totalPages = 2 + panneaux.length;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 0, size: "A4" });
    doc.info.Title = reportTitle;
    doc.info.Author = BILLBOARD_EYE.name;
    doc.info.CreationDate = new Date();
    doc.info.Subject = `Rapport campagne ${projet.entreprise}`;
    const chunks = [];
    let pageNum = 1;
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("error", reject);
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    // 1. Couverture
    drawCoverPage(doc, reportTitle, projet.entreprise, theme, logos, projet.duree || "");
    addFooter(doc, pageNum++, totalPages, theme);

    // 2. Résultats terrain
    doc.addPage({ margin: 0 });
    drawStatsPage(doc, projet, summary, zones, mapBuffer, theme);
    addFooter(doc, pageNum++, totalPages, theme);

    // 3+. Panneaux — 1 page par panneau
    panneaux.forEach((panneau, index) => {
      doc.addPage({ margin: 0 });
      const zoneName = panneau.localisation?.adresse || `Zone ${index + 1}`;
      const bufs = imageBuffers[panneau.id] || {};
      const obsA = panneau.observationsFaceA || "";
      const obsB = panneau.observationsFaceB || "";
      drawPhotoPair(
        doc,
        bufs.faceA,
        bufs.faceB,
        `${index + 1}. ${zoneName}`,
        formatGps(panneau.localisation?.latitude, panneau.localisation?.longitude),
        theme,
        obsA,
        obsB
      );
      addFooter(doc, pageNum++, totalPages, theme);
    });

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

const generateProjetPDF = async (report, options = {}) => {
  const templateId = options.template || "1";
  const fileName = buildPdfFileName("projet", report.projet.id);
  const buffer = await createProjetPDFBuffer(report, templateId);
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
  REPORT_TEMPLATES,
  getTemplate,
};
