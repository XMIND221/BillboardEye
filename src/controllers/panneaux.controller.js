const {
  createPanneau,
  getAllPanneaux,
  getPanneauById,
} = require("../services/panneaux.service");

const createPanneauHandler = async (req, res) => {
  const { entreprise, latitude, longitude, adresse, nombreFaces, statut } = req.body;

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
      nombreFaces,
      statut,
    });

    return res.status(201).json({
      success: true,
      data: panneau,
    });
  } catch (_error) {
    return res.status(500).json({
      success: false,
      message: "Erreur interne lors de la creation du panneau.",
    });
  }
};

const getAllPanneauxHandler = async (_req, res) => {
  try {
    const panneaux = await getAllPanneaux();

    return res.status(200).json({
      success: true,
      data: panneaux,
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
