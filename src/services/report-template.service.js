/**
 * Rendu HTML rapport campagne depuis templates/report/ (Handlebars + partials éditables).
 */
const fs = require("fs/promises");
const path = require("path");
const Handlebars = require("handlebars");

const { buildMapReportContext } = require("./map-report-payload");
const { fetchImageAsBuffer } = require("./report-media.service");

const TEMPLATE_DIR = path.join(__dirname, "..", "..", "templates", "report");
const PARTIALS_DIR = path.join(TEMPLATE_DIR, "partials");

const PLACEHOLDER_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23e5e7eb' width='100%25' height='100%25'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-size='14' font-family='sans-serif'%3EPhoto indisponible%3C/text%3E%3C/svg%3E";

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

const isPublicHttpUrl = (u) => typeof u === "string" && /^https?:\/\//i.test(u.trim());

/**
 * Télécharge les logos campagne (URLs publiques Supabase) en data URI pour Puppeteer.
 * @param {object} [projet]
 */
const resolveCoverLogosDataUris = async (projet = {}) => {
  const clientUrl = String(projet.clientLogoUrl || projet.client_logo_url || "").trim();
  const entUrl = String(projet.entrepriseLogoUrl || projet.entreprise_logo_url || "").trim();
  const [cBuf, eBuf] = await Promise.all([
    isPublicHttpUrl(clientUrl) ? fetchImageAsBuffer(clientUrl) : null,
    isPublicHttpUrl(entUrl) ? fetchImageAsBuffer(entUrl) : null,
  ]);
  return {
    coverClientLogoDataUri: cBuf?.length ? toDataUri(cBuf) : "",
    coverEntrepriseLogoDataUri: eBuf?.length ? toDataUri(eBuf) : "",
  };
};

let partialsRegistered = false;

const registerPartialsOnce = async () => {
  if (partialsRegistered) return;
  let files;
  try {
    files = await fs.readdir(PARTIALS_DIR);
  } catch {
    partialsRegistered = true;
    return;
  }
  for (const file of files) {
    if (!file.endsWith(".hbs")) continue;
    const name = path.basename(file, ".hbs");
    const src = await fs.readFile(path.join(PARTIALS_DIR, file), "utf8");
    Handlebars.registerPartial(name, src);
  }
  partialsRegistered = true;
};

/** @param {{ projet?: object, panneaux?: any[], summary?: { total?: number } }} report */
const renderProjetReportHtmlFromTemplate = async (report) => {
  const htmlPath = path.join(TEMPLATE_DIR, "report.html");
  const bodyPath = path.join(TEMPLATE_DIR, "body.hbs");
  const cssPath = path.join(TEMPLATE_DIR, "print.css");
  let skeleton;
  let printCss;
  let bodySource;
  try {
    skeleton = await fs.readFile(htmlPath, "utf8");
    printCss = await fs.readFile(cssPath, "utf8");
    bodySource = await fs.readFile(bodyPath, "utf8");
  } catch (e) {
    console.warn("[report-template] Fichiers manquants dans templates/report:", e?.message || e);
    return null;
  }

  await registerPartialsOnce();

  const base = buildMapReportContext(report);

  const zonesResolved = [];
  for (const z of base.zones) {
    const [bufA, bufB] = await Promise.all([
      z.faceAUrl ? fetchImageAsBuffer(z.faceAUrl) : null,
      z.faceBUrl ? fetchImageAsBuffer(z.faceBUrl) : null,
    ]);
    zonesResolved.push({
      index: z.index,
      indexPadded: String(z.index).padStart(2, "0"),
      name: z.name,
      showOnMap: z.showOnMap,
      gpsCoordinates: z.gpsCoordinates,
      timestamp: z.timestamp,
      faceAImage: toDataUri(bufA) || PLACEHOLDER_IMAGE,
      faceBImage: toDataUri(bufB) || PLACEHOLDER_IMAGE,
    });
  }

  let visualDataUri = "";
  if (base.visualImageUrl) {
    const vBuf = await fetchImageAsBuffer(base.visualImageUrl);
    visualDataUri = toDataUri(vBuf) || PLACEHOLDER_IMAGE;
  }

  const coverLogos = await resolveCoverLogosDataUris(report.projet || {});

  const view = {
    primaryCss: base.primaryCss,
    documentTitle: base.documentTitle,
    campaignName: base.campaignName,
    clientLine: base.clientLine,
    zoneLine: base.zoneLine || "",
    date: base.date,
    coverClientLogoDataUri: coverLogos.coverClientLogoDataUri,
    coverEntrepriseLogoDataUri: coverLogos.coverEntrepriseLogoDataUri,
    coverHasCampaignLogos: Boolean(coverLogos.coverClientLogoDataUri || coverLogos.coverEntrepriseLogoDataUri),
    zonesCount: base.zonesCount,
    billboardsCount: base.billboardsCount,
    duration: base.duration,
    noteResume: base.noteResume || "",
    mapImageUrl: base.mapImageUrl || "",
    mapCaption: base.mapCaption || "",
    mapLegend: base.mapLegend || [],
    zones: zonesResolved,
    visualDataUri,
    visualCaption: base.visualCaption || "",
  };

  const compileBody = Handlebars.compile(bodySource);
  const reportInner = compileBody(view);

  return skeleton
    .replace("@@DOC_TITLE@@", escapeHtml(view.documentTitle))
    .replace("@@PRINT_CSS@@", printCss)
    .replace("@@REPORT_INNER@@", reportInner);
};

module.exports = {
  renderProjetReportHtmlFromTemplate,
  resolveCoverLogosDataUris,
  TEMPLATE_DIR,
};
