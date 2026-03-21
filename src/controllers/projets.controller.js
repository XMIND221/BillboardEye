const { createProjet, getAllProjets, getProjetById } = require("../services/projets.service");

const createProjetHandler = async (req, res) => {
  const {
    nom,
    entreprise,
    zone,
    duree,
    instructions,
    legendeVisuelle,
    legendeCarte,
    clientLogoUrl,
    entrepriseLogoUrl,
    couleurPrincipale,
    titreRapport,
    assignedAgent,
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
      entrepriseLogoUrl,
      couleurPrincipale,
      titreRapport,
      assignedAgent,
    });

    return res.status(201).json({
      success: true,
      data: projet,
    });
  } catch (_error) {
    return res.status(500).json({
      success: false,
      message: "Erreur interne lors de la creation du projet.",
    });
  }
};

const getAllProjetsHandler = async (_req, res) => {
  try {
    const projets = await getAllProjets();
    return res.status(200).json({
      success: true,
      data: projets,
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
