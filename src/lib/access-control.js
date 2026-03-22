const { AUTH_REQUIRED } = require("../middlewares/auth.middleware");
const { getAppRole, canSeeAllProjets, agentCanAccessProjet, filterProjetsForUser } = require("./app-role");
const { getProjetById, getAllProjets } = require("../services/projets.service");
const { getPanneauById } = require("../services/panneaux.service");

const authDisabled = () => !AUTH_REQUIRED;

/**
 * @param {import('express').Request} req
 * @param {string} projetId
 * @returns {Promise<boolean>}
 */
const assertProjetAccess = async (req, projetId) => {
  if (authDisabled() || !req.user) return true;
  const role = getAppRole(req.user);
  if (canSeeAllProjets(role)) return true;
  const projet = await getProjetById(projetId);
  if (!projet) return false;
  return agentCanAccessProjet(projet, req.user.email);
};

/**
 * @param {import('express').Request} req
 * @param {string} panneauId
 * @returns {Promise<boolean>}
 */
const assertPanneauAccess = async (req, panneauId) => {
  if (authDisabled() || !req.user) return true;
  const panneau = await getPanneauById(panneauId);
  if (!panneau) return false;
  const projetId = panneau.projetId;
  if (!projetId) return canSeeAllProjets(getAppRole(req.user));
  return assertProjetAccess(req, projetId);
};

/**
 * Filtre la liste des panneaux selon les campagnes visibles pour l'utilisateur.
 * @param {import('express').Request} req
 * @param {Array} panneaux
 */
const filterPanneauxForUser = async (req, panneaux) => {
  if (authDisabled() || !req.user || !Array.isArray(panneaux)) return panneaux || [];
  const allProjets = await getAllProjets();
  const visible = filterProjetsForUser(req.user, allProjets);
  const ids = new Set(visible.map((p) => p.id));
  return panneaux.filter((pan) => {
    if (!pan.projetId) return canSeeAllProjets(getAppRole(req.user));
    return ids.has(pan.projetId);
  });
};

module.exports = {
  assertProjetAccess,
  assertPanneauAccess,
  filterPanneauxForUser,
};
