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

const UNIQUE_BUCKETS = [...new Set([PHOTOS_BUCKET, "photos", "panneaux-pdf"])];

const getStoragePath = (url) => {
  if (!url || typeof url !== "string") return null;
  const raw = String(url).trim();
  if (!raw) return null;

  // 1) URL publique Supabase: .../storage/v1/object/public/<bucket>/<path>
  // 2) URL signée Supabase:  .../storage/v1/object/sign/<bucket>/<path>?token=...
  // 3) Forme interne: "<bucket>/<path>" ou "photos/<file>"
  const m = raw.match(/\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.+)$/i);
  if (m) {
    const bucket = decodeURIComponent(m[1] || "").trim();
    const path = decodeURIComponent((m[2] || "").split("?")[0] || "").trim();
    if (bucket && path) return { bucket, path };
  }

  if (raw.startsWith(`${PHOTOS_BUCKET}/`)) {
    const path = decodeURIComponent(raw.substring(PHOTOS_BUCKET.length + 1).split("?")[0] || "").trim();
    return path ? { bucket: PHOTOS_BUCKET, path } : null;
  }

  if (!raw.startsWith("http") && raw.includes("/")) {
    const [bucket, ...rest] = raw.split("/");
    const path = rest.join("/").split("?")[0];
    if (bucket && path) return { bucket: bucket.trim(), path: decodeURIComponent(path).trim() };
  }

  if (raw.startsWith("photos/")) {
    return { bucket: PHOTOS_BUCKET, path: raw.split("?")[0] };
  }

  return null;
};

const buildFallbackRefs = (storageRef) => {
  if (!storageRef?.path) return [];
  const refs = [];
  const path = String(storageRef.path || "").trim();
  if (!path) return refs;

  // Essai direct (bucket/path détectés depuis URL)
  if (storageRef.bucket) refs.push({ bucket: storageRef.bucket, path });

  // Essai bucket principal avec même path
  refs.push({ bucket: PHOTOS_BUCKET, path });

  // Essai en retirant un éventuel préfixe bucket dans le path
  const [firstSeg, ...rest] = path.split("/");
  if (rest.length > 0 && UNIQUE_BUCKETS.includes(firstSeg)) {
    refs.push({ bucket: PHOTOS_BUCKET, path: rest.join("/") });
  }

  // Essais cross-bucket (legacy)
  for (const b of UNIQUE_BUCKETS) refs.push({ bucket: b, path });

  // Dédupe
  const seen = new Set();
  return refs.filter((r) => {
    const k = `${r.bucket}::${r.path}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
};

const fetchImageAsBuffer = async (url) => {
  if (!url || typeof url !== "string") return null;
  const storageRef = getStoragePath(url);
  if (storageRef) {
    const refs = buildFallbackRefs(storageRef);
    for (const ref of refs) {
      try {
        const { data, error } = await supabaseStorage.storage.from(ref.bucket).download(ref.path);
        if (!error && data) return Buffer.from(await data.arrayBuffer());
      } catch (_) {}
    }
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
