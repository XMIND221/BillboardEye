const express = require("express");
const {
  createPanneauHandler,
  getAllPanneauxHandler,
  getPanneauByIdHandler,
  updatePanneauHandler,
  deletePanneauHandler,
} = require("../controllers/panneaux.controller");

const router = express.Router();

router.post("/", createPanneauHandler);
router.get("/", getAllPanneauxHandler);
router.patch("/:id", updatePanneauHandler);
router.delete("/:id", deletePanneauHandler);
router.get("/:id", getPanneauByIdHandler);

module.exports = router;
