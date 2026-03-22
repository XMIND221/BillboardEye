/**
 * Téléchargement d’images (Supabase storage + URLs publiques) pour rapports PDF.
 */
const supabase = require("../config/supabase");
const { createClient } = require("@supabase/supabase-js");

const fetch = typeof globalThis.fetch === "function" ? globalThis.fetch : require("node-fetch");

const PHOTOS_BUCKET = "panneaux-images";

const supabaseStorage = process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : supabase;

const getStoragePath = (url) => {
  if (!url || typeof url !== "string") return null;
  const idx = url.indexOf(`/${PHOTOS_BUCKET}/`);
  if (idx !== -1) {
    const p = url.substring(idx + PHOTOS_BUCKET.length + 2).split("?")[0];
    return p ? decodeURIComponent(p) : null;
  }
  if (url.startsWith(`${PHOTOS_BUCKET}/`)) {
    return decodeURIComponent(url.substring(PHOTOS_BUCKET.length + 1).split("?")[0]);
  }
  if (url.startsWith("photos/") || (!url.startsWith("http") && url.includes("/"))) {
    return url.split("?")[0];
  }
  return null;
};

const fetchImageAsBuffer = async (url) => {
  if (!url || typeof url !== "string") return null;
  const storagePath = getStoragePath(url);
  if (storagePath) {
    try {
      const { data, error } = await supabaseStorage.storage.from(PHOTOS_BUCKET).download(storagePath);
      if (!error && data) return Buffer.from(await data.arrayBuffer());
    } catch (_) {}
  }
  try {
    const res = await fetch(url);
    if (res.ok) return Buffer.from(await res.arrayBuffer());
  } catch (_) {}
  return null;
};

module.exports = {
  PHOTOS_BUCKET,
  getStoragePath,
  fetchImageAsBuffer,
};
