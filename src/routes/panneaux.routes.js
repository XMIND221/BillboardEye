const express = require("express");
const {
  createPanneauHandler,
  getAllPanneauxHandler,
  getPanneauByIdHandler,
} = require("../controllers/panneaux.controller");
const { authMiddleware } = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(authMiddleware);
router.post("/", createPanneauHandler);
router.get("/", getAllPanneauxHandler);
router.get("/:id", getPanneauByIdHandler);

module.exports = router;
