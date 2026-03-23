import { parseZones } from "../services/missionStorage";

/** @typedef {'actif' | 'attente' | 'termine' | 'probleme' | 'syncing'} VisualTone */

/**
 * Campagne : combine statut métier + synthèse rapport (total/complété).
 * @param {{ statut?: string, status?: string }} campaign — status = Terminée | En cours | Vide depuis metrics
 * @returns {VisualTone}
 */
export function getCampaignVisualTone(campaign) {
  const st = String(campaign?.statut || "active").toLowerCase();
  const rep = campaign?.status;

  if (st === "archived") return "probleme";
  if (rep === "Terminée" || st === "completed") return "termine";
  if (rep === "Vide" || st === "planned") return "attente";
  return "actif";
}

/**
 * @param {{ statut?: string }} panneau
 * @returns {VisualTone}
 */
export function getPanneauVisualTone(panneau) {
  const s = String(panneau?.statut || "pending").toLowerCase();
  if (s === "error") return "probleme";
  if (s === "syncing") return "syncing";
  if (s === "synced") return "termine";
  if (s === "pending") return "attente";
  return "actif";
}

/**
 * Zones distinctes pour filtres (campagnes).
 * @param {Array<{ zone?: string }>} campaigns
 */
export function collectCampaignZones(campaigns) {
  const set = new Set();
  (campaigns || []).forEach((c) => {
    parseZones(c?.zone).forEach((z) => set.add(z));
  });
  return Array.from(set).sort((a, b) => a.localeCompare(b, "fr"));
}

/**
 * Zones / noms distincts pour panneaux.
 * @param {Array<{ nomZone?: string }>} panneaux
 */
export function collectPanneauZones(panneaux) {
  const set = new Set();
  (panneaux || []).forEach((p) => {
    const z = p?.nomZone && String(p.nomZone).trim();
    if (z) set.add(z);
  });
  return Array.from(set).sort((a, b) => a.localeCompare(b, "fr"));
}
