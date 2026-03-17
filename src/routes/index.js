const express = require("express");
const testRoutes = require("./test.routes");
const panneauxRoutes = require("./panneaux.routes");
const photosRoutes = require("./photos.routes");
const rapportRoutes = require("./rapport.routes");
const syncRoutes = require("./sync.routes");

const router = express.Router();

router.use("/", testRoutes);
router.use("/panneaux", panneauxRoutes);
router.use("/photos", photosRoutes);
router.use("/rapport", rapportRoutes);
router.use("/sync", syncRoutes);

module.exports = router;
