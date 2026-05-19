function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }

  req.flash("error", "Please login first.");
  return res.redirect("/login");
}

function isGuest(req, res, next) {
  if (req.session && req.session.user) {
    return res.redirect("/profile");
  }

  return next();
}

function isAdmin(req, res, next) {
  if (req.session && req.session.user && req.session.user.role === "admin") {
    return next();
  }

  req.flash("error", "You are not allowed to access this page.");
  return res.redirect("/");
}

module.exports = {
  isAuthenticated,
  isGuest,
  isAdmin
};
