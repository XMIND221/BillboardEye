const { getPanneauById, getPanneauxByProjetId } = require("./panneaux.service");
const { getPhotosByPanneauId } = require("./photos.service");
const { getProjetById } = require("./projets.service");

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

  const completeCount = panneauxWithPhotos.filter((item) => item.isComplete).length;

  return {
    projet,
    panneaux: panneauxWithPhotos,
    summary: {
      total: panneauxWithPhotos.length,
      completed: completeCount,
      remaining: panneauxWithPhotos.length - completeCount,
    },
  };
};

module.exports = {
  getPanneauReport,
  getProjetReport,
};
