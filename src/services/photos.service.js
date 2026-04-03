const supabase = require("../config/supabase");

const formatSupabaseError = (context, error) => {
  const cleanError = new Error(`Erreur Supabase (${context}): ${error.message}`);
  cleanError.code = "SUPABASE_ERROR";
  cleanError.details = error;
  return cleanError;
};

const normalizePhoto = (row) => {
  return {
    id: row.id,
    panneauId: row.panneauId ?? row.panneau_id,
    type: row.type,
    url: row.url,
    createdAt: row.createdAt ?? row.created_at,
  };
};

const uploadToSupabase = async (file) => {
  const safeOriginalName = file.originalname.replace(/\s+/g, "_");
  const fileName = `${Date.now()}-${safeOriginalName}`;
  const filePath = `photos/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("panneaux-images")
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (uploadError) {
    const error = new Error(`Erreur upload Supabase Storage: ${uploadError.message}`);
    error.code = "SUPABASE_STORAGE_UPLOAD_ERROR";
    throw error;
  }

  const { data } = supabase.storage.from("panneaux-images").getPublicUrl(filePath);

  if (!data?.publicUrl) {
    const error = new Error("Impossible de recuperer l'URL publique de l'image.");
    error.code = "SUPABASE_STORAGE_PUBLIC_URL_ERROR";
    throw error;
  }

  return data.publicUrl;
};

const uploadLogoToSupabase = async (file) => {
  const ext = (file.originalname || "").split(".").pop() || "jpg";
  const fileName = `logo-${Date.now()}.${ext}`;
  const filePath = `logos/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("panneaux-images")
    .upload(filePath, file.buffer, {
      contentType: file.mimetype || "image/jpeg",
      upsert: false,
    });

  if (uploadError) {
    const err = new Error(`Erreur upload logo: ${uploadError.message}`);
    err.code = "SUPABASE_STORAGE_UPLOAD_ERROR";
    throw err;
  }

  const { data } = supabase.storage.from("panneaux-images").getPublicUrl(filePath);
  if (!data?.publicUrl) {
    const err = new Error("Impossible de recuperer l'URL du logo.");
    err.code = "SUPABASE_STORAGE_PUBLIC_URL_ERROR";
    throw err;
  }
  return data.publicUrl;
};

const MAX_LOGO_FROM_BODY_BYTES = 6 * 1024 * 1024;

/**
 * Enregistre un logo depuis une data-URI (création campagne en un seul appel JSON).
 * @param {string} dataUri ex. data:image/jpeg;base64,/9j/4AAQ...
 * @returns {Promise<string|null>} URL publique ou null si invalide
 */
const uploadLogoFromDataUri = async (dataUri) => {
  const s = String(dataUri || "").trim();
  const marker = ";base64,";
  const idx = s.indexOf(marker);
  if (idx === -1 || !s.toLowerCase().startsWith("data:image/")) {
    return null;
  }
  const meta = s.slice("data:".length, idx).toLowerCase();
  const b64 = s.slice(idx + marker.length).replace(/\s/g, "");
  if (!b64 || !/^[A-Za-z0-9+/=]+$/.test(b64)) {
    return null;
  }
  let buffer;
  try {
    buffer = Buffer.from(b64, "base64");
  } catch {
    return null;
  }
  if (!buffer?.length || buffer.length > MAX_LOGO_FROM_BODY_BYTES) {
    return null;
  }
  let mime = "image/jpeg";
  if (meta.includes("image/png")) mime = "image/png";
  else if (meta.includes("image/webp")) mime = "image/webp";
  else if (meta.includes("image/gif")) mime = "image/gif";
  const ext =
    mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : mime === "image/gif" ? "gif" : "jpg";
  const fileName = `logo-${Date.now()}.${ext}`;
  const filePath = `logos/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("panneaux-images")
    .upload(filePath, buffer, {
      contentType: mime,
      upsert: false,
    });

  if (uploadError) {
    const err = new Error(`Erreur upload logo (data URI): ${uploadError.message}`);
    err.code = "SUPABASE_STORAGE_UPLOAD_ERROR";
    throw err;
  }

  const { data } = supabase.storage.from("panneaux-images").getPublicUrl(filePath);
  if (!data?.publicUrl) {
    const err = new Error("Impossible de recuperer l'URL du logo.");
    err.code = "SUPABASE_STORAGE_PUBLIC_URL_ERROR";
    throw err;
  }
  return data.publicUrl;
};

const { randomUUID } = require("crypto");

const addPhoto = async (data) => {
  const panneauId = data.panneauId;
  const type = data.type;
  const url = data.url;
  const createdAt = data.createdAt ? new Date(data.createdAt).toISOString() : new Date().toISOString();

  let existing = null;
  let duplicateCheckError = null;
  ({ data: existing, error: duplicateCheckError } = await supabase
    .from("photos")
    .select("id")
    .eq("panneau_id", panneauId)
    .eq("type", type)
    .maybeSingle());
  if (duplicateCheckError) {
    ({ data: existing, error: duplicateCheckError } = await supabase
      .from("photos")
      .select("id")
      .eq("panneauId", panneauId)
      .eq("type", type)
      .maybeSingle());
  }
  if (duplicateCheckError) {
    throw formatSupabaseError("addPhoto:duplicateCheck", duplicateCheckError);
  }

  if (existing) {
    const duplicateError = new Error("Cette face existe deja pour ce panneau.");
    duplicateError.code = "PHOTO_DUPLICATE_FACE";
    throw duplicateError;
  }

  const payload = {
    id: data.id || randomUUID(),
    panneauId,
    type,
    url,
    createdAt,
  };

  const { data: inserted, error } = await supabase.from("photos").insert(payload).select().single();

  if (error) {
    throw formatSupabaseError("addPhoto", error);
  }

  return normalizePhoto(inserted);
};

const getPhotosByPanneauId = async (panneauId) => {
  let result = await supabase.from("photos").select("*").eq("panneau_id", panneauId);
  if (result.error) {
    result = await supabase.from("photos").select("*").eq("panneauId", panneauId);
  }
  const { data, error } = result;

  if (error) {
    throw formatSupabaseError("getPhotosByPanneauId", error);
  }

  return (data || []).map(normalizePhoto);
};

const getAllPhotos = async () => {
  let result = await supabase.from("photos").select("*");
  if (result.error) {
    // Some schemas keep camelCase column names
    result = await supabase.from("photos").select("id,panneauId,type,url,createdAt");
  }
  const { data, error } = result;
  if (error) {
    throw formatSupabaseError("getAllPhotos", error);
  }
  return (data || []).map(normalizePhoto);
};

module.exports = {
  uploadToSupabase,
  uploadLogoToSupabase,
  uploadLogoFromDataUri,
  addPhoto,
  getPhotosByPanneauId,
  getAllPhotos,
};
