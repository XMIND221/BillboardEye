const { randomUUID } = require("crypto");
const supabase = require("../config/supabase");

const VIDEO_BUCKET_NAME = String(process.env.VIDEO_BUCKET_NAME || "panneaux-videos").trim();

const formatSupabaseError = (context, error) => {
  const cleanError = new Error(`Erreur Supabase (${context}): ${error.message}`);
  cleanError.code = "SUPABASE_ERROR";
  cleanError.details = error;
  return cleanError;
};

const normalizeVideo = (row) => ({
  id: row.id,
  panneauId: row.panneauId ?? row.panneau_id,
  url: row.url,
  createdAt: row.createdAt ?? row.created_at,
});

const uploadVideoToSupabase = async (file) => {
  const safeOriginalName = String(file.originalname || "video.mp4").replace(/\s+/g, "_");
  const fileName = `${Date.now()}-${safeOriginalName}`;
  const filePath = `videos/${fileName}`;

  const { error: uploadError } = await supabase.storage.from(VIDEO_BUCKET_NAME).upload(filePath, file.buffer, {
    contentType: file.mimetype || "video/mp4",
    upsert: false,
  });

  if (uploadError) {
    const error = new Error(`Erreur upload vidéo Supabase Storage: ${uploadError.message}`);
    error.code = "SUPABASE_STORAGE_UPLOAD_ERROR";
    throw error;
  }

  const { data } = supabase.storage.from(VIDEO_BUCKET_NAME).getPublicUrl(filePath);
  if (!data?.publicUrl) {
    const error = new Error("Impossible de recuperer l'URL publique de la vidéo.");
    error.code = "SUPABASE_STORAGE_PUBLIC_URL_ERROR";
    throw error;
  }
  return data.publicUrl;
};

const addVideo = async (data) => {
  const payload = {
    id: data.id || randomUUID(),
    panneauId: data.panneauId,
    url: data.url,
    createdAt: data.createdAt ? new Date(data.createdAt).toISOString() : new Date().toISOString(),
  };

  let result = await supabase.from("videos").insert(payload).select().single();
  if (result.error) {
    // Fallback schemas using snake_case
    result = await supabase
      .from("videos")
      .insert({
        id: payload.id,
        panneau_id: payload.panneauId,
        url: payload.url,
        created_at: payload.createdAt,
      })
      .select()
      .single();
  }

  const { data: inserted, error } = result;
  if (error) throw formatSupabaseError("addVideo", error);
  return normalizeVideo(inserted);
};

module.exports = {
  uploadVideoToSupabase,
  addVideo,
};
