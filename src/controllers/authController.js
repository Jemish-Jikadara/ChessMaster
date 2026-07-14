const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Game = require("../models/Game");

// ── REGISTER STEP 1 ──────────────────────────
function showRegister(req, res) {
  res.render("pages/register", { title: "Register" });
}

async function registerUser(req, res) {
  try {
    const { email,mobile, password, confirmPassword } = req.body;

    if (!email || !mobile || !password || !confirmPassword) {
      req.flash("error", "All fields are required.");
      return res.redirect("/register");
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      req.flash("error", "Invalid email format.");
      return res.redirect("/register");
    }

    if (password !== confirmPassword) {
      req.flash("error", "Passwords do not match.");
      return res.redirect("/register");
    }

    if (password.length < 6) {
      req.flash("error", "Password must be at least 6 characters.");
      return res.redirect("/register");
    }

    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser.profileSetup) {
      req.flash("error", "Email is already registered.");
      return res.redirect("/register");
    }
    const existingMobile = await User.findOne({ mobile });

if (existingMobile && existingMobile.profileSetup) {
    req.flash("error", "Mobile number is already registered.");
    return res.redirect("/register");
}

    const hashedPassword = await bcrypt.hash(password, 12);

    const tempUsername = "user_" + Date.now();

    if (existingUser && !existingUser.profileSetup) {
      existingUser.password = hashedPassword;
      existingUser.mobile = mobile;
      await existingUser.save();
    } else {
      await User.create({
        email,
        mobile,
        password: hashedPassword,
        username: tempUsername,
        profileSetup: false
      });
    }
req.session.setupEmail = email;

return req.session.save(() => {
  res.redirect("/setup-profile");
});
  } catch (error) {
    console.error("Register error:", error);
    req.flash("error", "Something went wrong. Please try again.");
    return res.redirect("/register");
  }
}

// ── PROFILE SETUP STEP 2 ─────────────────────
function showSetupProfile(req, res) {
  if (!req.session.setupEmail && !req.session.user) {
    return res.redirect("/register");
  }
  res.render("pages/setup-profile", { title: "Setup Profile" });
}

async function setupProfile(req, res) {
  try {
    const { username, fullName, country, bio, dateOfBirth } = req.body;

    const email = req.session.setupEmail || req.session.user?.email;

    if (!email) {
      return res.redirect("/register");
    }

  if (req.query.skip === "true" && req.session.setupEmail) {
    return res.redirect("/setup-profile");
  }

    if (!username || username.length < 3 || username.length > 24) {
      req.flash("error", "Username must be 3-24 characters.");
      return res.redirect("/setup-profile");
    }

    const user = await User.findOne({ email });
    const existingUsername = await User.findOne({
      username,
      _id: { $ne: user._id }
    });

    if (existingUsername) {
      req.flash("error", "Username already taken. Please choose another.");
      return res.redirect("/setup-profile");
    }

    user.username = username.trim();
    user.fullName = fullName?.trim() || "";
    user.country = country || "";
    user.bio = bio?.trim() || "";
    user.dateOfBirth = dateOfBirth || null;
    user.profileSetup = true;

    await user.save();

    req.session.setupEmail = null;
    req.session.user = {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      rapidRating: user.rapidRating,
      blitzRating: user.blitzRating,
      bulletRating: user.bulletRating,
      boardTheme: user.boardTheme
    };
return req.session.save(() => {
  res.redirect("/profile");
});
  } catch (error) {
    console.error("Setup profile error:", error);
    req.flash("error", "Something went wrong.");
    return res.redirect("/setup-profile");
  }
}

// ── LOGIN ─────────────────────────────────────
function showLogin(req, res) {
  res.render("pages/login", { title: "Login" });
}

async function loginUser(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      req.flash("error", "Email and password are required.");
      return res.redirect("/login");
    }

    const user = await User.findOne({ email });

    if (!user) {
      req.flash("error", "Invalid email or password.");
      return res.redirect("/login");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      req.flash("error", "Invalid email or password.");
      return res.redirect("/login");
    }
    if (!user.profileSetup) {
  req.session.setupEmail = email;

  return req.session.save(() => {
    res.redirect("/setup-profile");
  });
}

    req.session.user = {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      rapidRating: user.rapidRating,
      blitzRating: user.blitzRating,
      bulletRating: user.bulletRating,
      boardTheme: user.boardTheme
    };

    req.flash("success", "Logged in successfully.");

return req.session.save(() => {
  res.redirect("/profile");
});
  } catch (error) {
    req.flash("error", "Something went wrong while logging in.");
    return res.redirect("/login");
  }
}

// ── PROFILE ───────────────────────────────────
async function showProfile(req, res) {
  const user = await User.findById(req.session.user.id)
    .populate("friends", "username fullName country")
    .lean();

  const games = await Game.find({
    $or: [
      { whiteUser: req.session.user.id },
      { blackUser: req.session.user.id }
    ]
  })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  res.render("pages/profile", { title: "Profile", user, games });
}

async function showStatus(req, res) {

    const user = await User.findById(req.session.user.id);

    const totalGames = user.gamesPlayed || 0;

    const winRate =
        totalGames === 0
            ? 0
            : Math.round((user.wins / totalGames) * 100);
    const rapidWinRate =
    user.rapidGames === 0
        ? 0
        : Math.round((user.rapidWins / user.rapidGames) * 100);

const blitzWinRate =
    user.blitzGames === 0
        ? 0
        : Math.round((user.blitzWins / user.blitzGames) * 100);

const bulletWinRate =
    user.bulletGames === 0
        ? 0
        : Math.round((user.bulletWins / user.bulletGames) * 100);

    res.render("pages/status", {
        rapidRating: user.rapidRating,
        blitzRating: user.blitzRating,
        bulletRating: user.bulletRating,

        wins: user.wins,
        losses: user.losses,
        rapidPeak:user.rapidPeak,
        blitzPeak:user.blitzPeak,
        bulletPeak:user.bulletPeak,
        

        rapidHistory: user.rapidHistory,
        blitzHistory: user.blitzHistory,
        bulletHistory: user.bulletHistory,

        rapidGames: user.rapidGames,
        rapidWins: user.rapidWins,
        rapidLosses: user.rapidLosses,
        rapidDraws: user.rapidDraws,

        blitzGames: user.blitzGames,
        blitzWins: user.blitzWins,
        blitzLosses: user.blitzLosses,
        blitzDraws: user.blitzDraws,

        bulletGames: user.bulletGames,
        bulletWins: user.bulletWins,
        bulletLosses: user.bulletLosses,
        bulletDraws: user.bulletDraws,

        draws: user.draws,
        gamesPlayed: totalGames,
        winRate,
        rapidWinRate,
        blitzWinRate,
        bulletWinRate
    });

}


// ── LOGOUT ────────────────────────────────────
function logoutUser(req, res) {
  req.session.destroy((error) => {
    if (error) return res.redirect("/profile");
    res.clearCookie("connect.sid");
    return res.redirect("/login");
  });
}

module.exports = {
  showRegister, registerUser,
  showSetupProfile, setupProfile,
  showLogin, loginUser,
  showProfile, logoutUser,showStatus,
};