const express = require("express");
const {
  createPanneauHandler,
  getAllPanneauxHandler,
  getPanneauByIdHandler,
} = require("../controllers/panneaux.controller");

const router = express.Router();

router.post("/", createPanneauHandler);
router.get("/", getAllPanneauxHandler);
router.get("/:id", getPanneauByIdHandler);

module.exports = router;
