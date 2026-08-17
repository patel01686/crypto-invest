module.exports = {
  ensureAdmin: (req, res, next) => {
    if (req.isAuthenticated() && req.user.role === 'admin') {
      return next();
    }
    req.flash('error_msg', 'Access denied. Admin only.');
    res.redirect('/dashboard');
  }
};