const express = require("express");
const supabase = require("../config/supabase");
const { authMiddleware } = require("../middlewares/auth.middleware");

const router = express.Router();

/**
 * POST /auth/login
 * Body: { email, password }
 * Retourne: { user, session: { access_token, refresh_token } }
 */
router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email et mot de passe requis.",
    });
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return res.status(401).json({
        success: false,
        message: error.message || "Identifiants incorrects.",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        user: data.user,
        session: data.session,
      },
    });
  } catch (err) {
    console.error("[auth/login]", err?.message);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la connexion.",
    });
  }
});

/**
 * POST /auth/register
 * Body: { email, password }
 */
router.post("/register", async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email et mot de passe requis.",
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: "Le mot de passe doit contenir au moins 6 caractères.",
    });
  }

  try {
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message || "Impossible de créer le compte.",
      });
    }

    return res.status(201).json({
      success: true,
      data: {
        user: data.user,
        session: data.session,
      },
    });
  } catch (err) {
    console.error("[auth/register]", err?.message);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de l'inscription.",
    });
  }
});

/**
 * GET /auth/me
 * Requiert: Authorization: Bearer <token>
 */
router.get("/me", authMiddleware, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Non authentifié." });
  }

  return res.status(200).json({
    success: true,
    data: { user: req.user },
  });
});

/**
 * POST /auth/refresh
 * Body: { refresh_token }
 */
router.post("/refresh", async (req, res) => {
  const { refresh_token } = req.body || {};

  if (!refresh_token) {
    return res.status(400).json({
      success: false,
      message: "refresh_token requis.",
    });
  }

  try {
    const { data, error } = await supabase.auth.refreshSession({ refresh_token });

    if (error) {
      return res.status(401).json({
        success: false,
        message: error.message || "Session expirée.",
      });
    }

    return res.status(200).json({
      success: true,
      data: { session: data.session },
    });
  } catch (err) {
    console.error("[auth/refresh]", err?.message);
    return res.status(500).json({
      success: false,
      message: "Erreur lors du rafraîchissement.",
    });
  }
});

module.exports = router;
