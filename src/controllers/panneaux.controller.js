const {
  createPanneau,
  getAllPanneaux,
  getPanneauById,
  updatePanneau,
  deletePanneau,
} = require("../services/panneaux.service");
const {
  assertProjetAccess,
  assertPanneauAccess,
  filterPanneauxForUser,
} = require("../lib/access-control");

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

const updatePanneauHandler = async (req, res) => {
  const allowed = await assertPanneauAccess(req, req.params.id);
  if (!allowed) {
    return res.status(404).json({
      success: false,
      message: "Panneau introuvable.",
    });
  }

  if (req.body?.projetId) {
    const okProjet = await assertProjetAccess(req, req.body.projetId);
    if (!okProjet) {
      return res.status(403).json({
        success: false,
        message: "Campagne inaccessible ou permission refusee.",
      });
    }
  }

  try {
    const panneau = await updatePanneau(req.params.id, req.body || {});
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
  } catch (error) {
    console.error("[updatePanneauHandler]", error?.message || error);
    return res.status(500).json({
      success: false,
      message: "Erreur interne lors de la mise a jour du panneau.",
    });
  }
};

const deletePanneauHandler = async (req, res) => {
  const allowed = await assertPanneauAccess(req, req.params.id);
  if (!allowed) {
    return res.status(404).json({
      success: false,
      message: "Panneau introuvable.",
    });
  }

  try {
    const existing = await getPanneauById(req.params.id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Panneau introuvable.",
      });
    }
    await deletePanneau(req.params.id);
    return res.status(200).json({
      success: true,
      data: { deleted: true, id: req.params.id },
    });
  } catch (error) {
    console.error("[deletePanneauHandler]", error?.message || error);
    return res.status(500).json({
      success: false,
      message: "Erreur interne lors de la suppression du panneau.",
    });
  }
};

module.exports = {
  createPanneauHandler,
  getAllPanneauxHandler,
  getPanneauByIdHandler,
  updatePanneauHandler,
  deletePanneauHandler,
};
