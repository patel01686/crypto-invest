module.exports = {
  ensureAuthenticated: (req, res, next) => {
    if (req.isAuthenticated()) {
      return next();
    }
    // Save the original URL to redirect after login
    req.session.returnTo = req.originalUrl;
    req.flash('error_msg', 'Please log in to view that resource');
    res.redirect('/login');
  },
  forwardAuthenticated: (req, res, next) => {
    if (!req.isAuthenticated()) {
      return next();
    }
    res.redirect('/');
  }
};