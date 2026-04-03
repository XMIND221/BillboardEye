const { getPanneauById } = require("../services/panneaux.service");
const { uploadVideoToSupabase, addVideo } = require("../services/videos.service");

const addVideoHandler = async (req, res) => {
  const { panneauId } = req.body || {};
  const videoFile = req.file;

  if (!panneauId) {
    return res.status(400).json({ success: false, message: "Le champ panneauId est obligatoire." });
  }
  if (!videoFile) {
    return res.status(400).json({ success: false, message: "Le fichier vidéo est obligatoire." });
  }

  let panneau;
  try {
    panneau = await getPanneauById(panneauId);
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Erreur interne lors de la verification du panneau." });
  }

  if (!panneau) {
    return res.status(404).json({ success: false, message: "Panneau introuvable." });
  }

  try {
    const videoUrl = await uploadVideoToSupabase(videoFile);
    const video = await addVideo({ panneauId, url: videoUrl });
    return res.status(201).json({ success: true, data: video });
  } catch (error) {
    console.error("[addVideoHandler] Echec:", error?.message || error, error?.details || "");
    return res.status(500).json({
      success: false,
      message: "Erreur interne lors de l'ajout de la vidéo.",
    });
  }
};

module.exports = {
  addVideoHandler,
};
