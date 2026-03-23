import AsyncStorage from "@react-native-async-storage/async-storage";

export const DEMO_STORAGE_KEY = "@billboardeye:demo_mode";

/** Lecture synchrone pour l’intercepteur API (maintenu par DemoProvider). */
export const demoModeRef = { current: false };

export function setDemoModeRef(value) {
  demoModeRef.current = Boolean(value);
}

export function isDemoModeSync() {
  return demoModeRef.current === true;
}

export async function loadDemoModeFromStorage() {
  try {
    const v = await AsyncStorage.getItem(DEMO_STORAGE_KEY);
    const on = v === "1";
    demoModeRef.current = on;
    return on;
  } catch {
    demoModeRef.current = false;
    return false;
  }
}

export async function persistDemoMode(on) {
  if (on) {
    await AsyncStorage.setItem(DEMO_STORAGE_KEY, "1");
  } else {
    await AsyncStorage.removeItem(DEMO_STORAGE_KEY);
  }
  demoModeRef.current = on;
}

export const DEMO_USER_EMAIL = "demo@billboardeye.app";
