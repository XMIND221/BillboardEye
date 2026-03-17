const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const parseResponse = async (response) => {
  const body = await response.json();

  if (!response.ok || body.success === false) {
    throw new Error(body.message || "Erreur API.");
  }

  return body.data;
};

export const getPanneaux = async () => {
  const response = await fetch(`${API_BASE_URL}/panneaux`);
  return parseResponse(response);
};

export const getPanneauById = async (id) => {
  const response = await fetch(`${API_BASE_URL}/panneaux/${id}`);
  return parseResponse(response);
};

export const getRapport = async (id) => {
  const response = await fetch(`${API_BASE_URL}/rapport/panneau/${id}`);
  return parseResponse(response);
};

export const getPDF = (id) => {
  return `${API_BASE_URL}/rapport/panneau/${id}/pdf`;
};
