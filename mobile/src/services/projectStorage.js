import AsyncStorage from "@react-native-async-storage/async-storage";

const LEGACY_SELECTED_KEY = "@billboardeye:selected-project";
const USER_ROLE_KEY = "@billboardeye:user-role";

const selectedKeyForStorageRole = (storageRole) =>
  `@billboardeye:selected-project:${storageRole}`;

/** Rôle utilisé pour la persistance de la dernière campagne (PDF / rapports). */
const normalizeStorageRole = (role) => (role === "reporting" ? "reporting" : "gestionnaire");

export const saveSelectedProject = async (project, role = "gestionnaire") => {
  const r = normalizeStorageRole(role);
  await AsyncStorage.setItem(selectedKeyForStorageRole(r), JSON.stringify(project || null));
};

export const getSelectedProject = async (role = "gestionnaire") => {
  const r = normalizeStorageRole(role);
  let raw = await AsyncStorage.getItem(selectedKeyForStorageRole(r));
  if (!raw && r === "gestionnaire") {
    raw = await AsyncStorage.getItem(LEGACY_SELECTED_KEY);
  }
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch (_error) {
    return null;
  }
};

/** À appeler quand l’utilisateur change de mode (évite campagne A en gestionnaire → PDF campagne B en reporting). */
export const clearAllSelectedProjects = async () => {
  await AsyncStorage.multiRemove([
    LEGACY_SELECTED_KEY,
    selectedKeyForStorageRole("gestionnaire"),
    selectedKeyForStorageRole("reporting"),
  ]);
};

export const saveUserRole = async (role) => {
  if (!role) {
    await AsyncStorage.removeItem(USER_ROLE_KEY);
    return;
  }
  await AsyncStorage.setItem(USER_ROLE_KEY, role);
};

export const getUserRole = async () => {
  return AsyncStorage.getItem(USER_ROLE_KEY);
};

export const clearUserRole = async () => {
  await AsyncStorage.removeItem(USER_ROLE_KEY);
};
