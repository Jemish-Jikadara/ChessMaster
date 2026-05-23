const express = require("express");
const { saveGame, getReplay } = require("../controllers/gameController");
const { isAuthenticated } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/api/games", isAuthenticated, saveGame);
router.get("/game/:id", isAuthenticated, getReplay);

module.exports = router;