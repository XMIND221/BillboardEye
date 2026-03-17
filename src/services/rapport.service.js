const { getPanneauById } = require("./panneaux.service");
const { getPhotosByPanneauId } = require("./photos.service");

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

module.exports = {
  getPanneauReport,
};
