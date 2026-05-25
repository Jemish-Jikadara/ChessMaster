const User = require("../models/User");

async function showSettings(req, res) {
  try {
    const user = await User.findById(req.session.user.id).lean();
    res.render("pages/settings", { title: "Settings", user });
  } catch (error) {
    res.redirect("/profile");
  }
}

async function updateTheme(req, res) {
  try {
    const { boardTheme } = req.body;
    const allowed = ["classic", "midnight", "forest", "ocean", "ruby", "walnut"];

    if (!allowed.includes(boardTheme)) {
      return res.status(400).json({ success: false, message: "Invalid theme." });
    }

    await User.findByIdAndUpdate(req.session.user.id, { boardTheme });
    req.session.user.boardTheme = boardTheme;

    res.json({ success: true, boardTheme });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = { showSettings, updateTheme };