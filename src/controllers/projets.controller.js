const { createProjet, getAllProjets, getProjetById } = require("../services/projets.service");
const { AUTH_REQUIRED } = require("../middlewares/auth.middleware");
const { getAppRole, canCreateProjet, filterProjetsForUser } = require("../lib/app-role");
const { assertProjetAccess } = require("../lib/access-control");

const createProjetHandler = async (req, res) => {
  if (AUTH_REQUIRED && req.user && !canCreateProjet(getAppRole(req.user))) {
    return res.status(403).json({
      success: false,
      message: "Permission refusee : seuls les gestionnaires peuvent creer une campagne.",
    });
  }

  const {
    nom,
    entreprise,
    zone,
    duree,
    instructions,
    legendeVisuelle,
    legendeCarte,
    clientLogoUrl,
    clientLogoDataUri,
    entrepriseLogoUrl,
    entrepriseLogoDataUri,
    couleurPrincipale,
    titreRapport,
    assignedAgent,
    statut,
  } = req.body || {};

  if (!nom) {
    return res.status(400).json({
      success: false,
      message: "Le champ nom est obligatoire.",
    });
  }

  if (!entreprise) {
    return res.status(400).json({
      success: false,
      message: "Le champ entreprise est obligatoire.",
    });
  }

  try {
    const projet = await createProjet({
      nom,
      entreprise,
      zone,
      duree,
      instructions,
      legendeVisuelle,
      legendeCarte,
      clientLogoUrl,
      clientLogoDataUri,
      entrepriseLogoUrl,
      entrepriseLogoDataUri,
      couleurPrincipale,
      titreRapport,
      assignedAgent,
      statut,
    });

    return res.status(201).json({
      success: true,
      data: projet,
    });
  } catch (err) {
    console.error("[projets] createProjet:", err?.message || err);
    return res.status(500).json({
      success: false,
      message: "Erreur interne lors de la creation du projet.",
    });
  }
};

const getAllProjetsHandler = async (req, res) => {
  try {
    const projets = await getAllProjets();
    const data = filterProjetsForUser(req.user, projets);
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (_error) {
    return res.status(500).json({
      success: false,
      message: "Erreur interne lors de la recuperation des projets.",
    });
  }
};

const getProjetByIdHandler = async (req, res) => {
  let projet;

  try {
    projet = await getProjetById(req.params.id);
  } catch (_error) {
    return res.status(500).json({
      success: false,
      message: "Erreur interne lors de la recuperation du projet.",
    });
  }

  if (!projet) {
    return res.status(404).json({
      success: false,
      message: "Projet introuvable.",
    });
  }

  const allowed = await assertProjetAccess(req, req.params.id);
  if (!allowed) {
    return res.status(404).json({
      success: false,
      message: "Projet introuvable.",
    });
  }

  return res.status(200).json({
    success: true,
    data: projet,
  });
};

module.exports = {
  createProjetHandler,
  getAllProjetsHandler,
  getProjetByIdHandler,
};
