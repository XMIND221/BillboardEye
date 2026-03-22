const {
  createPanneau,
  getAllPanneaux,
  getPanneauById,
} = require("../services/panneaux.service");
const { assertProjetAccess, assertPanneauAccess, filterPanneauxForUser } = require("../lib/access-control");

const createPanneauHandler = async (req, res) => {
  const { entreprise, latitude, longitude, adresse, nomZone, nombreFaces, statut, projetId, createdAt } = req.body;

  if (projetId) {
    const allowed = await assertProjetAccess(req, projetId);
    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: "Campagne inaccessible ou permission refusee.",
      });
    }
  }

  if (!entreprise) {
    return res.status(400).json({
      success: false,
      message: "Le champ entreprise est obligatoire.",
    });
  }

  if (latitude === undefined) {
    return res.status(400).json({
      success: false,
      message: "Le champ latitude est obligatoire.",
    });
  }

  if (longitude === undefined) {
    return res.status(400).json({
      success: false,
      message: "Le champ longitude est obligatoire.",
    });
  }

  try {
    const panneau = await createPanneau({
      entreprise,
      latitude: Number(latitude),
      longitude: Number(longitude),
      adresse,
      nomZone,
      nombreFaces,
      statut,
      projetId,
      createdAt,
    });

    return res.status(201).json({
      success: true,
      data: panneau,
    });
  } catch (error) {
    console.error("[createPanneauHandler] Echec creation panneau:", error?.message || error);
    return res.status(500).json({
      success: false,
      message: "Erreur interne lors de la creation du panneau.",
    });
  }
};

const getAllPanneauxHandler = async (req, res) => {
  try {
    const panneaux = await getAllPanneaux();
    const data = await filterPanneauxForUser(req, panneaux);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (_error) {
    return res.status(500).json({
      success: false,
      message: "Erreur interne lors de la recuperation des panneaux.",
    });
  }
};

const getPanneauByIdHandler = async (req, res) => {
  let panneau;

  try {
    panneau = await getPanneauById(req.params.id);
  } catch (_error) {
    return res.status(500).json({
      success: false,
      message: "Erreur interne lors de la recuperation du panneau.",
    });
  }

  if (!panneau) {
    return res.status(404).json({
      success: false,
      message: "Panneau introuvable.",
    });
  }

  const allowed = await assertPanneauAccess(req, req.params.id);
  if (!allowed) {
    return res.status(404).json({
      success: false,
      message: "Panneau introuvable.",
    });
  }

  return res.status(200).json({
    success: true,
    data: panneau,
  });
};

module.exports = {
  createPanneauHandler,
  getAllPanneauxHandler,
  getPanneauByIdHandler,
};
