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
    mobile: {
    type: String,
    required: true,
    unique: true,
    trim: true
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
     profileImage: {
    type: String, // Cloudinary URL yaha store hogi
    default: ''},
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
    // ── Rating History ─────────────────────────────
    rapidHistory: { type: [Number],default: [1200]},
    blitzHistory: { type: [Number],default: [1200]},
    bulletHistory:{ type: [Number],default: [1200]},
    // ── Peak Ratings ─────────────────────────────
rapidPeak: { type: Number, default: 1200 },
blitzPeak: { type: Number, default: 1200 },
bulletPeak: { type: Number, default: 1200 },
    // ── Overall Stats ───────────────────────────
wins:        { type: Number, default: 0 },
losses:      { type: Number, default: 0 },
draws:       { type: Number, default: 0 },
gamesPlayed: { type: Number, default: 0 },

// ── Rapid Stats ─────────────────────────────
rapidGames:  { type: Number, default: 0 },
rapidWins:   { type: Number, default: 0 },
rapidLosses: { type: Number, default: 0 },
rapidDraws:  { type: Number, default: 0 },

// ── Blitz Stats ─────────────────────────────
blitzGames:  { type: Number, default: 0 },
blitzWins:   { type: Number, default: 0 },
blitzLosses: { type: Number, default: 0 },
blitzDraws:  { type: Number, default: 0 },

// ── Bullet Stats ────────────────────────────
bulletGames:  { type: Number, default: 0 },
bulletWins:   { type: Number, default: 0 },
bulletLosses: { type: Number, default: 0 },
bulletDraws:  { type: Number, default: 0 },

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