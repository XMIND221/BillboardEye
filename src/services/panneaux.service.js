const supabase = require("../config/supabase");

const formatSupabaseError = (context, error) => {
  const cleanError = new Error(`Erreur Supabase (${context}): ${error.message}`);
  cleanError.code = "SUPABASE_ERROR";
  cleanError.details = error;
  return cleanError;
};

const normalizePanneau = (row) => {
  const latitude = row?.localisation?.latitude ?? row?.latitude ?? null;
  const longitude = row?.localisation?.longitude ?? row?.longitude ?? null;
  const adresse = row?.localisation?.adresse ?? row?.adresse ?? "";

  return {
    id: row.id,
    entreprise: row.entreprise,
    projetId: row.projet_id || row.projetId || null,
    localisation: {
      latitude,
      longitude,
      adresse,
    },
    nombreFaces: row.nombreFaces ?? row.nombre_faces ?? 1,
    statut: row.statut || "pending",
    createdAt: row.createdAt || row.created_at || new Date().toISOString(),
  };
};

const createPanneau = async (data) => {
  const latitude = data.localisation?.latitude ?? data.latitude;
  const longitude = data.localisation?.longitude ?? data.longitude;
  const adresse = data.localisation?.adresse ?? data.adresse;
  const parsedLatitude = Number(latitude);
  const parsedLongitude = Number(longitude);
  const createdAt = data.createdAt ? new Date(data.createdAt).toISOString() : new Date().toISOString();

  const basePayload = {
    entreprise: data.entreprise,
    statut: data.statut || "pending",
  };

  const payloadVariants = [
    // Schema JSON "localisation" + camelCase
    {
      ...basePayload,
      projet_id: data.projetId || null,
      localisation: {
        latitude: parsedLatitude,
        longitude: parsedLongitude,
        adresse: adresse || "",
      },
      nombreFaces: data.nombreFaces ?? 1,
      createdAt,
    },
    // Schema plat snake_case
    {
      ...basePayload,
      projet_id: data.projetId || null,
      latitude: parsedLatitude,
      longitude: parsedLongitude,
      adresse: adresse || "",
      nombre_faces: data.nombreFaces ?? 1,
      created_at: createdAt,
    },
    // Schema plat camelCase
    {
      ...basePayload,
      projetId: data.projetId || null,
      latitude: parsedLatitude,
      longitude: parsedLongitude,
      adresse: adresse || "",
      nombreFaces: data.nombreFaces ?? 1,
      createdAt,
    },
    // Variantes sans "statut" (si colonne absente)
    {
      entreprise: data.entreprise,
      projet_id: data.projetId || null,
      localisation: {
        latitude: parsedLatitude,
        longitude: parsedLongitude,
        adresse: adresse || "",
      },
      nombreFaces: data.nombreFaces ?? 1,
      createdAt,
    },
    {
      entreprise: data.entreprise,
      projet_id: data.projetId || null,
      latitude: parsedLatitude,
      longitude: parsedLongitude,
      adresse: adresse || "",
      nombre_faces: data.nombreFaces ?? 1,
      created_at: createdAt,
    },
    // Variante minimale
    {
      entreprise: data.entreprise,
      latitude: parsedLatitude,
      longitude: parsedLongitude,
      adresse: adresse || "",
    },
  ];

  if (data.id) {
    payloadVariants.forEach((payload) => {
      payload.id = data.id;
    });
  }

  let lastError = null;

  for (const payload of payloadVariants) {
    const { data: inserted, error } = await supabase.from("panneaux").insert(payload).select().single();
    if (!error) {
      return normalizePanneau(inserted);
    }
    lastError = error;
  }

  throw formatSupabaseError("createPanneau", lastError || new Error("Insertion impossible."));
};

const getAllPanneaux = async () => {
  const { data, error } = await supabase.from("panneaux").select("*");

  if (error) {
    throw formatSupabaseError("getAllPanneaux", error);
  }

  return data.map(normalizePanneau);
};

const getPanneauById = async (id) => {
  const { data, error } = await supabase.from("panneaux").select("*").eq("id", id).maybeSingle();

  if (error) {
    throw formatSupabaseError("getPanneauById", error);
  }

  if (!data) {
    return null;
  }

  return normalizePanneau(data);
};

const getPanneauxByProjetId = async (projetId) => {
  const { data, error } = await supabase.from("panneaux").select("*").eq("projet_id", projetId);

  if (error) {
    throw formatSupabaseError("getPanneauxByProjetId", error);
  }

  return data.map(normalizePanneau);
};

module.exports = {
  createPanneau,
  getAllPanneaux,
  getPanneauById,
  getPanneauxByProjetId,
};
