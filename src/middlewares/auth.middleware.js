const supabase = require("../config/supabase");

const AUTH_REQUIRED = process.env.AUTH_REQUIRED === "true";

const authMiddleware = async (req, res, next) => {
  if (!AUTH_REQUIRED) {
    return next();
  }

  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Token d'authentification requis.",
    });
  }

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: "Token invalide ou expiré.",
      });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("[auth] Erreur verification token:", err?.message);
    return res.status(401).json({
      success: false,
      message: "Erreur d'authentification.",
    });
  }
};

module.exports = { authMiddleware, AUTH_REQUIRED };
