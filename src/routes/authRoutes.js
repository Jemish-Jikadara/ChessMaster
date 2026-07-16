const express = require("express");
const authController = require("../controllers/authController");
const { isAuthenticated, isGuest } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

const router = express.Router();

router.get("/register", isGuest, authController.showRegister);
router.post("/register", isGuest, authController.registerUser);

router.get("/setup-profile", authController.showSetupProfile);
router.post("/setup-profile", (req, res, next) => {
  upload.single("profileImage")(req, res, function (err) {
    if (err) {
      console.error("Upload error:", err.message); // ab exact wajah dikhegi
      req.flash("error", err.message || "Image upload failed. Try again.");
      return res.redirect("/setup-profile");
    }
    next();
  });
}, authController.setupProfile);

// Edit Profile
router.get("/profile/edit", isAuthenticated, authController.showEditProfile);

router.post("/profile/edit",
(req,res,next)=>{
    upload.single("profileImage")(req,res,function(err){
        if(err){
            req.flash("error",err.message);
            return res.redirect("/profile/edit");
        }
        next();
    });
},
authController.updateProfile);

router.get("/login", isGuest, authController.showLogin);
router.post("/login", isGuest, authController.loginUser);

router.get("/profile", isAuthenticated, authController.showProfile);
router.get("/profile/status", isAuthenticated,authController.showStatus);
router.post("/logout", isAuthenticated, authController.logoutUser);

module.exports = router;