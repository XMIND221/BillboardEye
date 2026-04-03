/**
 * État API fictif en mémoire (mode démo uniquement).
 * Aucune persistance serveur — réinitialisé à chaque entrée en démo.
 */

const PLACEHOLDER_IMG = "https://picsum.photos/seed/billboardeye/800/600";
const DEMO_PDF_URL = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

const SEED = {
  projets: [
    {
      id: "demo-projet-1",
      nom: "Affichage — Centre-ville",
      entreprise: "Client Démo SA",
      zone: "Gare, Plateau, Marché",
      date: new Date().toISOString(),
      duree: "4 semaines",
      instructions: "Photos nettes, cadrage paysage. Éviter contre-jour.",
      legendeVisuelle: "Vue d’ensemble des emplacements.",
      legendeCarte: "Répartition des panneaux sur la zone pilote.",
      titreRapport: "Rapport campagne Centre-ville",
      assignedAgent: "agent.demo@exemple.fr",
      couleurPrincipale: "#2563EB",
      statut: "active",
      clientLogoUrl: "",
      entrepriseLogoUrl: "",
      reportPdfVariant: "default",
      reportLayout: { sections: [] },
    },
    {
      id: "demo-projet-2",
      nom: "Roadshow Hiver",
      entreprise: "Brand X",
      zone: "Nord, Est",
      date: new Date().toISOString(),
      duree: "15 jours",
      instructions: "Vérifier éclairage nocturne si applicable.",
      legendeVisuelle: "",
      legendeCarte: "",
      titreRapport: "Rapport Roadshow Hiver",
      assignedAgent: "",
      couleurPrincipale: "#E11D48",
      statut: "planned",
      clientLogoUrl: "",
      entrepriseLogoUrl: "",
      reportPdfVariant: "a",
      reportLayout: { sections: [] },
    },
    {
      id: "demo-projet-3",
      nom: "Campagne Express",
      entreprise: "Urban Ads",
      zone: "Zone portuaire",
      date: new Date().toISOString(),
      duree: "7 jours",
      instructions: "",
      legendeVisuelle: "",
      legendeCarte: "",
      titreRapport: "Campagne Express — Synthèse",
      assignedAgent: "agent.demo@exemple.fr",
      couleurPrincipale: "#16a34a",
      statut: "active",
      clientLogoUrl: "",
      entrepriseLogoUrl: "",
      reportPdfVariant: "default",
      reportLayout: { sections: [] },
    },
  ],
  panneaux: [
    {
      id: "demo-pan-1",
      entreprise: "Client Démo SA",
      projetId: "demo-projet-1",
      nomZone: "Gare",
      localisation: { latitude: 48.8566, longitude: 2.3522, adresse: "Gare centrale — Face nord" },
      nombreFaces: 2,
      statut: "pending",
      createdAt: new Date().toISOString(),
    },
    {
      id: "demo-pan-2",
      entreprise: "Client Démo SA",
      projetId: "demo-projet-1",
      nomZone: "Plateau",
      localisation: { latitude: 48.86, longitude: 2.34, adresse: "Boulevard principal" },
      nombreFaces: 2,
      statut: "pending",
      createdAt: new Date().toISOString(),
    },
    {
      id: "demo-pan-3",
      entreprise: "Brand X",
      projetId: "demo-projet-2",
      nomZone: "Nord",
      localisation: { latitude: 48.9, longitude: 2.3, adresse: "Carrefour Nord" },
      nombreFaces: 2,
      statut: "pending",
      createdAt: new Date().toISOString(),
    },
  ],
};

let state = deepClone(SEED);

export function resetDemoApiState() {
  state = deepClone(SEED);
}

export function getDemoState() {
  return state;
}

