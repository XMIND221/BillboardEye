import AsyncStorage from "@react-native-async-storage/async-storage";

const OFFLINE_QUEUE_KEY = "@billboardeye:offline-queue";
export const STATUS_PENDING = "pending";
/** Upload / envoi API en cours */
export const STATUS_SYNCING = "syncing";
export const STATUS_SYNCED = "synced";
export const STATUS_ERROR = "error";

const defaultQueue = {
  panneaux: [],
  photos: [],
};

const generateLocalId = (prefix) => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

const normalizePanneau = (item) => {
  return {
    localId: item.localId || item.id || generateLocalId("panneau"),
    serverId: item.serverId || null,
    statut: item.statut || STATUS_PENDING,
    timestamp: item.timestamp || item.createdAt || new Date().toISOString(),
    retryCount: Number(item.retryCount || 0),
    lastError: item.lastError || "",
    entreprise: item.entreprise,
    projetId: item.projetId || null,
    localisation: item.localisation,
    nombreFaces: item.nombreFaces,
    createdAt: item.createdAt || new Date().toISOString(),
    photos: item.photos || null,
  };
};

const normalizePhoto = (item) => {
  const fileUri = item.url || item.localUri || "";
  return {
    localId: item.localId || item.id || generateLocalId("photo"),
    panneauLocalId: item.panneauLocalId || null,
    panneauId: item.panneauId || null,
    type: item.type,
    url: fileUri,
    localUri: item.localUri || (fileUri && String(fileUri).startsWith("file") ? fileUri : ""),
    statut: item.statut || STATUS_PENDING,
    timestamp: item.timestamp || item.createdAt || new Date().toISOString(),
    retryCount: Number(item.retryCount || 0),
    lastError: item.lastError || "",
    createdAt: item.createdAt || new Date().toISOString(),
  };
};

const readQueue = async () => {
  const raw = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
  if (!raw) {
    return defaultQueue;
  }

  try {
    const parsed = JSON.parse(raw);
    return {
      panneaux: Array.isArray(parsed.panneaux) ? parsed.panneaux.map(normalizePanneau) : [],
      photos: Array.isArray(parsed.photos) ? parsed.photos.map(normalizePhoto) : [],
    };
  } catch (_error) {
    return defaultQueue;
  }
};

const writeQueue = async (queue) => {
  await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
};

export const savePanneauOffline = async (data) => {
  const queue = await readQueue();
  const normalized = normalizePanneau({
    ...data,
    localId: data.localId || data.id,
    statut: data.statut || STATUS_PENDING,
    timestamp: data.timestamp || new Date().toISOString(),
  });

  const existingIndex = queue.panneaux.findIndex(
    (item) => item.localId === normalized.localId || (normalized.serverId && item.serverId === normalized.serverId),
  );

  if (existingIndex >= 0) {
    queue.panneaux[existingIndex] = {
      ...queue.panneaux[existingIndex],
      ...normalized,
    };
  } else {
    queue.panneaux.push(normalized);
  }
  await writeQueue(queue);
};

export const savePhotoOffline = async (data) => {
  const queue = await readQueue();
  queue.photos.push(
    normalizePhoto({
      ...data,
      localId: data.localId || data.id,
      statut: STATUS_PENDING,
      timestamp: new Date().toISOString(),
    }),
  );
  await writeQueue(queue);
};

export const getPendingData = async () => {
  return readQueue();
};

export const updatePanneauStatus = async (localId, statut, options = {}) => {
  const queue = await readQueue();
  queue.panneaux = queue.panneaux.map((item) => {
    if (item.localId !== localId) {
      return item;
    }

    return {
      ...item,
      statut,
      serverId: options.serverId ?? item.serverId,
      lastError: options.lastError || "",
      retryCount: options.retryCount ?? item.retryCount,
    };
  });
  await writeQueue(queue);
};

export const updatePanneauStatusByServerId = async (serverId, statut, options = {}) => {
  const queue = await readQueue();
  queue.panneaux = queue.panneaux.map((item) => {
    if (item.serverId !== serverId) {
      return item;
    }

    return {
      ...item,
      statut,
      lastError: options.lastError || "",
      retryCount: options.retryCount ?? item.retryCount,
    };
  });
  await writeQueue(queue);
};

export const updatePhotoStatus = async (localId, statut, options = {}) => {
  const queue = await readQueue();
  queue.photos = queue.photos.map((item) => {
    if (item.localId !== localId) {
      return item;
    }

    return {
      ...item,
      panneauId: options.panneauId ?? item.panneauId,
      statut,
      lastError: options.lastError || "",
      retryCount: options.retryCount ?? item.retryCount,
    };
  });
  await writeQueue(queue);
};

export const incrementPanneauRetry = async (localId, lastError = "") => {
  const queue = await readQueue();
  queue.panneaux = queue.panneaux.map((item) => {
    if (item.localId !== localId) {
      return item;
    }

    return {
      ...item,
      statut: STATUS_ERROR,
      retryCount: item.retryCount + 1,
      lastError,
    };
  });
  await writeQueue(queue);
};

export const incrementPhotoRetry = async (localId, lastError = "") => {
  const queue = await readQueue();
  queue.photos = queue.photos.map((item) => {
    if (item.localId !== localId) {
      return item;
    }

    return {
      ...item,
      statut: STATUS_ERROR,
      retryCount: item.retryCount + 1,
      lastError,
    };
  });
  await writeQueue(queue);
};

export const getSyncStats = async () => {
  const queue = await readQueue();
  const panneaux = queue.panneaux.reduce(
    (acc, item) => {
      if (item.statut === STATUS_SYNCED) {
        acc.synced += 1;
      } else if (item.statut === STATUS_ERROR) {
        acc.error += 1;
      } else if (item.statut === STATUS_SYNCING) {
        acc.syncing += 1;
      } else {
        acc.pending += 1;
      }
      return acc;
    },
    { pending: 0, syncing: 0, synced: 0, error: 0 },
  );

  const photos = queue.photos.reduce(
    (acc, item) => {
      if (item.statut === STATUS_SYNCED) {
        acc.synced += 1;
      } else if (item.statut === STATUS_ERROR) {
        acc.error += 1;
      } else if (item.statut === STATUS_SYNCING) {
        acc.syncing += 1;
      } else {
        acc.pending += 1;
      }
      return acc;
    },
    { pending: 0, syncing: 0, synced: 0, error: 0 },
  );

  return { panneaux, photos };
};

/** Nombre d’éléments encore à envoyer (hors synchro OK). */
export const getPendingSyncCount = async () => {
  const { panneaux, photos } = await getSyncStats();
  return (
    panneaux.pending +
    panneaux.syncing +
    panneaux.error +
    photos.pending +
    photos.syncing +
    photos.error
  );
};

export const getAllOfflineData = async () => {
  return readQueue();
};

export const clearStorageForDebug = async () => {
  await writeQueue(defaultQueue);
};
