import AsyncStorage from "@react-native-async-storage/async-storage";

const OFFLINE_QUEUE_KEY = "@billboardeye:offline-queue";

const defaultQueue = {
  panneaux: [],
  photos: [],
};

const readQueue = async () => {
  const raw = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
  if (!raw) {
    return defaultQueue;
  }

  try {
    const parsed = JSON.parse(raw);
    return {
      panneaux: Array.isArray(parsed.panneaux) ? parsed.panneaux : [],
      photos: Array.isArray(parsed.photos) ? parsed.photos : [],
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
  queue.panneaux.push(data);
  await writeQueue(queue);
};

export const savePhotoOffline = async (data) => {
  const queue = await readQueue();
  queue.photos.push(data);
  await writeQueue(queue);
};

export const getPendingData = async () => {
  return readQueue();
};

export const clearSyncedData = async () => {
  await writeQueue(defaultQueue);
};
