const { getPanneauById, getPanneauxByProjetId } = require("./panneaux.service");
const { getPhotosByPanneauId } = require("./photos.service");
const { getProjetById } = require("./projets.service");

/**
 * Un rapport campagne ne doit contenir que des panneaux liés à cette campagne (PDF / JSON).
 * Filtrage défensif si la base renvoie des lignes incohérentes.
 */
const ensureReportPanneauxMatchProjet = (report) => {
  if (!report?.projet?.id) return report;
  const projetId = String(report.projet.id);
  const list = Array.isArray(report.panneaux) ? report.panneaux : [];
  const next = list.filter((p) => {
    const pid = p?.projetId != null && p.projetId !== "" ? String(p.projetId) : "";
    return pid === projetId;
  });
  if (next.length !== list.length) {
    console.warn(
      `[rapport] Campagne ${projetId}: ${list.length - next.length} panneau(x) exclus (projet_id différent ou absent).`,
    );
  }
  const completed = next.filter((p) => p.isComplete).length;
  return {
    ...report,
    projet: { ...report.projet },
    panneaux: next,
    summary: {
      ...(report.summary || {}),
      total: next.length,
      completed,
      remaining: next.length - completed,
    },
  };
};

const getPanneauReport = async (panneauId) => {
  const panneau = await getPanneauById(panneauId);

  if (!panneau) {
    return null;
  }

  const panneauPhotos = await getPhotosByPanneauId(panneauId);
  const faceA = panneauPhotos.find((photo) => photo.type === "faceA") || null;
  const faceB = panneauPhotos.find((photo) => photo.type === "faceB") || null;

  return {
    panneau,
    photos: {
      faceA,
      faceB,
    },
    isComplete: Boolean(faceA && faceB),
  };
};

const getProjetReport = async (projetId) => {
  const projet = await getProjetById(projetId);
  if (!projet) {
    return null;
  }

  const panneaux = await getPanneauxByProjetId(projetId);
  const panneauxWithPhotos = [];

  for (const panneau of panneaux) {
    const panneauPhotos = await getPhotosByPanneauId(panneau.id);
    const faceA = panneauPhotos.find((photo) => photo.type === "faceA") || null;
    const faceB = panneauPhotos.find((photo) => photo.type === "faceB") || null;

    panneauxWithPhotos.push({
      ...panneau,
      photos: { faceA, faceB },
      isComplete: Boolean(faceA && faceB),
    });
  }

  return ensureReportPanneauxMatchProjet({
    projet,
    panneaux: panneauxWithPhotos,
    summary: {},
  });
};

module.exports = {
  getPanneauReport,
  getProjetReport,
  ensureReportPanneauxMatchProjet,
};
