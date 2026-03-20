const { getPanneauById } = require("../services/panneaux.service");
const { uploadToSupabase, addPhoto, getPhotosByPanneauId } = require("../services/photos.service");

const ALLOWED_TYPES = ["faceA", "faceB"];

const addPhotoHandler = async (req, res) => {
  const { panneauId, type } = req.body;
  const imageFile = req.file;

  if (!panneauId) {
    return res.status(400).json({
      success: false,
      message: "Le champ panneauId est obligatoire.",
    });
  }

  if (!type) {
    return res.status(400).json({
      success: false,
      message: "Le champ type est obligatoire.",
    });
  }

  if (!ALLOWED_TYPES.includes(type)) {
    return res.status(400).json({
      success: false,
      message: "Le champ type doit etre faceA ou faceB.",
    });
  }

  if (!imageFile) {
    return res.status(400).json({
      success: false,
      message: "Le fichier image est obligatoire.",
    });
  }

  let panneau;

  try {
    panneau = await getPanneauById(panneauId);
  } catch (_error) {
    return res.status(500).json({
      success: false,
      message: "Erreur interne lors de la verification du panneau.",
    });
  }

  if (!panneau) {
    return res.status(404).json({
      success: false,
      message: "Panneau introuvable.",
    });
  }

  try {
    const photoUrl = await uploadToSupabase(imageFile);
    const photo = await addPhoto({ panneauId, type, url: photoUrl });

    return res.status(201).json({
      success: true,
      data: photo,
    });
  } catch (error) {
    console.error("[addPhotoHandler] Echec:", error?.message || error, error?.details || "");
    if (
      error.code === "SUPABASE_STORAGE_UPLOAD_ERROR" ||
      error.code === "SUPABASE_STORAGE_PUBLIC_URL_ERROR"
    ) {
      return res.status(500).json({
        success: false,
        message: "Echec de l'upload de l'image vers Supabase Storage.",
      });
    }

    if (error.code === "PHOTO_DUPLICATE_FACE") {
      return res.status(409).json({
        success: false,
        message: "Cette face est deja ajoutee pour ce panneau.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Erreur interne lors de l'ajout de la photo.",
    });
  }
};

const getPhotosByPanneauIdHandler = async (req, res) => {
  const panneauId = req.params.id;
  try {
    const photos = await getPhotosByPanneauId(panneauId);

    return res.status(200).json({
      success: true,
      data: photos,
    });
  } catch (_error) {
    return res.status(500).json({
      success: false,
      message: "Erreur interne lors de la recuperation des photos.",
    });
  }
};

module.exports = {
  addPhotoHandler,
  getPhotosByPanneauIdHandler,
};
