const PDFDocument = require("pdfkit");
const supabase = require("../config/supabase");
const puppeteer = require("puppeteer");
const fetch = typeof globalThis.fetch === "function" ? globalThis.fetch : require("node-fetch");
const { fetchImageAsBuffer } = require("./report-media.service");
const { renderProjetReportHtmlFromTemplate } = require("./report-template.service");

const PDF_BUCKET = process.env.PDF_BUCKET_NAME || "panneaux-pdf";
const MAPBOX_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;
const DEBUG_PDF = process.env.DEBUG_PDF === "true";

const BILLBOARD_EYE = {
  name: "BillboardEye",
  tagline: "Rapport premium généré par BillboardEye",
};

const REPORT_THEME = {
  primary: "#111827",
  accent: "#E11D48",
  boxBg: "#F3F4F6",
  muted: "#6B7280",
  border: "#E5E7EB",
  softBg: "#FAFAFA",
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
  const boxX = (PAGE_WIDTH - BOX_WIDTH) / 2;
  const boxY = PAGE_HEIGHT / 2 - BOX_HEIGHT / 2 - 40;

  doc.fillColor(theme.accent).rect(0, 0, PAGE_WIDTH, 12).fill();
  doc.fillColor(theme.boxBg).rect(MARGIN_X, 120, CONTENT_WIDTH, 2).fill();

  doc.fillColor(theme.boxBg);
  if (typeof doc.roundedRect === "function") {
    doc.roundedRect(boxX, boxY, BOX_WIDTH, BOX_HEIGHT, BOX_RADIUS).fill();
  } else {
    doc.rect(boxX, boxY, BOX_WIDTH, BOX_HEIGHT).fill();
  }
  doc.strokeColor(theme.border).lineWidth(1).roundedRect(boxX, boxY, BOX_WIDTH, BOX_HEIGHT, BOX_RADIUS).stroke();
  doc.strokeColor(theme.accent).lineWidth(3).moveTo(boxX + 80, boxY + 50).lineTo(boxX + BOX_WIDTH - 80, boxY + 50).stroke();
  doc.y = boxY + 70;
  doc.fillColor(theme.primary).fontSize(26).font("Helvetica-Bold").text(title, boxX, doc.y, { width: BOX_WIDTH, align: "center" });
  doc.y += 28;
  doc.font("Helvetica").fontSize(14).fillColor(theme.primary).text(`Client : ${clientName || "-"}`, { width: PAGE_WIDTH, align: "center" });
  if (duree) {
    doc.y += 16;
    doc.font("Helvetica").fontSize(13).fillColor(theme.accent).text(`Durée ${duree}`, { width: PAGE_WIDTH, align: "center" });
  }

  doc.y = PAGE_HEIGHT - FOOTER_H - 30;
  doc.fontSize(9).fillColor(theme.muted).text(BILLBOARD_EYE.tagline, { width: PAGE_WIDTH, align: "center" });
};

const drawStatsPage = (doc, projet, summary, zones, mapBuffer, theme) => {
  doc.fillColor(theme.softBg).rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT).fill();
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
  doc.fillColor(theme.accent).rect(0, 0, PAGE_WIDTH, 6).fill();
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

  const drawNoteLines = (x, y, width) => {
    doc.strokeColor(theme.border).lineWidth(0.3).moveTo(x, y).lineTo(x + width, y).stroke();
    doc.moveTo(x, y + 12).lineTo(x + width, y + 12).stroke();
    doc.moveTo(x, y + 24).lineTo(x + width, y + 24).stroke();
  };

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
};

