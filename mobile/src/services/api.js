import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../utils/config";

const AUTH_TOKEN_KEY = "@billboardeye:auth_token";

const getAuthHeaders = async (customHeaders = {}) => {
  const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  const headers = { ...customHeaders };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

const parseResponse = async (response) => {
  const raw = await response.text();
  let body = null;

  try {
    body = raw ? JSON.parse(raw) : null;
  } catch (_error) {
    if (!response.ok) {
      if (response.status === 503) {
        throw new Error("Serveur indisponible (tunnel coupe).");
      }
      throw new Error(`Reponse serveur invalide (HTTP ${response.status}).`);
    }
    throw new Error("Reponse API invalide.");
  }

  if (!body || !response.ok || body.success === false) {
    throw new Error(body.message || "Erreur API.");
  }

  return body.data;
};

const apiRequest = async (path, options = {}) => {
  try {
    const headers = await getAuthHeaders(options.headers);
    const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
    return await parseResponse(response);
  } catch (error) {
    console.error("Erreur API:", error);
    if (isNetworkError(error)) {
      throw new Error("Impossible de contacter le serveur");
    }
    throw new Error(error.message || "Erreur API inconnue");
  }
};

export const createPanneau = async (payload) => {
  return apiRequest("/panneaux", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
};

export const getProjets = async () => {
  return apiRequest("/projets");
};

export const getPanneaux = async () => {
  return apiRequest("/panneaux");
};

export const getRapport = async (panneauId) => {
  return apiRequest(`/rapport/panneau/${panneauId}`);
};

export const getProjetPDFUrl = async (projetId, templateId = "1") => {
  const q = templateId ? `?template=${encodeURIComponent(templateId)}` : "";
  return apiRequest(`/rapport/projet/${projetId}/pdf-url${q}`);
};

export const previewProjetPDF = async (projetId, payload) => {
  return apiRequest(`/rapport/projet/${projetId}/preview`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {}),
  });
};

export const generateProjetPDFFinal = async (projetId, payload) => {
  return apiRequest(`/rapport/projet/${projetId}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {}),
  });
};

export const getReportTemplates = async () => {
  return apiRequest("/rapport/templates");
};

export const getProjetReport = async (projetId) => {
  return apiRequest(`/rapport/projet/${projetId}`);
};

export const createProjet = async (payload) => {
  console.log("Envoi projet:", payload);
  return apiRequest("/projets", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
};

export const addPhoto = async (formData) => {
  return apiRequest("/photos", {
    method: "POST",
    body: formData,
  });
};

export const uploadLogo = async (imageUri) => {
  const formData = new FormData();
  const filename = imageUri.split("/").pop() || `logo-${Date.now()}.jpg`;
  const ext = filename.split(".").pop()?.toLowerCase() || "jpg";
  const mimeType = ext === "png" ? "image/png" : "image/jpeg";
  formData.append("image", {
    uri: imageUri,
    name: filename,
    type: mimeType,
  });
  const result = await apiRequest("/upload/logo", {
    method: "POST",
    body: formData,
  });
  return result?.url || "";
};

export const syncData = async (payload) => {
  return apiRequest("/sync", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
};

export const testConnection = async () => {
  return apiRequest("/test", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
};

export const isNetworkError = (error) => {
  const message = String(error?.message || "").toLowerCase();
  return message.includes("network request failed") || message.includes("failed to fetch");
};