let idCounter = 9000;
function nextId(prefix) {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

export function demoListProjets() {
  return deepClone(state.projets);
}

export function demoGetProjet(id) {
  return deepClone(state.projets.find((p) => p.id === id) || null);
}

export function demoCreateProjet(payload) {
  const row = {
    id: nextId("demo-projet"),
    nom: payload.nom || "Nouvelle campagne",
    entreprise: payload.entreprise || "Client",
    zone: payload.zone || "",
    date: payload.date || new Date().toISOString(),
    duree: payload.duree || "",
    instructions: payload.instructions || "",
    legendeVisuelle: payload.legendeVisuelle || "",
    legendeCarte: payload.legendeCarte || "",
    titreRapport: payload.titreRapport || payload.nom || "Rapport",
    assignedAgent: payload.assignedAgent || "",
    couleurPrincipale: payload.couleurPrincipale || "#2563EB",
    statut: payload.statut || "active",
    clientLogoUrl: payload.clientLogoUrl || "",
    entrepriseLogoUrl: payload.entrepriseLogoUrl || "",
    reportPdfVariant: payload.reportPdfVariant || "default",
    reportLayout: payload.reportLayout || { sections: [] },
  };
  state.projets.push(row);
  return deepClone(row);
}

export function demoUpdateProjet(id, payload) {
  const idx = state.projets.findIndex((p) => p.id === id);
  if (idx < 0) throw new Error("Campagne introuvable (démo).");
  state.projets[idx] = { ...state.projets[idx], ...payload, id };
  return deepClone(state.projets[idx]);
}

export function demoDeleteProjet(id) {
  state.projets = state.projets.filter((p) => p.id !== id);
  state.panneaux = state.panneaux.filter((p) => p.projetId !== id);
}

export function demoDuplicateProjet(id) {
  const src = state.projets.find((p) => p.id === id);
  if (!src) throw new Error("Campagne introuvable (démo).");
  const copy = {
    ...deepClone(src),
    id: nextId("demo-projet"),
    nom: `${src.nom} (copie)`,
    statut: "active",
  };
  state.projets.push(copy);
  const children = state.panneaux.filter((p) => p.projetId === id);
  children.forEach((pan) => {
    state.panneaux.push({
      ...deepClone(pan),
      id: nextId("demo-pan"),
      projetId: copy.id,
      createdAt: new Date().toISOString(),
    });
  });
  return deepClone(copy);
}

export function demoListPanneaux() {
  return deepClone(state.panneaux);
}

export function demoCreatePanneau(payload) {
  const row = {
    id: nextId("demo-pan"),
    entreprise: payload.entreprise || "Client",
    projetId: payload.projetId || null,
    nomZone: payload.nomZone || payload.adresse || "",
    localisation: {
      latitude: Number(payload.latitude ?? payload.localisation?.latitude) || 0,
      longitude: Number(payload.longitude ?? payload.localisation?.longitude) || 0,
      adresse: payload.adresse || payload.localisation?.adresse || "",
    },
    nombreFaces: payload.nombreFaces ?? 2,
    statut: payload.statut || "pending",
    createdAt: payload.createdAt || new Date().toISOString(),
  };
  state.panneaux.push(row);
  return deepClone(row);
}

export function demoUpdatePanneau(id, payload) {
  const idx = state.panneaux.findIndex((p) => p.id === id);
  if (idx < 0) throw new Error("Panneau introuvable (démo).");
  const cur = state.panneaux[idx];
  state.panneaux[idx] = {
    ...cur,
    ...payload,
    id,
    localisation: payload.localisation
      ? { ...cur.localisation, ...payload.localisation }
      : cur.localisation,
  };
  return deepClone(state.panneaux[idx]);
}

export function demoDeletePanneau(id) {
  state.panneaux = state.panneaux.filter((p) => p.id !== id);
}

export function demoGetProjetReport(projetId) {
  const projet = state.projets.find((p) => p.id === projetId);
  if (!projet) return null;
  const panneaux = state.panneaux.filter((p) => p.projetId === projetId);
  const withPhotos = panneaux.map((p) => ({
    ...p,
    photos: {
      faceA: { url: `${PLACEHOLDER_IMG}?a=${p.id}` },
      faceB: { url: `${PLACEHOLDER_IMG}?b=${p.id}` },
    },
    isComplete: true,
  }));
  const completed = withPhotos.filter((p) => p.isComplete).length;
  return {
    projet: deepClone(projet),
    panneaux: deepClone(withPhotos),
    summary: {
      total: withPhotos.length,
      completed,
      remaining: withPhotos.length - completed,
    },
  };
}

export function demoGetPanneauRapport(panneauId) {
  const panneau = state.panneaux.find((p) => p.id === panneauId);
  if (!panneau) return null;
  return {
    panneau: deepClone(panneau),
    photos: {
      faceA: { url: `${PLACEHOLDER_IMG}?fa=${panneauId}` },
      faceB: { url: `${PLACEHOLDER_IMG}?fb=${panneauId}` },
    },
    isComplete: true,
  };
}

export function demoPdfUrl() {
  return { url: DEMO_PDF_URL };
}

export { DEMO_PDF_URL, PLACEHOLDER_IMG };
