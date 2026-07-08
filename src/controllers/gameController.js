const Game = require("../models/Game");
const User = require("../models/User");
const { updateRatings } = require("../utils/rating");

async function saveGame(req, res) {
  console.log("API HIT");
console.log(req.body);
  try {
    const {
  gameId,
  whiteUser,
  blackUser,
  whitePlayer,
  blackPlayer,
  winner,
  playerColor,
  timeMode,
  timeControl,
  increment,
  totalMoves,
  moves
} = req.body;

    // Duplicate save guard
    if (gameId) {
      const existing = await Game.findOne({ gameId });
      if (existing) {
        return res.status(200).json({ success: true, game: existing });
      }
    }
console.log("SESSION USER:", req.session.user);
const game = await Game.create({
  gameId: gameId || null,

  whiteUser,
  blackUser,

  whitePlayer,
  blackPlayer,

  winner,
  timeMode,
  timeControl,
  increment,
  totalMoves,
  moves
});
console.log("Updating ratings...");

await updateRatings(
    whiteUser,
    blackUser,
    winner,
    timeMode
);

console.log("Ratings updated successfully");
const currentUser = await User.findById(req.session.user.id);

req.session.user.rapidRating = currentUser.rapidRating;
req.session.user.blitzRating = currentUser.blitzRating;
req.session.user.bulletRating = currentUser.bulletRating;
console.log(req.session.user);
    res.status(201).json({ success: true, game });
  } catch (error) {
    console.error("Error saving game:", error);
    res.status(400).json({ success: false, message: error.message });
  }
}
async function getReplay(req, res) {
  try {
    const game = await Game.findById(req.params.id).lean();

    if (!game) {
      return res.status(404).render("error");
    }

    res.render("pages/replay", { title: "Game Replay", game });
  } catch (error) {
    res.status(404).render("error");
  }
}

module.exports = { saveGame, getReplay };