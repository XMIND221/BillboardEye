import AsyncStorage from "@react-native-async-storage/async-storage";

const SELECTED_PROJECT_KEY = "@billboardeye:selected-project";
const USER_ROLE_KEY = "@billboardeye:user-role";

export const saveSelectedProject = async (project) => {
  await AsyncStorage.setItem(SELECTED_PROJECT_KEY, JSON.stringify(project || null));
};

export const getSelectedProject = async () => {
  const raw = await AsyncStorage.getItem(SELECTED_PROJECT_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch (_error) {
    return null;
  }
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
