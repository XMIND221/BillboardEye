const { uploadLogoToSupabase } = require("../services/photos.service");

const uploadLogoHandler = async (req, res) => {
  const file = req.file;

  if (!file) {
    return res.status(400).json({
      success: false,
      message: "Fichier image obligatoire.",
    });
  }

  try {
    const url = await uploadLogoToSupabase(file);
    return res.status(200).json({
      success: true,
      data: { url },
    });
  } catch (error) {
    console.error("[uploadLogo] Erreur:", error?.message || error);
    return res.status(500).json({
      success: false,
      message: error?.message || "Erreur lors de l'upload du logo.",
    });
  }
};

module.exports = { uploadLogoHandler };
