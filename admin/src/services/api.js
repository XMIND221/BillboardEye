import { RAILWAY_API_BASE_URL } from "../constants/railway";

const API_BASE_URL =
  String(import.meta.env.VITE_API_BASE_URL || "").trim() ||
  String(import.meta.env.VITE_RAILWAY_API_URL || "").trim() ||
  RAILWAY_API_BASE_URL;

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

export const getProjets = async () => {
  const response = await fetch(`${API_BASE_URL}/projets`);
  return parseResponse(response);
};

export const getProjetById = async (id) => {
  const response = await fetch(`${API_BASE_URL}/projets/${id}`);
  return parseResponse(response);
};

export const getPanneauxByProjet = async (projetId) => {
  const panneaux = await getPanneaux();
  return panneaux.filter((panneau) => panneau.projetId === projetId);
};

export const getPanneauById = async (id) => {
  const response = await fetch(`${API_BASE_URL}/panneaux/${id}`);
  return parseResponse(response);
};

export const getRapport = async (id) => {
  const response = await fetch(`${API_BASE_URL}/rapport/panneau/${id}`);
  return parseResponse(response);
};

export const getRapportProjet = async (id) => {
  const response = await fetch(`${API_BASE_URL}/rapport/projet/${id}`);
  return parseResponse(response);
};

export const getPDF = (id) => {
  return `${API_BASE_URL}/rapport/panneau/${id}/pdf`;
};

export const getProjetPDFUrl = async (id) => {
  const response = await fetch(`${API_BASE_URL}/rapport/projet/${id}/pdf-url`);
  return parseResponse(response);
};

export const getProjetPDF = (id) => {
  return `${API_BASE_URL}/rapport/projet/${id}/pdf`;
};
