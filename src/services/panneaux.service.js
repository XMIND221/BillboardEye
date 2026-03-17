const supabase = require("../config/supabase");

const formatSupabaseError = (context, error) => {
  const cleanError = new Error(`Erreur Supabase (${context}): ${error.message}`);
  cleanError.code = "SUPABASE_ERROR";
  cleanError.details = error;
  return cleanError;
};

const normalizePanneau = (row) => {
  return {
    id: row.id,
    entreprise: row.entreprise,
    localisation: row.localisation || {
      latitude: row.latitude ?? null,
      longitude: row.longitude ?? null,
      adresse: row.adresse || "",
    },
    nombreFaces: row.nombreFaces ?? 1,
    statut: row.statut || "pending",
    createdAt: row.createdAt,
  };
};

const createPanneau = async (data) => {
  const latitude = data.localisation?.latitude ?? data.latitude;
  const longitude = data.localisation?.longitude ?? data.longitude;
  const adresse = data.localisation?.adresse ?? data.adresse;

  const payload = {
    entreprise: data.entreprise,
    localisation: {
      latitude: Number(latitude),
      longitude: Number(longitude),
      adresse: adresse || "",
    },
    nombreFaces: data.nombreFaces ?? 1,
    statut: data.statut || "pending",
    createdAt: data.createdAt ? new Date(data.createdAt).toISOString() : new Date().toISOString(),
  };

  if (data.id) {
    payload.id = data.id;
  }

  const { data: inserted, error } = await supabase.from("panneaux").insert(payload).select().single();

  if (error) {
    throw formatSupabaseError("createPanneau", error);
  }

  return normalizePanneau(inserted);
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

module.exports = {
  createPanneau,
  getAllPanneaux,
  getPanneauById,
};
