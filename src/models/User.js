const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // ── Auth ──────────────────────────────────────
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    password: {
      type: String,
      required: true,
      minlength: 6
    },

    // ── Profile ───────────────────────────────────
    username: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 24,
      unique: true
    },
    fullName: {
      type: String,
      trim: true,
      maxlength: 50,
      default: ""
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 200,
      default: ""
    },
    country: {
      type: String,
      trim: true,
      default: ""
    },
    dateOfBirth: {
      type: Date,
      default: null
    },
    profileSetup: {
      type: Boolean,
      default: false
    },

    // ── Settings ──────────────────────────────────
    role: {
      type: String,
      enum: ["player", "admin"],
      default: "player"
    },
    boardTheme: {
      type: String,
      enum: ["classic", "midnight", "forest", "ocean", "ruby", "walnut"],
      default: "classic"
    },

    // ── Ratings ───────────────────────────────────
    rapidRating:  { type: Number, default: 1200 },
    blitzRating:  { type: Number, default: 1200 },
    bulletRating: { type: Number, default: 1200 },

    // ── Stats ─────────────────────────────────────
    wins:        { type: Number, default: 0 },
    losses:      { type: Number, default: 0 },
    draws:       { type: Number, default: 0 },
    gamesPlayed: { type: Number, default: 0 },

    // ── Friends ───────────────────────────────────
    friends: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }],
    friendRequests: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }]
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);