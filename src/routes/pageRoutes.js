const express = require("express");
const { isAuthenticated } = require("../middleware/authMiddleware");
const Game = require("../models/Game");
const User = require("../models/User");

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        // Fetch count from MongoDB
        const totalUsers = await User.countDocuments();

        // Pass totalUsers to home.ejs
        res.render("pages/home", { totalUsers });
    } catch (err) {
        console.error("Error fetching total users:", err);
        // Fallback to 0 if there's an error so the page doesn't crash
        res.render("pages/home", { totalUsers: 0 });
    }
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