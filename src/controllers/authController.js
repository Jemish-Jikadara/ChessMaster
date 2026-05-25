const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Game = require("../models/Game");

function showRegister(req, res) {
  res.render("pages/register", {
    title: "Register"
  });
}

async function registerUser(req, res) {
  try {
    const { username, email, password, confirmPassword } = req.body;

    if (!username || !email || !password || !confirmPassword) {
      req.flash("error", "All fields are required.");
      return res.redirect("/register");
    }

    if (password !== confirmPassword) {
      req.flash("error", "Passwords do not match.");
      return res.redirect("/register");
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      req.flash("error", "Email is already registered.");
      return res.redirect("/register");
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await User.create({
      username,
      email,
      password: hashedPassword
    });

    req.flash("success", "Account created successfully. Please login.");
    return res.redirect("/login");
  } catch (error) {
    console.error("Error registering user:", error);
    req.flash("error", "Something went wrong while creating account.");
    return res.redirect("/register");
  }
}

function showLogin(req, res) {
  res.render("pages/login", {
    title: "Login"
  });
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

    req.session.user = {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      rating: user.rating,
      rapidRating: user.rapidRating,
      blitzRating: user.blitzRating,
      bulletRating: user.bulletRating
    };

    req.flash("success", "Logged in successfully.");
    return res.redirect("/profile");
  } catch (error) {
    req.flash("error", "Something went wrong while logging in.");
    return res.redirect("/login");
  }
}
async function showProfile(req, res) {
  const user = await User.findById(req.session.user.id).lean();

  const games = await Game.find({ whiteUser: req.session.user.id })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  res.render("pages/profile", {
    title: "Profile",
    user,
    games
  });
}

function logoutUser(req, res) {
  req.session.destroy((error) => {
    if (error) {
      return res.redirect("/profile");
    }

    res.clearCookie("connect.sid");
    return res.redirect("/login");
  });
}

module.exports = {
  showRegister,
  registerUser,
  showLogin,
  loginUser,
  showProfile,
  logoutUser
};
