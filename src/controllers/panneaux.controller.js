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

const ALLOWED_STATUTS = new Set(["pending", "synced", "error"]);

const normalizeText = (value, max = 180) => {
  if (value == null) return undefined;
  const text = String(value).trim();
  return text.slice(0, max);
};

const parseCoordinate = (value) => {
  if (value == null || value === "") return null;
  const normalized = String(value).replace(",", ".").trim();
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
};

const validatePanneauPayload = (body = {}, { partial = false } = {}) => {
  const errors = [];
  const entreprise = normalizeText(body.entreprise, 180);
  const adresse = normalizeText(body.adresse, 400) || "";
  const nomZone = normalizeText(body.nomZone, 220);
  const projetId = normalizeText(body.projetId, 120) || null;
  const statut = body.statut != null ? String(body.statut).trim().toLowerCase() : undefined;
  const latitude = parseCoordinate(body.latitude);
  const longitude = parseCoordinate(body.longitude);

  const rawFaces = body.nombreFaces;
  const parsedFaces = rawFaces == null || rawFaces === "" ? undefined : Number.parseInt(rawFaces, 10);
  const nombreFaces =
    parsedFaces == null || Number.isNaN(parsedFaces) ? undefined : Math.max(1, Math.min(parsedFaces, 12));

  if (!partial || body.entreprise !== undefined) {
    if (!entreprise) errors.push("Le champ entreprise est obligatoire.");
  }

  if (!partial || body.latitude !== undefined) {
    if (latitude == null) errors.push("Latitude invalide.");
    else if (latitude < -90 || latitude > 90) errors.push("Latitude hors bornes (-90 a 90).");
  }

  if (!partial || body.longitude !== undefined) {
    if (longitude == null) errors.push("Longitude invalide.");
    else if (longitude < -180 || longitude > 180) errors.push("Longitude hors bornes (-180 a 180).");
  }

  if (rawFaces !== undefined && (nombreFaces == null || nombreFaces < 1)) {
    errors.push("Le nombre de faces doit etre un entier >= 1.");
  }

  if (statut !== undefined && !ALLOWED_STATUTS.has(statut)) {
    errors.push("Statut invalide (pending, synced, error).");
  }

  return {
    errors,
    value: {
      entreprise,
      latitude,
      longitude,
      adresse,
      nomZone,
      nombreFaces,
      statut,
      projetId,
      createdAt: body.createdAt,
    },
  };
};

const createPanneauHandler = async (req, res) => {
  const { errors, value } = validatePanneauPayload(req.body || {}, { partial: false });
  const { entreprise, latitude, longitude, adresse, nomZone, nombreFaces, statut, projetId, createdAt } = value;

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: errors[0],
      errors,
    });
  }

  if (projetId) {
    const allowed = await assertProjetAccess(req, projetId);
    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: "Campagne inaccessible ou permission refusee.",
      });
    }
  }

  try {
    const panneau = await createPanneau({
      entreprise,
      latitude,
      longitude,
      adresse,
      nomZone,
      nombreFaces: nombreFaces ?? 1,
      statut: statut || "pending",
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

  const { errors, value } = validatePanneauPayload(req.body || {}, { partial: true });
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: errors[0],
      errors,
    });
  }

  const patch = {
    ...req.body,
    ...(value.entreprise !== undefined ? { entreprise: value.entreprise } : {}),
    ...(value.latitude !== undefined && value.latitude !== null ? { latitude: value.latitude } : {}),
    ...(value.longitude !== undefined && value.longitude !== null ? { longitude: value.longitude } : {}),
    ...(value.adresse !== undefined ? { adresse: value.adresse } : {}),
    ...(value.nomZone !== undefined ? { nomZone: value.nomZone } : {}),
    ...(value.projetId !== undefined ? { projetId: value.projetId } : {}),
    ...(value.statut !== undefined ? { statut: value.statut } : {}),
    ...(value.nombreFaces !== undefined ? { nombreFaces: value.nombreFaces } : {}),
  };

  try {
    const panneau = await updatePanneau(req.params.id, patch);
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
