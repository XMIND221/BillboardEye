import AsyncStorage from "@react-native-async-storage/async-storage";

const CACHE_KEY = "@billboardeye:agent-missions-cache";

/**
 * Cache des missions (projets) pour usage terrain sans réseau.
 * @param {object} payload
 * @param {Array} payload.missions
 * @param {string} [payload.userEmail]
 */
export async function saveAgentMissionsCache({ missions, userEmail = "" }) {
  try {
    const entry = {
      savedAt: new Date().toISOString(),
      userEmail: String(userEmail || "").toLowerCase().trim(),
      missions: Array.isArray(missions) ? missions : [],
    };
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch (_e) {
    /* ignore */
  }
}

/**
 * @returns {Promise<{ missions: Array, savedAt: string | null, userEmail: string }>}
 */
export async function getAgentMissionsCache() {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) {
      return { missions: [], savedAt: null, userEmail: "" };
    }
    const parsed = JSON.parse(raw);
    return {
      missions: Array.isArray(parsed.missions) ? parsed.missions : [],
      savedAt: parsed.savedAt || null,
      userEmail: String(parsed.userEmail || "").toLowerCase().trim(),
    };
  } catch (_e) {
    return { missions: [], savedAt: null, userEmail: "" };
  }
}
