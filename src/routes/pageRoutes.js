const express = require("express");
const { isAuthenticated } = require("../middleware/authMiddleware");
const Game = require("../models/Game");

const router = express.Router();

router.get("/", (req, res) => {
  res.render("pages/home");
});

router.get("/play", isAuthenticated, (req, res) => {
  res.render("pages/play");
});

router.get("/leaderboard", async (req, res) => {
  const games = await Game.find().sort({ createdAt: -1 }).limit(20);
  res.render("pages/leaderboard", { games });
});

router.get("/about", (req, res) => {
  res.render("pages/about");
});
router.get("/online", isAuthenticated, (req, res) => {
  res.render("pages/online");
});
router.get("/online/play", isAuthenticated, (req, res) => {
  res.render("pages/online-play");
});

module.exports = router;