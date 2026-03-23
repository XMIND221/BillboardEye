import {
  demoListProjets,
  demoGetProjet,
  demoCreateProjet,
  demoUpdateProjet,
  demoDeleteProjet,
  demoDuplicateProjet,
  demoListPanneaux,
  demoCreatePanneau,
  demoUpdatePanneau,
  demoDeletePanneau,
  demoGetProjetReport,
  demoGetPanneauRapport,
  demoPdfUrl,
  PLACEHOLDER_IMG,
} from "./demoApiState";

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

function parseJson(bodyStr) {
  if (!bodyStr) return {};
  try {
    return JSON.parse(bodyStr);
  } catch {
    return {};
  }
}

/**
 * Réponses fictives pour le mode démo (aucun appel réseau).
 * @param {string} path ex: /projets ou /projets/abc
 * @param {string} method
 * @param {string|null} bodyStr
 * @param {boolean} isFormData
 */
export async function handleDemoApiRequest(path, method, bodyStr, isFormData) {
  await delay(220);
  const m = (method || "GET").toUpperCase();
  const p = path.split("?")[0];

  if (p === "/test" && m === "GET") {
    return { ok: true, demo: true };
  }

  if (p === "/projets" && m === "GET") {
    return demoListProjets();
  }

  if (p === "/projets" && m === "POST") {
    return demoCreateProjet(parseJson(bodyStr));
  }

  const projetMatch = p.match(/^\/projets\/([^/]+)$/);
  if (projetMatch && m === "GET") {
    const row = demoGetProjet(projetMatch[1]);
    if (!row) throw new Error("Campagne introuvable.");
    return row;
  }

  if (projetMatch && m === "PATCH") {
    return demoUpdateProjet(projetMatch[1], parseJson(bodyStr));
  }

  if (projetMatch && m === "DELETE") {
    demoDeleteProjet(projetMatch[1]);
    return { ok: true };
  }

  const dupMatch = p.match(/^\/projets\/([^/]+)\/duplicate$/);
  if (dupMatch && m === "POST") {
    return demoDuplicateProjet(dupMatch[1]);
  }

  if (p === "/panneaux" && m === "GET") {
    return demoListPanneaux();
  }

  if (p === "/panneaux" && m === "POST") {
    return demoCreatePanneau(parseJson(bodyStr));
  }

  const panMatch = p.match(/^\/panneaux\/([^/]+)$/);
  if (panMatch && m === "PATCH") {
    return demoUpdatePanneau(panMatch[1], parseJson(bodyStr));
  }

  if (panMatch && m === "DELETE") {
    demoDeletePanneau(panMatch[1]);
    return { ok: true };
  }

  const rptPan = p.match(/^\/rapport\/panneau\/([^/]+)$/);
  if (rptPan && m === "GET") {
    const r = demoGetPanneauRapport(rptPan[1]);
    if (!r) throw new Error("Rapport panneau introuvable.");
    return r;
  }

  const rptProj = p.match(/^\/rapport\/projet\/([^/]+)$/);
  if (rptProj && m === "GET") {
    const r = demoGetProjetReport(rptProj[1]);
    if (!r) throw new Error("Rapport campagne introuvable.");
    return r;
  }

  const pdfUrlMatch = p.match(/^\/rapport\/projet\/([^/]+)\/pdf-url$/);
  if (pdfUrlMatch && m === "GET") {
    return demoPdfUrl();
  }

  const previewMatch = p.match(/^\/rapport\/projet\/([^/]+)\/preview$/);
  if (previewMatch && m === "POST") {
    return demoPdfUrl();
  }

  const genMatch = p.match(/^\/rapport\/projet\/([^/]+)\/generate$/);
  if (genMatch && m === "POST") {
    return demoPdfUrl();
  }

  if (p === "/photos" && m === "POST") {
    return { url: `${PLACEHOLDER_IMG}?upload=1`, type: "faceA" };
  }

  if (p === "/upload/logo" && m === "POST") {
    return { url: `${PLACEHOLDER_IMG}?logo=1` };
  }

  if (p === "/sync" && m === "POST") {
    return { synced: true, demo: true };
  }

  throw new Error(`Mode démo : action non simulée (${m} ${p}).`);
}
