const express = require("express");
const {
  createProjetHandler,
  getAllProjetsHandler,
  getProjetByIdHandler,
} = require("../controllers/projets.controller");

const router = express.Router();

router.post("/", createProjetHandler);
router.get("/", getAllProjetsHandler);
router.get("/:id", getProjetByIdHandler);

module.exports = router;