const drawClosingPage = (doc, projet, theme) => {
  doc.fillColor("#FFFFFF").rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT).fill();
  doc.fillColor(theme.accent).rect(0, 0, PAGE_WIDTH, 14).fill();
  doc.fillColor(theme.boxBg).rect(MARGIN_X, 180, CONTENT_WIDTH, 260).fill();
  doc.strokeColor(theme.border).lineWidth(1).rect(MARGIN_X, 180, CONTENT_WIDTH, 260).stroke();

  doc.font("Helvetica-Bold").fontSize(34).fillColor(theme.accent).text("BILLBOARDEYE", MARGIN_X, 250, {
    width: CONTENT_WIDTH,
    align: "center",
  });
  doc.font("Helvetica").fontSize(15).fillColor(theme.primary).text("Merci pour votre confiance.", MARGIN_X, 304, {
    width: CONTENT_WIDTH,
    align: "center",
  });
  doc.font("Helvetica").fontSize(12).fillColor(theme.muted).text(`Client: ${projet?.entreprise || "-"}`, MARGIN_X, 338, {
    width: CONTENT_WIDTH,
    align: "center",
  });
  doc.font("Helvetica").fontSize(10).fillColor(theme.muted).text(BILLBOARD_EYE.tagline, MARGIN_X, 400, {
    width: CONTENT_WIDTH,
    align: "center",
  });
};

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const inferMimeType = (buffer) => {
  if (!buffer || buffer.length < 4) return "image/jpeg";
  const h = buffer.subarray(0, 4).toString("hex");
  if (h.startsWith("89504e47")) return "image/png";
  if (h.startsWith("47494638")) return "image/gif";
  if (h.startsWith("ffd8")) return "image/jpeg";
  return "image/jpeg";
};

const toDataUri = (buffer) => {
  if (!buffer) return "";
  return `data:${inferMimeType(buffer)};base64,${buffer.toString("base64")}`;
};

const formatReportDate = (date) => {
  if (!date) return "Non renseignée";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return String(date);
  return d.toLocaleDateString("fr-FR");
};

const formatTime = (raw) => {
  if (!raw) return "--:--";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "--:--";
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
};

