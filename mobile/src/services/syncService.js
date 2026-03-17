import { getPendingData, clearSyncedData } from "./offlineStorage";
import { syncData } from "./api";

export const syncOfflineData = async () => {
  const pending = await getPendingData();
  const hasPanneaux = pending.panneaux.length > 0;
  const hasPhotos = pending.photos.length > 0;

  if (!hasPanneaux && !hasPhotos) {
    return {
      synced: false,
      message: "Aucune donnee en attente.",
      counts: { panneauxSync: 0, photosSync: 0 },
    };
  }

  try {
    const result = await syncData(pending);
    await clearSyncedData();
    console.log("Sync offline reussie", result);
    return {
      synced: true,
      message: "Synchronisation reussie.",
      counts: result,
    };
  } catch (error) {
    console.log("Sync offline echouee", error?.message);
    return {
      synced: false,
      message: "Synchronisation impossible pour le moment.",
      counts: { panneauxSync: 0, photosSync: 0 },
    };
  }
};
