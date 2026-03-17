import { API_BASE_URL } from "../utils/config";

const parseResponse = async (response) => {
  const body = await response.json();

  if (!response.ok || body.success === false) {
    throw new Error(body.message || "Erreur API.");
  }

  return body.data;
};

export const createPanneau = async (payload) => {
  const response = await fetch(`${API_BASE_URL}/panneaux`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseResponse(response);
};

export const addPhoto = async (formData) => {
  const response = await fetch(`${API_BASE_URL}/photos`, {
    method: "POST",
    body: formData,
  });

  return parseResponse(response);
};

export const syncData = async (payload) => {
  const response = await fetch(`${API_BASE_URL}/sync`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseResponse(response);
};

export const isNetworkError = (error) => {
  const message = String(error?.message || "").toLowerCase();
  return message.includes("network request failed") || message.includes("failed to fetch");
};
