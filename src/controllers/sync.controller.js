const { syncData } = require("../services/sync.service");

const syncDataHandler = async (req, res) => {
  const { panneaux, photos } = req.body || {};

  if (!Array.isArray(panneaux) || !Array.isArray(photos)) {
    return res.status(400).json({
      success: false,
      message: "Le format attendu est { panneaux: [], photos: [] }.",
    });
  }

  try {
    const result = await syncData({ panneaux, photos });

    return res.status(200).json({
      success: true,
      data: {
        panneauxSync: result.panneauxSync,
        photosSync: result.photosSync,
      },
    });
  } catch (_error) {
    return res.status(500).json({
      success: false,
      message: "Erreur interne lors de la synchronisation.",
    });
  }
};

module.exports = {
  syncDataHandler,
};
