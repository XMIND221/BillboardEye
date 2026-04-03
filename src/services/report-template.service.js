/**
 * Rendu HTML rapport campagne depuis templates/report/ (Handlebars + partials éditables).
 * Variantes v0 : REPORT_PDF_VARIANT=a|b|c|waouh → templates/report-variants/{a|b|c|waouh}/
 */
const fs = require("fs/promises");
const path = require("path");
const Handlebars = require("handlebars");

const { buildMapReportContext } = require("./map-report-payload");
const { fetchImageAsBuffer } = require("./report-media.service");

const ROOT = path.join(__dirname, "..", "..");
const TEMPLATE_DIR = path.join(ROOT, "templates", "report");
const PARTIALS_DIR = path.join(TEMPLATE_DIR, "partials");
const VARIANTS_ROOT = path.join(ROOT, "templates", "report-variants");
const SKELETON_HTML = path.join(TEMPLATE_DIR, "report.html");

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

/**
 * Priorité : campagne (projet.reportPdfVariant) > env REPORT_PDF_VARIANT > default.
 * @param {object} [projet]
 */
const pickPdfVariant = (projet = {}) => {
  const fromProjet = String(projet.reportPdfVariant ?? projet.report_pdf_variant ?? "")
    .trim()
    .toLowerCase();
  if (fromProjet === "a" || fromProjet === "b" || fromProjet === "c" || fromProjet === "waouh")
    return fromProjet;
  const fromEnv = String(process.env.REPORT_PDF_VARIANT || "").trim().toLowerCase();
  if (fromProjet === "default" || fromProjet === "") {
    if (fromEnv === "a" || fromEnv === "b" || fromEnv === "c" || fromEnv === "waouh")
      return fromEnv;
  }
  return "default";
};

/** @returns {{ variant: string, bodyPath: string, cssPath: string, partialsDir: string }} */
const resolveTemplateLayout = (projet = {}) => {
  const v = pickPdfVariant(projet);
  if (v === "a" || v === "b" || v === "c" || v === "waouh") {
    const dir = path.join(VARIANTS_ROOT, v);
    return {
      variant: v,
      bodyPath: path.join(dir, "body.hbs"),
      cssPath: path.join(dir, "print.css"),
      partialsDir: path.join(dir, "partials"),
    };
  }
  return {
    variant: "default",
    bodyPath: path.join(TEMPLATE_DIR, "body.hbs"),
    cssPath: path.join(TEMPLATE_DIR, "print.css"),
    partialsDir: PARTIALS_DIR,
  };
};

const resolveSectionVisibility = (projet = {}) => {
  const defaults = {
    showCover: true,
    showSummary: true,
    showPanels: true,
    showVisual: true,
    showClosing: true,
  };
  const sections = Array.isArray(projet?.reportLayout?.sections) ? projet.reportLayout.sections : [];
  if (!sections.length) return defaults;
  const byKey = new Map(
    sections
      .map((s) => [String(s?.key || "").trim().toLowerCase(), s])
      .filter(([k]) => !!k),
  );
  const isVisible = (key, fallback = true) => {
    const row = byKey.get(key);
    if (!row) return fallback;
    if (row.deleted === true) return false;
    return row.visible !== false;
  };
  return {
    showCover: isVisible("cover", true),
    showSummary: isVisible("summary", true),
    showPanels: isVisible("panels", true),
    showVisual: isVisible("visual", true),
    showClosing: isVisible("closing", true),
  };
};

/** Recharge les partials à chaque PDF : évite un template obsolète gardé en mémoire. */
const registerPartialsFresh = async (partialsDir) => {
  let files;
  try {
    files = await fs.readdir(partialsDir);
  } catch {
    return;
  }
  for (const file of files) {
    if (!file.endsWith(".hbs")) continue;
    const name = path.basename(file, ".hbs");
    const src = await fs.readFile(path.join(partialsDir, file), "utf8");
    Handlebars.registerPartial(name, src);
  }
};

/** @param {{ projet?: object, panneaux?: any[], summary?: { total?: number } }} report */
const renderProjetReportHtmlFromTemplate = async (report) => {
  const layout = resolveTemplateLayout(report.projet || {});
  let skeleton;
  let printCss;
  let bodySource;
  try {
    skeleton = await fs.readFile(SKELETON_HTML, "utf8");
    printCss = await fs.readFile(layout.cssPath, "utf8");
    bodySource = await fs.readFile(layout.bodyPath, "utf8");
  } catch (e) {
    console.warn(
      `[report-template] Fichiers manquants (variant=${layout.variant}):`,
      e?.message || e
    );
    return null;
  }

  await registerPartialsFresh(layout.partialsDir);

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
      faceALabel: z.faceALabel || "Face A",
      faceBLabel: z.faceBLabel || "Face B",
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
  const sectionVisibility = resolveSectionVisibility(report.projet || {});

  const mapImageSrc = "";
  const mapPlaceholderText = "";
  const mapCaptionForView = "";

  const view = {
    primaryCss: base.primaryCss,
    documentTitle: base.documentTitle,
    campaignName: base.campaignName,
    clientLine: base.clientLine,
    clientDisplay: base.clientDisplay,
    zoneLine: base.zoneLine || "",
    date: base.date,
    coverClientLogoDataUri: coverLogos.coverClientLogoDataUri,
    coverEntrepriseLogoDataUri: coverLogos.coverEntrepriseLogoDataUri,
    coverHasCampaignLogos: Boolean(
      coverLogos.coverClientLogoDataUri || coverLogos.coverEntrepriseLogoDataUri
    ),
    zonesCount: base.zonesCount,
    billboardsCount: base.billboardsCount,
    zonesCountPadded: String(base.zonesCount).padStart(2, "0"),
    billboardsCountPadded: String(base.billboardsCount).padStart(2, "0"),
    duration: base.duration,
    noteResume: base.noteResume || "",
    footerBrand: base.footerBrand,
    footerNote: base.footerNote,
    closingHeading: base.closingHeading,
    closingBody: base.closingBody,
    closingSignatureLabel: base.closingSignatureLabel,
    closingSignatureValue: base.closingSignatureValue,
    mapImageSrc,
    mapPlaceholderText,
    mapCaption: mapCaptionForView,
    mapLegend: [],
    zones: zonesResolved,
    visualDataUri,
    visualCaption: base.visualCaption || "",
    ...sectionVisibility,
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
  VARIANTS_ROOT,
};
