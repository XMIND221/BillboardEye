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
  const nomZone =
    row?.nomZone ??
    row?.nom_zone ??
    row?.localisation?.nomZone ??
    row?.localisation?.nom_zone ??
    "";

  return {
    id: row.id,
    entreprise: row.entreprise,
    projetId: row.projet_id || row.projetId || null,
    nomZone: nomZone ? String(nomZone).trim() : "",
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
  const nomZoneRaw = data.nomZone ?? data.nom_zone ?? data.localisation?.nomZone ?? "";
  const nom_zone = nomZoneRaw != null && String(nomZoneRaw).trim() !== "" ? String(nomZoneRaw).trim() : null;
  const parsedLatitude = Number(latitude);
  const parsedLongitude = Number(longitude);
  const createdAt = data.createdAt ? new Date(data.createdAt).toISOString() : new Date().toISOString();

  const basePayload = {
    entreprise: data.entreprise,
    statut: data.statut || "pending",
    ...(nom_zone != null ? { nom_zone } : {}),
  };

  const nomZoneField = nom_zone != null ? { nom_zone } : {};

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
      ...nomZoneField,
    },
    {
      entreprise: data.entreprise,
      projet_id: data.projetId || null,
      latitude: parsedLatitude,
      longitude: parsedLongitude,
      adresse: adresse || "",
      nombre_faces: data.nombreFaces ?? 1,
      created_at: createdAt,
      ...nomZoneField,
    },
    // Variante minimale
    {
      entreprise: data.entreprise,
      latitude: parsedLatitude,
      longitude: parsedLongitude,
      adresse: adresse || "",
      ...nomZoneField,
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

const updatePanneau = async (id, data) => {
  const existing = await getPanneauById(id);
  if (!existing) return null;

  const latIn = data.localisation?.latitude ?? data.latitude;
  const lngIn = data.localisation?.longitude ?? data.longitude;
  const adresseIn = data.localisation?.adresse ?? data.adresse;
  const nomZoneRaw = data.nomZone ?? data.nom_zone ?? data.localisation?.nomZone;
  const nom_zone =
    nomZoneRaw !== undefined
      ? nomZoneRaw != null && String(nomZoneRaw).trim() !== ""
        ? String(nomZoneRaw).trim()
        : null
      : existing.nomZone
        ? String(existing.nomZone).trim()
        : null;

  const lat = latIn !== undefined ? Number(latIn) : Number(existing.localisation?.latitude);
  const lng = lngIn !== undefined ? Number(lngIn) : Number(existing.localisation?.longitude);
  const adresse = adresseIn !== undefined ? adresseIn || "" : existing.localisation?.adresse || "";

  const basePatch = {
    entreprise: data.entreprise != null ? data.entreprise : existing.entreprise,
    statut: data.statut != null ? data.statut : existing.statut,
    projet_id: data.projetId !== undefined ? data.projetId || null : existing.projetId || null,
  };

  const variants = [
    {
      ...basePatch,
      nom_zone,
      localisation: { latitude: lat, longitude: lng, adresse },
      nombreFaces: data.nombreFaces != null ? data.nombreFaces : existing.nombreFaces ?? 1,
    },
    {
      ...basePatch,
      nom_zone,
      latitude: lat,
      longitude: lng,
      adresse,
      nombre_faces: data.nombreFaces != null ? data.nombreFaces : existing.nombreFaces ?? 1,
    },
  ];

  let lastError = null;
  for (const patch of variants) {
    const { data: row, error } = await supabase.from("panneaux").update(patch).eq("id", id).select().single();
    if (!error) {
      return normalizePanneau(row);
    }
    lastError = error;
  }

  throw formatSupabaseError("updatePanneau", lastError || new Error("Mise à jour impossible."));
};

const deletePanneau = async (id) => {
  const { error } = await supabase.from("panneaux").delete().eq("id", id);
  if (error) {
    throw formatSupabaseError("deletePanneau", error);
  }
  return true;
};

module.exports = {
  createPanneau,
  getAllPanneaux,
  getPanneauById,
  getPanneauxByProjetId,
  updatePanneau,
  deletePanneau,
};
