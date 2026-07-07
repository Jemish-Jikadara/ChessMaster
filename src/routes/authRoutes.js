const express = require("express");
const authController = require("../controllers/authController");
const { isAuthenticated, isGuest } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/register", isGuest, authController.showRegister);
router.post("/register", isGuest, authController.registerUser);

router.get("/setup-profile", authController.showSetupProfile);
router.post("/setup-profile", authController.setupProfile);

router.get("/login", isGuest, authController.showLogin);
router.post("/login", isGuest, authController.loginUser);

router.get("/profile", isAuthenticated, authController.showProfile);
router.get("/profile/status", isAuthenticated,authController.showStatus);
router.post("/logout", isAuthenticated, authController.logoutUser);

module.exports = router;