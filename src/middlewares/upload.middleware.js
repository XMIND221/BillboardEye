const multer = require("multer");

const storage = multer.memoryStorage();
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;

const upload = multer({
  storage,
  limits: { fileSize: MAX_UPLOAD_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return cb(new Error("Type de fichier non supporté. Utilisez JPG, PNG ou WEBP."));
    }
    return cb(null, true);
  },
});

module.exports = upload;
