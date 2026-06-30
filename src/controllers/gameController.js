const Game = require("../models/Game");
const User = require("../models/User");

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
    console.log({
    whiteUser: req.session.user.id,
    blackUser: "???",
    whitePlayer,
    blackPlayer
});
    const statsUpdate = { $inc: { gamesPlayed: 1 } };

const isPlayerWhite = playerColor === "w";

if (winner === "draw") {
  statsUpdate.$inc.draws = 1;
} else if (
  (winner === "white" && isPlayerWhite) ||
  (winner === "black" && !isPlayerWhite)
) {
  statsUpdate.$inc.wins = 1;
} else {
  statsUpdate.$inc.losses = 1;
}

    const updatedUser = await User.findByIdAndUpdate(
      req.session.user.id,
      statsUpdate,
      { returnDocument: "after" }
    );

    req.session.user.rapidRating = updatedUser.rapidRating;
    req.session.user.blitzRating = updatedUser.blitzRating;
    req.session.user.bulletRating = updatedUser.bulletRating;

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