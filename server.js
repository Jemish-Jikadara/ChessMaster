require("dotenv").config();

const express = require("express");
const path = require("path");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const User = require("./src/models/User");
const { isAuthenticated } = require("./src/middleware/authMiddleware");

const connectDB = require("./src/config/db");
const Game = require("./src/models/Game");
const authRoutes = require("./src/routes/authRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

connectDB();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "src", "views"));

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "chessmastersecret",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24,
      httpOnly: true
    }
  })
);

app.use(flash());

app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

app.use("/", authRoutes);

app.get("/", (req, res) => {
  res.render("pages/home");
});

app.get("/play", isAuthenticated, (req, res) => {
  res.render("pages/play");
});

app.get("/leaderboard", async (req, res) => {
  const games = await Game.find().sort({ createdAt: -1 }).limit(20);
  res.render("pages/leaderboard", { games });
});

app.get("/about", (req, res) => {
  res.render("pages/about");
});

app.post("/api/games", isAuthenticated, async (req, res) => {
  try {
    const {
      gameId,
      whitePlayer,
      blackPlayer,
      winner,
      timeMode,
      timeControl,
      increment,
      totalMoves,
      moves
    } = req.body;

    // Check if this gameId was already saved (duplicate save guard)
    if (gameId) {
      const existing = await Game.findOne({ gameId });
      if (existing) {
        // Game already saved — just return success, don't touch stats again
        return res.status(200).json({ success: true, game: existing });
      }
    }

    // First time saving this game — create it
    const game = await Game.create({
      gameId: gameId || null,
      whiteUser: req.session.user.id,
      whitePlayer,
      blackPlayer,
      winner,
      timeMode,
      timeControl,
      increment,
      totalMoves,
      moves
    });

    // Update player stats only on first save
    const statsUpdate = { $inc: { gamesPlayed: 1 } };

    if (winner === "white") {
      statsUpdate.$inc.wins = 1;
    } else if (winner === "black") {
      statsUpdate.$inc.losses = 1;
    } else {
      statsUpdate.$inc.draws = 1;
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
    res.status(400).json({ success: false, message: error.message });
  }
});

app.use((req, res) => {
  res.status(404).render("error");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});