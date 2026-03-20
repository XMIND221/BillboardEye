const express = require("express");
const { authMiddleware } = require("../middlewares/auth.middleware");
const testRoutes = require("./test.routes");
const authRoutes = require("./auth.routes");
const panneauxRoutes = require("./panneaux.routes");
const photosRoutes = require("./photos.routes");
const rapportRoutes = require("./rapport.routes");
const syncRoutes = require("./sync.routes");
const projetsRoutes = require("./projets.routes");

const router = express.Router();

router.use("/", testRoutes);
router.use("/auth", authRoutes);
router.use(authMiddleware);
router.use("/panneaux", panneauxRoutes);
router.use("/photos", photosRoutes);
router.use("/rapport", rapportRoutes);
router.use("/sync", syncRoutes);
router.use("/projets", projetsRoutes);

module.exports = router;
