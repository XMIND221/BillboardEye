import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "@billboardeye:manager_report_history_v1";
const MAX = 40;

/**
 * @typedef {{ id: string, projetId: string, campaignName: string, pdfUrl: string, createdAt: string, status: 'pending' | 'generated' | 'failed' }} ReportHistoryItem
 */

/** @returns {Promise<ReportHistoryItem[]>} */
export async function getReportHistory() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** @param {ReportHistoryItem} item */
export async function addReportHistoryEntry(item) {
  const list = await getReportHistory();
  const next = [item, ...list].slice(0, MAX);
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
}

/** @param {string} id @param {Partial<ReportHistoryItem>} patch */
export async function updateReportHistoryEntry(id, patch) {
  const list = await getReportHistory();
  const next = list.map((row) => (row.id === id ? { ...row, ...patch } : row));
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
}

/** @param {string} id */
export async function removeReportHistoryEntry(id) {
  const list = await getReportHistory();
  const next = list.filter((row) => row.id !== id);
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
}