const buildProjetReportHtml = ({ projet, summary, zonesCount, zonesHtml, visualDataUri }) => {
  const rawColor = projet?.couleurPrincipale;
  const primaryCss =
    rawColor && /^#[0-9A-Fa-f]{3}([0-9A-Fa-f]{3})?$/.test(String(rawColor).trim())
      ? String(rawColor).trim()
      : "#e11d48";
  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(projet.titreRapport || projet.nom || "Rapport Campagne")}</title>
  <style>
    :root {
      --primary: ${primaryCss};
      --bg: #ffffff;
      --secondary: #f9fafb;
      --muted: #6b7280;
      --border: #e5e7eb;
      --text: #111827;
    }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; font-family: Inter, Arial, sans-serif; color: var(--text); background: var(--bg); }
    .page { min-height: 100vh; width: 100%; page-break-after: always; }
    .page:last-child { page-break-after: auto; }
    .container { max-width: 1100px; margin: 0 auto; padding: 64px 48px; }
    .eyebrow { margin: 0 0 8px; font-size: 12px; text-transform: uppercase; letter-spacing: .2em; color: var(--primary); font-weight: 600; }
    .title { margin: 0; font-size: 48px; line-height: 1.1; font-weight: 700; }
    .subtitle { margin: 12px 0 0; color: var(--muted); font-size: 15px; }
    .brand { display: flex; align-items: center; gap: 12px; margin-bottom: 56px; }
    .brand-box { width: 44px; height: 44px; border-radius: 12px; background: var(--primary); }
    .brand-name { font-size: 28px; font-weight: 700; letter-spacing: -.02em; }
    .cover-top-accent { height: 6px; width: 100%; background: var(--primary); }
    .date-chip { display: inline-flex; align-items: center; gap: 8px; padding: 10px 16px; border-radius: 999px; background: var(--secondary); margin-top: 24px; }
    .dot { width: 8px; height: 8px; border-radius: 999px; background: var(--primary); }
    .summary-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; margin: 24px 0 28px; }
    .card { background: var(--secondary); border: 1px solid var(--border); border-radius: 16px; padding: 24px; }
    .stat-value { font-size: 42px; font-weight: 700; color: var(--primary); margin: 8px 0 4px; }
    .stat-label { font-size: 13px; color: var(--muted); }
    .meta-table { width: 100%; border-collapse: collapse; border: 1px solid var(--border); border-radius: 12px; overflow: hidden; background: #fff; }
    .meta-table td { border-bottom: 1px solid var(--border); padding: 12px 14px; font-size: 13px; }
    .meta-table tr:last-child td { border-bottom: none; }
    .meta-label { color: var(--muted); width: 220px; }
    .zone-page { background: var(--secondary); }
    .zone-card { background: #fff; border: 1px solid var(--border); border-radius: 16px; overflow: hidden; }
    .zone-head { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding: 16px 20px; }
    .zone-index { width: 30px; height: 30px; border-radius: 8px; background: var(--primary); color: #fff; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; margin-right: 10px; }
    .zone-name { font-size: 20px; font-weight: 700; }
    .zone-meta { font-size: 12px; color: var(--muted); }
    .faces { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; padding: 20px; }
    .face-title { font-size: 13px; font-weight: 600; margin: 0 0 8px; }
    .face-image { width: 100%; aspect-ratio: 4 / 3; border-radius: 12px; overflow: hidden; background: #f1f5f9; border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; color: var(--muted); font-size: 12px; }
    .face-image img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .visual-box { position: relative; width: 100%; height: 62vh; border-radius: 0; overflow: hidden; background: #111827; }
    .visual-box img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .visual-overlay { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,.05) 0%, rgba(0,0,0,.58) 100%); }
    .visual-caption { position: absolute; left: 48px; right: 48px; bottom: 34px; color: #fff; font-size: 28px; line-height: 1.2; font-weight: 600; max-width: 860px; }
    .footer-center { display: flex; min-height: 100vh; align-items: center; justify-content: center; padding: 0 48px; position: relative; }
    .footer-center::before { content: ""; position: absolute; top: 0; left: 0; right: 0; height: 10px; background: var(--primary); }
    .footer-card { background: var(--secondary); border: 1px solid var(--border); border-radius: 18px; padding: 54px 48px; width: 100%; max-width: 840px; text-align: center; }
    .footer-brand { font-size: 42px; letter-spacing: .02em; margin: 0 0 14px; color: var(--primary); font-weight: 700; }
    .footer-text { margin: 0; font-size: 17px; color: var(--text); }
    .footer-mini { margin-top: 18px; color: var(--muted); font-size: 12px; }
  </style>
</head>
<body>
  <section class="page">
    <div class="cover-top-accent"></div>
    <div class="container" style="display:flex;flex-direction:column;justify-content:center;min-height:calc(100vh - 6px);">
      <div class="brand">
        <div class="brand-box"></div>
        <div class="brand-name">BillboardEye</div>
      </div>
      <p class="eyebrow">Rapport de campagne</p>
      <h1 class="title">${escapeHtml(projet.titreRapport || projet.nom || "Rapport Campagne")}</h1>
      <p class="subtitle">Client : ${escapeHtml(projet.entreprise || "-")}</p>
      ${
        projet.zone
          ? `<p class="subtitle" style="margin-top:4px;font-size:14px;">${escapeHtml(String(projet.zone))}</p>`
          : ""
      }
      <div class="date-chip">
        <span class="dot"></span>
        <span style="font-size:13px;color:var(--muted);">${escapeHtml(formatReportDate(projet.date))}</span>
      </div>
    </div>
  </section>

  <section class="page">
    <div class="container">
      <p class="eyebrow">Aperçu</p>
      <h2 style="margin:0;font-size:34px;line-height:1.2;">Résumé de la campagne</h2>
      <div class="summary-grid">
        <div class="card"><div class="stat-value">${escapeHtml(String(zonesCount))}</div><div class="stat-label">zones couvertes</div></div>
        <div class="card"><div class="stat-value">${escapeHtml(String(summary.total || 0))}</div><div class="stat-label">panneaux actifs</div></div>
        <div class="card"><div class="stat-value">${escapeHtml(projet.duree || "N/R")}</div><div class="stat-label">durée de campagne</div></div>
      </div>
      ${
        projet.instructions
          ? `<div style="margin:20px 0;padding:16px;border:1px solid var(--border);border-radius:12px;background:#fff;"><p style="margin:0 0 8px;font-size:11px;text-transform:uppercase;letter-spacing:.12em;color:var(--primary);font-weight:600;">Consignes & note</p><p style="margin:0;font-size:13px;line-height:1.5;color:var(--text);white-space:pre-wrap;">${escapeHtml(String(projet.instructions))}</p></div>`
          : ""
      }
      <table class="meta-table">
        <tr><td class="meta-label">Client</td><td>${escapeHtml(projet.entreprise || "-")}</td></tr>
        <tr><td class="meta-label">Campagne</td><td>${escapeHtml(projet.nom || "-")}</td></tr>
        <tr><td class="meta-label">Date</td><td>${escapeHtml(formatReportDate(projet.date))}</td></tr>
        <tr><td class="meta-label">Agent</td><td>${escapeHtml(projet.assignedAgent || "-")}</td></tr>
      </table>
    </div>
  </section>

  ${zonesHtml}

  <section class="page">
    <div class="visual-box">
      ${visualDataUri ? `<img src="${visualDataUri}" alt="Visual campagne" />` : ""}
      <div class="visual-overlay"></div>
      <div class="visual-caption">${escapeHtml(
        projet.legendeVisuelle || "Une visibilité maximale dans les zones à fort trafic."
      )}</div>
    </div>
  </section>

  <section class="page">
    <div class="footer-center">
      <div class="footer-card">
        <h3 class="footer-brand">BILLBOARDEYE</h3>
        <p class="footer-text">Rapport professionnel généré automatiquement.</p>
        <p class="footer-mini">Rapport premium généré par BillboardEye</p>
      </div>
    </div>
  </section>
</body>
</html>`;
};

const getPuppeteerLaunchOptions = () => {
  const args = [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--font-render-hinting=medium",
  ];
  const opts = {
    headless: true,
    args,
  };
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    opts.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
  }
  return opts;
};

const generatePDF = async (html) => {
  const browser = await puppeteer.launch(getPuppeteerLaunchOptions());
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1240, height: 1754, deviceScaleFactor: 2 });
    await page.setContent(html, { waitUntil: "networkidle0" });
    return await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
      preferCSSPageSize: true,
    });
  } finally {
    await browser.close();
  }
};

const getPdfInternalSecret = () =>
  process.env.PDF_RENDER_INTERNAL_SECRET ||
  (process.env.NODE_ENV !== "production" ? "dev-pdf-render-internal-secret" : "");

const getInternalApiBase = () => {
  const port = process.env.PORT || 5000;
  return (process.env.BILLBOARD_API_INTERNAL_URL || `http://127.0.0.1:${port}`).replace(/\/$/, "");
};

const getReportRendererBase = () =>
  (process.env.REPORT_RENDERER_BASE_URL || "http://127.0.0.1:3001").replace(/\/$/, "");

const createPdfRenderSession = async (report) => {
  const secret = getPdfInternalSecret();
  if (!secret) return null;
  const apiBase = getInternalApiBase();
  const res = await fetch(`${apiBase}/api/internal/pdf-render-session`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-pdf-internal": secret,
    },
    body: JSON.stringify(report),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Session PDF render ${res.status}: ${t.slice(0, 240)}`);
  }
  const json = await res.json();
  return json?.data?.token || null;
};

const generatePDFFromUrl = async (url) => {
  const browser = await puppeteer.launch(getPuppeteerLaunchOptions());
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1240, height: 1754, deviceScaleFactor: 2 });
    await page.goto(url, { waitUntil: "networkidle0", timeout: 180000 });
    return await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
      preferCSSPageSize: true,
    });
  } finally {
    await browser.close();
  }
};

/** PDF via l’app Next tmp_v0_template (même rendu que l’UI). Retourne null si désactivé ou en échec. */
const generateProjetPdfViaNextTemplate = async (report) => {
  if (process.env.DISABLE_NEXT_PDF_RENDERER === "true") return null;
  const secret = getPdfInternalSecret();
  if (!secret) return null;
  let token;
  try {
    token = await createPdfRenderSession(report);
  } catch (e) {
    console.warn("[pdf] session Next:", e?.message || e);
    return null;
  }
  if (!token) return null;
  const url = `${getReportRendererBase()}/rapport/render?token=${encodeURIComponent(token)}`;
  try {
    return await generatePDFFromUrl(url);
  } catch (e) {
    console.warn("[pdf] Puppeteer URL Next:", e?.message || e);
    return null;
  }
};


const createPanneauPDFBuffer = async (rapport) => {
  const { panneau, photos } = rapport;
  const [faceABuf, faceBBuf] = await Promise.all([
    photos?.faceA?.url ? fetchImageAsBuffer(photos.faceA.url) : null,
    photos?.faceB?.url ? fetchImageAsBuffer(photos.faceB.url) : null,
  ]);
  const theme = REPORT_THEME;

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
    const zoneName = panneau.nomZone || panneau.localisation?.adresse || "Panneau";
    drawPhotoPair(doc, faceABuf, faceBBuf, zoneName, formatGps(panneau.localisation?.latitude, panneau.localisation?.longitude), theme, "", "");

    addFooter(doc, 2, 2, theme);
    doc.end();
  });
};

/** Fallback : HTML inline (sans Next) si le renderer v0 n’est pas disponible. */
const createProjetPDFBufferLegacy = async (report) => {
    const { projet, panneaux, summary } = report;
  const zonesCount = (panneaux || []).length;

  const preparedZones = [];
  for (let index = 0; index < (panneaux || []).length; index += 1) {
    const panneau = panneaux[index];
    const [faceABuffer, faceBBuffer] = await Promise.all([
      panneau.photos?.faceA?.url ? fetchImageAsBuffer(panneau.photos.faceA.url) : null,
      panneau.photos?.faceB?.url ? fetchImageAsBuffer(panneau.photos.faceB.url) : null,
    ]);
    preparedZones.push({
      idx: index + 1,
      name: panneau.localisation?.adresse || `Zone ${index + 1}`,
      gps: formatGps(panneau.localisation?.latitude, panneau.localisation?.longitude),
      timestamp: formatTime(panneau.photos?.faceA?.createdAt || panneau.photos?.faceB?.createdAt),
      faceA: toDataUri(faceABuffer),
      faceB: toDataUri(faceBBuffer),
    });
  }

  const zonesHtml = preparedZones
    .map(
      (zone) => `<section class="page zone-page">
    <div class="container">
      <p class="eyebrow">Détails</p>
      <h2 style="margin:0 0 22px;font-size:34px;line-height:1.2;">Zones de la campagne</h2>
      <article class="zone-card">
        <div class="zone-head">
          <div>
            <span class="zone-index">${String(zone.idx).padStart(2, "0")}</span>
            <span class="zone-name">${escapeHtml(zone.name)}</span>
          </div>
          <div class="zone-meta">GPS: ${escapeHtml(zone.gps)} &nbsp;&nbsp;•&nbsp;&nbsp; Heure: ${escapeHtml(zone.timestamp)}</div>
        </div>
        <div class="faces">
          <div>
            <p class="face-title">Face A</p>
            <div class="face-image">${zone.faceA ? `<img src="${zone.faceA}" alt="Face A" />` : "Photo indisponible"}</div>
          </div>
          <div>
            <p class="face-title">Face B</p>
            <div class="face-image">${zone.faceB ? `<img src="${zone.faceB}" alt="Face B" />` : "Photo indisponible"}</div>
          </div>
        </div>
      </article>
    </div>
  </section>`
    )
    .join("\n");

  const visualDataUri = preparedZones.find((z) => z.faceA)?.faceA || preparedZones.find((z) => z.faceB)?.faceB || "";
  const html = buildProjetReportHtml({
    projet,
    summary,
    zonesCount,
    zonesHtml,
    visualDataUri,
  });
  return generatePDF(html);
};

const createProjetPDFBuffer = async (report) => {
  /** Flux principal : HTML depuis templates/report/ + Puppeteer (voir report-template.service.js) */
  try {
    const fromTemplate = await renderProjetReportHtmlFromTemplate(report);
    if (fromTemplate) {
      return generatePDF(fromTemplate);
    }
  } catch (e) {
    console.warn("[pdf] template rapport:", e?.message || e);
  }

  if (process.env.NEXT_PDF_RENDERER_FIRST === "true") {
    const viaNext = await generateProjetPdfViaNextTemplate(report);
    if (viaNext && viaNext.length > 0) return viaNext;
  }

  return createProjetPDFBufferLegacy(report);
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
  const suffix = options.suffix || "";
  const fileName = options.fileName || buildPdfFileName("projet", report.projet.id, suffix);
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
