const express = require("express");
const { showSettings, updateTheme } = require("../controllers/settingsController");
const { isAuthenticated } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/settings", isAuthenticated, showSettings);
router.post("/api/settings/theme", isAuthenticated, updateTheme);

module.exports = router;