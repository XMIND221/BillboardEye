const { createPanneau, getAllPanneaux, getPanneauById } = require("./panneaux.service");
const { addPhoto, getPhotosByPanneauId } = require("./photos.service");

const isSameLocation = (a, b) => {
  return Number(a.latitude) === Number(b.latitude) && Number(a.longitude) === Number(b.longitude);
};

const syncData = async (data) => {
  let panneauxSync = 0;
  let photosSync = 0;
  const panneaux = Array.isArray(data.panneaux) ? data.panneaux : [];
  const photos = Array.isArray(data.photos) ? data.photos : [];

  for (const panneau of panneaux) {
    if (!panneau || typeof panneau !== "object") {
      continue;
    }

    const localisation = panneau.localisation || {};
    const latitude = panneau.latitude ?? localisation.latitude;
    const longitude = panneau.longitude ?? localisation.longitude;
    const hasRequiredFields = Boolean(panneau.entreprise) && latitude !== undefined && longitude !== undefined;

    if (!hasRequiredFields) {
      continue;
    }

    let exists = false;

    if (panneau.id) {
      exists = Boolean(await getPanneauById(panneau.id));
    }

    if (!exists) {
      const allPanneaux = await getAllPanneaux();
      exists = allPanneaux.some((existing) => {
        return (
          existing.entreprise === panneau.entreprise &&
          isSameLocation(existing.localisation, { latitude, longitude })
        );
      });
    }

    if (!exists) {
      await createPanneau({
        id: panneau.id,
        entreprise: panneau.entreprise,
        localisation: {
          latitude: Number(latitude),
          longitude: Number(longitude),
          adresse: panneau.localisation?.adresse ?? panneau.adresse ?? "",
        },
        nombreFaces: panneau.nombreFaces,
        statut: panneau.statut,
        createdAt: panneau.createdAt,
      });
      panneauxSync += 1;
    }
  }

  for (const photo of photos) {
    if (!photo || typeof photo !== "object") {
      continue;
    }

    const hasRequiredFields = Boolean(photo.panneauId) && Boolean(photo.type) && Boolean(photo.url);
    const hasValidType = photo.type === "faceA" || photo.type === "faceB";

    if (!hasRequiredFields || !hasValidType) {
      continue;
    }

    if (!(await getPanneauById(photo.panneauId))) {
      continue;
    }

    const existingPhotos = await getPhotosByPanneauId(photo.panneauId);
    const isDuplicate = existingPhotos.some((existing) => existing.type === photo.type);

    if (isDuplicate) {
      continue;
    }

    await addPhoto({
      id: photo.id,
      panneauId: photo.panneauId,
      type: photo.type,
      url: photo.url,
      createdAt: photo.createdAt,
    });
    photosSync += 1;
  }

  return {
    panneauxSync,
    photosSync,
  };
};

module.exports = {
  syncData,
};
