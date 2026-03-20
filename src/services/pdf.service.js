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

// 10 templates de rapport — palette + layout
const REPORT_TEMPLATES = {
  "1": { id: "1", name: "Begué Neo", primary: "#1A237E", accent: "#2C7A7B", boxBg: "#E0F2F1", muted: "#64748B", border: "#E2E8F0", coverLayout: "centerCard", statsLayout: "cardsGrid", panelLayout: "dualClassic" },
  "2": { id: "2", name: "Corporate Grid", primary: "#1E293B", accent: "#2563EB", boxBg: "#EFF6FF", muted: "#64748B", border: "#E2E8F0", coverLayout: "leftBanner", statsLayout: "tableCompact", panelLayout: "dualClassic" },
  "3": { id: "3", name: "Editorial", primary: "#3F3F46", accent: "#7C3AED", boxBg: "#F5F3FF", muted: "#71717A", border: "#E4E4E7", coverLayout: "splitHero", statsLayout: "sidebarKpi", panelLayout: "stacked" },
  "4": { id: "4", name: "Field Ops", primary: "#111827", accent: "#EA580C", boxBg: "#FFF7ED", muted: "#6B7280", border: "#FED7AA", coverLayout: "topRibbon", statsLayout: "cardsGrid", panelLayout: "heroAthenB" },
  "5": { id: "5", name: "Precision Green", primary: "#0F172A", accent: "#059669", boxBg: "#ECFDF5", muted: "#6B7280", border: "#A7F3D0", coverLayout: "centerCard", statsLayout: "sidebarKpi", panelLayout: "dualClassic" },
  "6": { id: "6", name: "Night Pulse", primary: "#E5E7EB", accent: "#22D3EE", boxBg: "#1F2937", muted: "#9CA3AF", border: "#374151", coverLayout: "leftBanner", statsLayout: "cardsGrid", panelLayout: "stacked" },
  "7": { id: "7", name: "Ivory Premium", primary: "#312E81", accent: "#DC2626", boxBg: "#FFFBEB", muted: "#78716C", border: "#F5E6B3", coverLayout: "splitHero", statsLayout: "tableCompact", panelLayout: "heroAthenB" },
  "8": { id: "8", name: "Urban Mint", primary: "#134E4A", accent: "#0EA5E9", boxBg: "#F0FDFA", muted: "#475569", border: "#99F6E4", coverLayout: "topRibbon", statsLayout: "sidebarKpi", panelLayout: "dualClassic" },
  "9": { id: "9", name: "Bold Agency", primary: "#18181B", accent: "#E11D48", boxBg: "#FFF1F2", muted: "#71717A", border: "#FECDD3", coverLayout: "leftBanner", statsLayout: "cardsGrid", panelLayout: "heroAthenB" },
  "10": { id: "10", name: "Atlas Clean", primary: "#0C4A6E", accent: "#16A34A", boxBg: "#F0F9FF", muted: "#64748B", border: "#BAE6FD", coverLayout: "splitHero", statsLayout: "tableCompact", panelLayout: "stacked" },
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

const buildPdfFileName = (type, id, suffix = "") => {
  const base = type === "projet" ? `rapport-projet-${id}` : `rapport-panneau-${id}`;
  return `${base}${suffix ? `-${suffix}` : ""}.pdf`;
};

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

  const title = (reportTitle || "").toUpperCase();
  const layout = theme.coverLayout || "centerCard";
  const boxX = (PAGE_WIDTH - BOX_WIDTH) / 2;
  const boxY = PAGE_HEIGHT / 2 - BOX_HEIGHT / 2 - 40;

  if (layout === "leftBanner") {
    doc.fillColor(theme.accent).rect(0, 0, 54, PAGE_HEIGHT).fill();
    doc.fillColor(theme.boxBg).rect(70, 90, PAGE_WIDTH - 120, 320).fill();
    doc.strokeColor(theme.border).lineWidth(1).rect(70, 90, PAGE_WIDTH - 120, 320).stroke();
    doc.fillColor(theme.primary).fontSize(36).font("Helvetica-Bold").text(title, 94, 170, { width: PAGE_WIDTH - 180 });
    doc.font("Helvetica").fontSize(16).fillColor(theme.muted).text(`Client : ${clientName || "-"}`, 94, 280);
    if (duree) doc.font("Helvetica-Bold").fontSize(13).fillColor(theme.accent).text(`Durée ${duree}`, 94, 312);
  } else if (layout === "splitHero") {
    doc.fillColor(theme.boxBg).rect(0, 0, PAGE_WIDTH * 0.42, PAGE_HEIGHT).fill();
    doc.fillColor(theme.accent).rect(PAGE_WIDTH * 0.42 - 4, 0, 8, PAGE_HEIGHT).fill();
    doc.fillColor(theme.primary).fontSize(30).font("Helvetica-Bold").text(title, PAGE_WIDTH * 0.46, 240, { width: PAGE_WIDTH * 0.46 });
    doc.font("Helvetica").fontSize(14).fillColor(theme.muted).text(`Client : ${clientName || "-"}`, PAGE_WIDTH * 0.46, 330, { width: PAGE_WIDTH * 0.46 });
    if (duree) doc.font("Helvetica-Bold").fontSize(13).fillColor(theme.accent).text(`Durée ${duree}`, PAGE_WIDTH * 0.46, 360, { width: PAGE_WIDTH * 0.46 });
  } else if (layout === "topRibbon") {
    doc.fillColor(theme.boxBg).rect(0, 0, PAGE_WIDTH, 220).fill();
    doc.fillColor(theme.accent).rect(0, 0, PAGE_WIDTH, 18).fill();
    doc.strokeColor(theme.accent).lineWidth(2).moveTo(90, 250).lineTo(PAGE_WIDTH - 90, 250).stroke();
    doc.fillColor(theme.primary).fontSize(34).font("Helvetica-Bold").text(title, 70, 290, { width: PAGE_WIDTH - 140, align: "center" });
    doc.font("Helvetica").fontSize(15).fillColor(theme.muted).text(`Client : ${clientName || "-"}`, 70, 380, { width: PAGE_WIDTH - 140, align: "center" });
    if (duree) doc.font("Helvetica-Bold").fontSize(13).fillColor(theme.accent).text(`Durée ${duree}`, 70, 410, { width: PAGE_WIDTH - 140, align: "center" });
  } else {
    doc.fillColor(theme.boxBg);
    if (typeof doc.roundedRect === "function") {
      doc.roundedRect(boxX, boxY, BOX_WIDTH, BOX_HEIGHT, BOX_RADIUS).fill();
    } else {
      doc.rect(boxX, boxY, BOX_WIDTH, BOX_HEIGHT).fill();
    }
    doc.strokeColor(theme.accent).lineWidth(3).moveTo(boxX + 80, boxY + 50).lineTo(boxX + BOX_WIDTH - 80, boxY + 50).stroke();
    doc.y = boxY + 70;
    doc.fillColor(theme.primary).fontSize(28).font("Helvetica-Bold").text(title, boxX, doc.y, { width: BOX_WIDTH, align: "center" });
    doc.y += 28;
    doc.font("Helvetica").fontSize(14).fillColor(theme.primary).text(`Client : ${clientName || "-"}`, { width: PAGE_WIDTH, align: "center" });
    if (duree) {
      doc.y += 18;
      doc.font("Helvetica").fontSize(13).fillColor(theme.accent).text(`Durée ${duree}`, { width: PAGE_WIDTH, align: "center" });
    }
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

  const stats = [
    { label: "Total panneaux", value: String(summary.total) },
    { label: "Complétés", value: String(summary.completed) },
    { label: "Restants", value: String(summary.remaining) },
  ];
  const statsLayout = theme.statsLayout || "cardsGrid";
  if (statsLayout === "tableCompact") {
    const rowY = doc.y;
    doc.fillColor(theme.boxBg).rect(MARGIN_X, rowY, CONTENT_WIDTH, 92).fill();
    doc.strokeColor(theme.border).lineWidth(0.7).rect(MARGIN_X, rowY, CONTENT_WIDTH, 92).stroke();
    const cellW = CONTENT_WIDTH / 3;
    stats.forEach((s, i) => {
      const x = MARGIN_X + i * cellW;
      if (i > 0) doc.strokeColor(theme.border).lineWidth(0.5).moveTo(x, rowY).lineTo(x, rowY + 92).stroke();
      doc.font("Helvetica-Bold").fontSize(34).fillColor(theme.accent).text(s.value, x, rowY + 20, { width: cellW, align: "center" });
      doc.font("Helvetica").fontSize(11).fillColor(theme.primary).text(s.label, x, rowY + 63, { width: cellW, align: "center" });
    });
    doc.y += 110;
  } else if (statsLayout === "sidebarKpi") {
    const sidebarX = PAGE_WIDTH - MARGIN_X - 140;
    const baseY = doc.y;
    stats.forEach((s, i) => {
      const y = baseY + i * 88;
      doc.fillColor(theme.boxBg).rect(sidebarX, y, 140, 76).fill();
      doc.strokeColor(theme.border).lineWidth(0.6).rect(sidebarX, y, 140, 76).stroke();
      doc.font("Helvetica-Bold").fontSize(30).fillColor(theme.accent).text(s.value, sidebarX, y + 12, { width: 140, align: "center" });
      doc.font("Helvetica").fontSize(10).fillColor(theme.primary).text(s.label, sidebarX, y + 52, { width: 140, align: "center" });
    });
    doc.font("Helvetica").fontSize(12).fillColor(theme.muted).text("KPI", MARGIN_X, baseY + 6);
    doc.y = baseY + 270;
  } else {
    const statW = (CONTENT_WIDTH - 32) / 3;
    const statH = 82;
    stats.forEach((s, i) => {
      const x = MARGIN_X + i * (statW + 16);
      doc.fillColor("#FFFFFF").rect(x + 2, doc.y + 2, statW, statH).fill();
      doc.rect(x, doc.y, statW, statH).strokeColor(theme.border).lineWidth(0.5).stroke();
      doc.fontSize(38).font("Helvetica-Bold").fillColor(theme.accent).text(s.value, x, doc.y + 18, { width: statW, align: "center" });
      doc.fontSize(FONT_CAPTION).fillColor(theme.primary).text(s.label, x, doc.y + 62, { width: statW, align: "center" });
    });
    doc.y += statH + 28;
  }

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
    doc.fontSize(FONT_BODY).fillColor(theme.muted).text("Carte non disponible.", MARGIN_X + 16, doc.y + 24, { width: CONTENT_WIDTH - 32, align: "center" });
    doc.fontSize(FONT_CAPTION).fillColor(theme.muted).text(`Zones : ${zones.join(" · ")}`, MARGIN_X + 16, doc.y + 70, { width: CONTENT_WIDTH - 32, align: "center" });
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

  const panelLayout = theme.panelLayout || "dualClassic";
  const drawNoteLines = (x, y, width) => {
    doc.strokeColor(theme.border).lineWidth(0.3).moveTo(x, y).lineTo(x + width, y).stroke();
    doc.moveTo(x, y + 12).lineTo(x + width, y + 12).stroke();
    doc.moveTo(x, y + 24).lineTo(x + width, y + 24).stroke();
  };

  if (panelLayout === "stacked") {
    const frameW = CONTENT_WIDTH - 20;
    const frameH = 170;
    const leftX = MARGIN_X + 10;
    const startY = doc.y;
    const drawStackFrame = (buf, label, y) => {
      doc.fontSize(11).font("Helvetica-Bold").fillColor(theme.primary).text(label, leftX, y - 16);
      doc.strokeColor(theme.accent).lineWidth(1.2).rect(leftX, y, frameW, frameH).stroke();
      if (buf) {
        doc.image(buf, leftX + 6, y + 6, { width: frameW - 12, height: frameH - 12 });
      } else {
        doc.fillColor("#F8FAFC").rect(leftX + 6, y + 6, frameW - 12, frameH - 12).fill();
      }
    };
    drawStackFrame(faceABuf, "FACE A", startY);
    drawStackFrame(faceBBuf, "FACE B", startY + frameH + 30);
    const notesY = startY + frameH * 2 + 70;
    doc.fontSize(10).font("Helvetica-Bold").fillColor(theme.primary).text("Observations", leftX, notesY);
    drawNoteLines(leftX, notesY + 14, frameW);
  } else if (panelLayout === "heroAthenB") {
    const topY = doc.y;
    const heroW = CONTENT_WIDTH;
    const heroH = 210;
    doc.fontSize(12).font("Helvetica-Bold").fillColor(theme.primary).text("FACE A (PRINCIPALE)", MARGIN_X, topY - 18);
    doc.strokeColor(theme.accent).lineWidth(1.6).rect(MARGIN_X, topY, heroW, heroH).stroke();
    if (faceABuf) {
      doc.image(faceABuf, MARGIN_X + 8, topY + 8, { width: heroW - 16, height: heroH - 16 });
    }
    const secondY = topY + heroH + 36;
    doc.fontSize(12).font("Helvetica-Bold").fillColor(theme.primary).text("FACE B", MARGIN_X, secondY - 18);
    doc.strokeColor(theme.accent).lineWidth(1.2).rect(MARGIN_X, secondY, CONTENT_WIDTH * 0.58, 125).stroke();
    if (faceBBuf) {
      doc.image(faceBBuf, MARGIN_X + 6, secondY + 6, { width: CONTENT_WIDTH * 0.58 - 12, height: 113 });
    }
    const notesX = MARGIN_X + CONTENT_WIDTH * 0.62;
    doc.fontSize(10).font("Helvetica-Bold").fillColor(theme.primary).text("Notes", notesX, secondY);
    drawNoteLines(notesX, secondY + 18, CONTENT_WIDTH * 0.38);
  } else {
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
    drawNoteLines(leftX, doc.y + 14, halfW);
    doc.fontSize(10).font("Helvetica-Bold").fillColor(theme.primary).text("Observations / Notes - Face B :", rightX, doc.y);
    drawNoteLines(rightX, doc.y + 14, halfW);
  }
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

  const [logoBuffers, mapBuffer] = await Promise.all([
    Promise.all([
      projet.clientLogoUrl ? fetchImageAsBuffer(projet.clientLogoUrl) : null,
      projet.entrepriseLogoUrl ? fetchImageAsBuffer(projet.entrepriseLogoUrl) : null,
    ]),
    fetchStaticMapBuffer(panneaux),
  ]);
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

    const render = async () => {
      // 1. Couverture
      drawCoverPage(doc, reportTitle, projet.entreprise, theme, logos, projet.duree || "");
      addFooter(doc, pageNum++, totalPages, theme);

      // 2. Résultats terrain
      doc.addPage({ margin: 0 });
      drawStatsPage(doc, projet, summary, zones, mapBuffer, theme);
      addFooter(doc, pageNum++, totalPages, theme);

      // 3+. Panneaux — traitement progressif pour 100+ panneaux
      for (let index = 0; index < panneaux.length; index += 1) {
        const panneau = panneaux[index];
        const [faceA, faceB] = await Promise.all([
          panneau.photos?.faceA?.url ? fetchImageAsBuffer(panneau.photos.faceA.url) : null,
          panneau.photos?.faceB?.url ? fetchImageAsBuffer(panneau.photos.faceB.url) : null,
        ]);
        doc.addPage({ margin: 0 });
        const zoneName = panneau.localisation?.adresse || `Zone ${index + 1}`;
        const obsA = panneau.observationsFaceA || "";
        const obsB = panneau.observationsFaceB || "";
        drawPhotoPair(
          doc,
          faceA,
          faceB,
          `${index + 1}. ${zoneName}`,
          formatGps(panneau.localisation?.latitude, panneau.localisation?.longitude),
          theme,
          obsA,
          obsB
        );
        addFooter(doc, pageNum++, totalPages, theme);
      }
    };

    render().then(() => doc.end()).catch(reject);
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

const generatePanneauPDF = async (rapport, options = {}) => {
  const suffix = options.suffix || "";
  const fileName = options.fileName || buildPdfFileName("panneau", rapport.panneau.id, suffix);
  const buffer = await createPanneauPDFBuffer(rapport);
  const url = await uploadPDFToSupabase(buffer, fileName);
  await savePanneauPdfUrlBestEffort(rapport.panneau.id, url);
  return { buffer, fileName, url };
};

const generateProjetPDF = async (report, options = {}) => {
  const templateId = options.template || "1";
  const suffix = options.suffix || "";
  const fileName = options.fileName || buildPdfFileName("projet", report.projet.id, suffix);
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
