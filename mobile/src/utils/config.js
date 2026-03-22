import { Platform } from "react-native";
import Constants from "expo-constants";
import { RAILWAY_API_BASE_URL } from "../constants/railway";

/** Railway : priorité EXPO_PUBLIC_RAILWAY_API_URL (EAS / .env), sinon constante partagée. */
const railwayFromEnv = String(process.env.EXPO_PUBLIC_RAILWAY_API_URL || "").trim();
const DEFAULT_API_BASE_URL = railwayFromEnv || RAILWAY_API_BASE_URL;

const ANDROID_EMULATOR_HOST = process.env.EXPO_PUBLIC_ANDROID_EMULATOR_HOST || "10.0.2.2";
/** Repli si Expo ne fournit pas l’IP (téléphone + API locale). */
const LOCAL_IP_FALLBACK = process.env.EXPO_PUBLIC_LOCAL_IP || "192.168.1.86";

const envApi = String(process.env.EXPO_PUBLIC_API_BASE_URL || "").trim();

const FORCE_ANDROID_EMULATOR =
  String(process.env.EXPO_PUBLIC_FORCE_ANDROID_EMULATOR || "").toLowerCase() === "1" ||
  String(process.env.EXPO_PUBLIC_FORCE_ANDROID_EMULATOR || "").toLowerCase() === "true";

const FORCE_ANDROID_PHYSICAL =
  String(process.env.EXPO_PUBLIC_FORCE_ANDROID_PHYSICAL || "").toLowerCase() === "1" ||
  String(process.env.EXPO_PUBLIC_FORCE_ANDROID_PHYSICAL || "").toLowerCase() === "true";

/**
 * IP LAN du PC telle qu’Expo / Metro l’exposent (QR code, même machine).
 * Évite de configurer EXPO_PUBLIC_LOCAL_IP pour la plupart des cas.
 */
function getLanHostFromExpo() {
  try {
    const uri = Constants.expoConfig?.hostUri || Constants.expoGoConfig?.debuggerHost;
    if (uri && typeof uri === "string") {
      const withoutProto = uri.replace(/^https?:\/\//i, "");
      const host = withoutProto.split(":")[0]?.trim();
      if (host && /^(\d{1,3}\.){3}\d{1,3}$/.test(host)) return host;
    }
    const dbg = Constants.manifest?.debuggerHost;
    if (dbg && typeof dbg === "string") {
      const host = dbg.split(":")[0]?.trim();
      if (host && /^(\d{1,3}\.){3}\d{1,3}$/.test(host)) return host;
    }
  } catch (_) {
    /* ignore */
  }
  return null;
}

function isPhysicalDevice() {
  if (Platform.OS === "web") return false;
  return Constants.isDevice === true;
}

/** Hôte à utiliser à la place de localhost (sans port). */
function pickLocalHostReplacement() {
  const lan = getLanHostFromExpo() || LOCAL_IP_FALLBACK;

  if (Platform.OS === "web") {
    return "localhost";
  }
  if (Platform.OS === "android") {
    if (FORCE_ANDROID_EMULATOR) return ANDROID_EMULATOR_HOST;
    if (FORCE_ANDROID_PHYSICAL) return lan;
    return isPhysicalDevice() ? lan : ANDROID_EMULATOR_HOST;
  }
  if (Platform.OS === "ios") {
    return isPhysicalDevice() ? lan : "localhost";
  }
  return lan;
}

function normalizeApiBaseUrl() {
  let url = envApi || DEFAULT_API_BASE_URL;

  if (/localhost|127\.0\.0\.1/i.test(url)) {
    const host = pickLocalHostReplacement();
    url = url.replace(/127\.0\.0\.1/g, host).replace(/localhost/gi, host);
  }

  if (
    /^https:\/\/(10\.0\.2\.2|127\.0\.0\.1|localhost|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/i.test(
      url,
    )
  ) {
    url = url.replace(/^https:\/\//i, "http://");
  }

  return url;
}

export const API_BASE_URL = normalizeApiBaseUrl();

if (typeof __DEV__ !== "undefined" && __DEV__) {
  const source = envApi
    ? "EXPO_PUBLIC_API_BASE_URL"
    : railwayFromEnv
      ? "EXPO_PUBLIC_RAILWAY_API_URL"
      : "Railway (src/constants/railway.js)";
  console.log("[BillboardEye] API =", API_BASE_URL, {
    source,
    expoLan: getLanHostFromExpo(),
    platform: Platform.OS,
    isDevice: Constants.isDevice,
  });
}
