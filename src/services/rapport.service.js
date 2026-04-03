const { getPanneauById, getPanneauxByProjetId } = require("./panneaux.service");
const { getPhotosByPanneauId, getAllPhotos } = require("./photos.service");
const { getProjetById } = require("./projets.service");

const normalizeFaceType = (value) => {
  const t = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_\s-]/g, "");
  if (t === "facea") return "faceA";
  if (t === "faceb") return "faceB";
  return "";
};

const byNewestFirst = (a, b) => {
  const ta = new Date(a?.createdAt || 0).getTime();
  const tb = new Date(b?.createdAt || 0).getTime();
  return (Number.isFinite(tb) ? tb : 0) - (Number.isFinite(ta) ? ta : 0);
};

/**
 * Sélectionne la photo la plus récente et exploitable pour une face.
 * Permet de contourner les anciennes URLs cassées laissées en base.
 */
const pickBestFacePhoto = (photos, face) => {
  const target = face === "faceA" ? "faceA" : "faceB";
  return (Array.isArray(photos) ? photos : [])
    .filter((p) => normalizeFaceType(p?.type) === target)
    .filter((p) => typeof p?.url === "string" && p.url.trim() !== "")
    .sort(byNewestFirst)[0] || null;
};

const isUsablePhoto = (photo) => typeof photo?.url === "string" && photo.url.trim() !== "";

/**
 * Un rapport campagne ne doit contenir que des panneaux liés à cette campagne (PDF / JSON).
 * Filtrage défensif si la base renvoie des lignes incohérentes.
 */
const ensureReportPanneauxMatchProjet = (report) => {
  if (!report?.projet?.id) return report;
  const projetId = String(report.projet.id);
  const list = Array.isArray(report.panneaux) ? report.panneaux : [];
  const next = list.filter((p) => {
    const pid = p?.projetId != null && p.projetId !== "" ? String(p.projetId) : "";
    return pid === projetId;
  });
  if (next.length !== list.length) {
    console.warn(
      `[rapport] Campagne ${projetId}: ${list.length - next.length} panneau(x) exclus (projet_id différent ou absent).`,
    );
  }
  const completed = next.filter((p) => p.isComplete).length;
  return {
    ...report,
    projet: { ...report.projet },
    panneaux: next,
    summary: {
      ...(report.summary || {}),
      total: next.length,
      completed,
      remaining: next.length - completed,
    },
  };
};

const getPanneauReport = async (panneauId) => {
  const panneau = await getPanneauById(panneauId);

  if (!panneau) {
    return null;
  }

  const panneauPhotos = await getPhotosByPanneauId(panneauId);
  const faceA = pickBestFacePhoto(panneauPhotos, "faceA");
  const faceB = pickBestFacePhoto(panneauPhotos, "faceB");

  return {
    panneau,
    photos: {
      faceA,
      faceB,
    },
    isComplete: Boolean(faceA && faceB),
  };
};

const getProjetReport = async (projetId) => {
  const projet = await getProjetById(projetId);
  if (!projet) {
    return null;
  }

  const panneaux = await getPanneauxByProjetId(projetId);
  const panneauxWithPhotos = [];
  const panelIdSet = new Set((panneaux || []).map((p) => String(p.id)));

  // File de secours: photos orphelines (IDs de panneau incohérents), triées du plus récent au plus ancien.
  const fallbackByType = { faceA: [], faceB: [] };
  try {
    const all = await getAllPhotos();
    const orphans = all
      .filter((p) => isUsablePhoto(p))
      .filter((p) => !panelIdSet.has(String(p.panneauId || "")))
      .sort(byNewestFirst);
    for (const p of orphans) {
      const t = normalizeFaceType(p.type);
      if (t === "faceA" || t === "faceB") fallbackByType[t].push(p);
    }
  } catch (_) {}

  const takeFallback = (type) => {
    const key = type === "faceA" ? "faceA" : "faceB";
    const list = fallbackByType[key];
    return list.length ? list.shift() : null;
  };

  for (const panneau of panneaux) {
    const panneauPhotos = await getPhotosByPanneauId(panneau.id);
    let faceA = pickBestFacePhoto(panneauPhotos, "faceA");
    let faceB = pickBestFacePhoto(panneauPhotos, "faceB");

    // Auto-réparation: si une face manque à cause de liaisons cassées, on utilise la meilleure photo orpheline.
    if (!faceA) faceA = takeFallback("faceA");
    if (!faceB) faceB = takeFallback("faceB");

    panneauxWithPhotos.push({
      ...panneau,
      photos: { faceA, faceB },
      isComplete: Boolean(faceA && faceB),
    });
  }

  return ensureReportPanneauxMatchProjet({
    projet,
    panneaux: panneauxWithPhotos,
    summary: {},
  });
};

module.exports = {
  getPanneauReport,
  getProjetReport,
  ensureReportPanneauxMatchProjet,
};
