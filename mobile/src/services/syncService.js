import {
  STATUS_PENDING,
  STATUS_SYNCED,
  getAllOfflineData,
  incrementPanneauRetry,
  incrementPhotoRetry,
  updatePanneauStatus,
  updatePhotoStatus,
} from "./offlineStorage";
import { addPhoto, createPanneau, isNetworkError } from "./api";

const MAX_RETRIES = 5;

const toUploadFormData = (photo) => {
  const form = new FormData();
  form.append("panneauId", photo.panneauId);
  form.append("type", photo.type);
  form.append("image", {
    uri: photo.url,
    name: `${photo.type}-${Date.now()}.jpg`,
    type: "image/jpeg",
  });
  return form;
};

export const syncOfflineData = async () => {
  const pending = await getAllOfflineData();
  const hasPanneaux = pending.panneaux.some((item) => item.statut !== STATUS_SYNCED);
  const hasPhotos = pending.photos.some((item) => item.statut !== STATUS_SYNCED);

  if (!hasPanneaux && !hasPhotos) {
    return {
      synced: false,
      message: "Aucune donnee en attente.",
      counts: { panneauxSync: 0, photosSync: 0 },
    };
  }

  let panneauxSync = 0;
  let photosSync = 0;
  const localToServerMap = {};

  try {
    for (const panneau of pending.panneaux) {
      if (panneau.statut === STATUS_SYNCED || panneau.retryCount >= MAX_RETRIES) {
        continue;
      }

      if (panneau.serverId) {
        localToServerMap[panneau.localId] = panneau.serverId;
        continue;
      }

      try {
        await updatePanneauStatus(panneau.localId, STATUS_PENDING);
        const created = await createPanneau({
          entreprise: panneau.entreprise,
          projetId: panneau.projetId || null,
          latitude: Number(panneau.localisation?.latitude),
          longitude: Number(panneau.localisation?.longitude),
          adresse: panneau.localisation?.adresse || "",
          nombreFaces: panneau.nombreFaces || 2,
          statut: "pending",
        });

        localToServerMap[panneau.localId] = created.id;
        await updatePanneauStatus(panneau.localId, STATUS_SYNCED, { serverId: created.id });
        panneauxSync += 1;
      } catch (error) {
        await incrementPanneauRetry(panneau.localId, error?.message || "Erreur sync panneau");
        if (!isNetworkError(error)) {
          console.log("Erreur sync panneau:", error?.message);
        }
      }
    }

    const refreshed = await getAllOfflineData();

    for (const photo of refreshed.photos) {
      if (photo.statut === STATUS_SYNCED || photo.retryCount >= MAX_RETRIES) {
        continue;
      }

      const linkedPanneau = refreshed.panneaux.find((item) => item.localId === photo.panneauLocalId);
      const mappedServerId =
        photo.panneauId || localToServerMap[photo.panneauLocalId] || linkedPanneau?.serverId || null;

      if (!mappedServerId) {
        continue;
      }

      try {
        await updatePhotoStatus(photo.localId, STATUS_PENDING, { panneauId: mappedServerId });
        const uploadTarget = {
          ...photo,
          panneauId: mappedServerId,
        };
        await addPhoto(toUploadFormData(uploadTarget));
        await updatePhotoStatus(photo.localId, STATUS_SYNCED, { panneauId: mappedServerId });
        photosSync += 1;
      } catch (error) {
        await incrementPhotoRetry(photo.localId, error?.message || "Erreur sync photo");
        if (!isNetworkError(error)) {
          console.log("Erreur sync photo:", error?.message);
        }
      }
    }

    return {
      synced: true,
      message: "Synchronisation terminee.",
      counts: { panneauxSync, photosSync },
    };
  } catch (error) {
    console.log("Sync offline echouee:", error?.message);
    return {
      synced: false,
      message: "Synchronisation impossible pour le moment.",
      counts: { panneauxSync, photosSync },
    };
  }
};
