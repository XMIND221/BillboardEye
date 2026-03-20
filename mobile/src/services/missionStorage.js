import AsyncStorage from "@react-native-async-storage/async-storage";

const MISSION_STATE_KEY = "@billboardeye:mission-state";

const readState = async () => {
  const raw = await AsyncStorage.getItem(MISSION_STATE_KEY);
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw);
  } catch (_error) {
    return {};
  }
};

const writeState = async (state) => {
  await AsyncStorage.setItem(MISSION_STATE_KEY, JSON.stringify(state));
};

export const parseZones = (zoneValue) => {
  if (!zoneValue) {
    return [];
  }

  return String(zoneValue)
    .split(/[;,/|]/)
    .map((value) => value.trim())
    .filter(Boolean);
};

export const getMissionProgress = async (projectId, zones) => {
  const state = await readState();
  const completed = Array.isArray(state?.[projectId]?.completedZones) ? state[projectId].completedZones : [];
  const cleanZones = Array.from(new Set((zones || []).map((zone) => String(zone).trim()).filter(Boolean)));
  const completedSet = new Set(completed);
  const completedCount = cleanZones.filter((zone) => completedSet.has(zone)).length;
  const nextZone = cleanZones.find((zone) => !completedSet.has(zone)) || null;

  return {
    completedZones: completed,
    completedCount,
    totalZones: cleanZones.length,
    nextZone,
    isDone: cleanZones.length > 0 && completedCount >= cleanZones.length,
  };
};

export const markZoneCompleted = async (projectId, zone) => {
  if (!projectId || !zone) {
    return;
  }

  const state = await readState();
  const current = Array.isArray(state?.[projectId]?.completedZones) ? state[projectId].completedZones : [];
  const set = new Set(current);
  set.add(zone);
  state[projectId] = { completedZones: Array.from(set) };
  await writeState(state);
};

export const resetMissionProgress = async (projectId) => {
  const state = await readState();
  delete state[projectId];
  await writeState(state);
};
