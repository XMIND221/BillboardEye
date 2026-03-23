const express = require("express");
const {
  createProjetHandler,
  getAllProjetsHandler,
  getProjetByIdHandler,
  updateProjetHandler,
  deleteProjetHandler,
  duplicateProjetHandler,
} = require("../controllers/projets.controller");

const router = express.Router();

router.post("/", createProjetHandler);
router.get("/", getAllProjetsHandler);
router.post("/:id/duplicate", duplicateProjetHandler);
router.patch("/:id", updateProjetHandler);
router.delete("/:id", deleteProjetHandler);
router.get("/:id", getProjetByIdHandler);

module.exports = router;
