const multer = require("multer");

const storage = multer.memoryStorage();
const ALLOWED_VIDEO_MIME_TYPES = new Set(["video/mp4", "video/quicktime", "video/webm"]);
const MAX_VIDEO_UPLOAD_SIZE_BYTES = 60 * 1024 * 1024;

const uploadVideo = multer({
  storage,
  limits: { fileSize: MAX_VIDEO_UPLOAD_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_VIDEO_MIME_TYPES.has(file.mimetype)) {
      return cb(new Error("Type de vidéo non supporté. Utilisez MP4, MOV ou WEBM."));
    }
    return cb(null, true);
  },
});

module.exports = uploadVideo;
