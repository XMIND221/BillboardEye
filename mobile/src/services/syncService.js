import { isDemoModeSync } from "./demoMode";
import {
  STATUS_PENDING,
  STATUS_SYNCED,
  STATUS_SYNCING,
  getAllOfflineData,
  incrementPanneauRetry,
  incrementPhotoRetry,
  updatePanneauStatus,
  updatePhotoStatus,
} from "./offlineStorage";
import { addPhoto, createPanneau, isNetworkError } from "./api";

const MAX_RETRIES = 5;

const toUploadFormData = (photo) => {
  const uri = photo.url || photo.localUri || "";
  const form = new FormData();
  form.append("panneauId", photo.panneauId);
  form.append("type", photo.type);
  form.append("image", {
    uri,
    name: `${photo.type}-${Date.now()}.jpg`,
    type: "image/jpeg",
  });
  return form;
};

const safeCoord = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

export const syncOfflineData = async () => {
  if (isDemoModeSync()) {
    return {
      synced: false,
      message: "Mode démo — aucune synchronisation serveur.",
      counts: { panneauxSync: 0, photosSync: 0 },
    };
  }

  const pending = await getAllOfflineData();
  const needsWork = (item) =>
    item.statut !== STATUS_SYNCED && Number(item.retryCount || 0) < MAX_RETRIES;

  const hasPanneaux = pending.panneaux.some(needsWork);
  const hasPhotos = pending.photos.some(needsWork);

  if (!hasPanneaux && !hasPhotos) {
    return {
      synced: false,
      message: "Aucune donnée en attente.",
      counts: { panneauxSync: 0, photosSync: 0 },
    };
  }

  let panneauxSync = 0;
  let photosSync = 0;
  const localToServerMap = {};

  try {
    for (const panneau of pending.panneaux) {
      if (!needsWork(panneau)) {
        if (panneau.serverId) {
          localToServerMap[panneau.localId] = panneau.serverId;
        }
        continue;
      }

      if (panneau.serverId) {
        localToServerMap[panneau.localId] = panneau.serverId;
        continue;
      }

      try {
        await updatePanneauStatus(panneau.localId, STATUS_SYNCING);
        const created = await createPanneau({
          entreprise: panneau.entreprise,
          projetId: panneau.projetId || null,
          nomZone: panneau.nomZone || undefined,
          latitude: safeCoord(panneau.localisation?.latitude, 0),
          longitude: safeCoord(panneau.localisation?.longitude, 0),
          adresse: panneau.localisation?.adresse || "",
          nombreFaces: panneau.nombreFaces || 2,
          statut: "pending",
          ...(panneau.createdAt ? { createdAt: panneau.createdAt } : {}),
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
      if (!needsWork(photo)) {
        continue;
      }

      const linkedPanneau = refreshed.panneaux.find((item) => item.localId === photo.panneauLocalId);
      const mappedServerId =
        photo.panneauId || localToServerMap[photo.panneauLocalId] || linkedPanneau?.serverId || null;

      if (!mappedServerId) {
        continue;
      }

      const fileUri = photo.url || photo.localUri || "";
      if (!fileUri || !String(fileUri).startsWith("file")) {
        await incrementPhotoRetry(photo.localId, "Fichier image introuvable (cache expiré ?)");
        continue;
      }

      try {
        await updatePhotoStatus(photo.localId, STATUS_SYNCING, { panneauId: mappedServerId });
        const uploadTarget = {
          ...photo,
          panneauId: mappedServerId,
          url: fileUri,
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
      message: "Synchronisation terminée.",
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
