const User = require('../models/User');
const bcrypt = require('bcrypt');
const passport = require('passport');

// GET Login
exports.getLogin = (req, res) => {
  res.render('auth/login', {
    title: 'Login',
    returnTo: req.session.returnTo || ''
  });
};

// POST Login – FIXED ✅
exports.postLogin = (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) { return next(err); }
    if (!user) {
      req.flash('error_msg', info.message || 'Invalid credentials');
      return res.redirect('/login');
    }
    req.logIn(user, (err) => {
      if (err) { return next(err); }
      // 🟢 Default to dashboard – but respect explicit redirects
      const redirectUrl = req.query.redirect || req.session.returnTo || '/dashboard';
      req.session.returnTo = null;
      return res.redirect(redirectUrl);
    });
  })(req, res, next);
};

// GET Register
exports.getRegister = (req, res) => {
  res.render('auth/register', {
    title: 'Register',
    errors: [],
    fullName: '',
    email: '',
    phone: ''
  });
};

// POST Register
exports.postRegister = async (req, res) => {
  const { fullName, email, phone, password, password2 } = req.body;
  let errors = [];

  if (!fullName || !email || !phone || !password || !password2) {
    errors.push({ msg: 'Please fill all fields' });
  }
  if (password !== password2) {
    errors.push({ msg: 'Passwords do not match' });
  }
  if (password.length < 6) {
    errors.push({ msg: 'Password should be at least 6 characters' });
  }

  if (errors.length > 0) {
    return res.render('auth/register', { errors, title: 'Register', fullName, email, phone });
  }

  try {
    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      errors.push({ msg: 'Email or Phone already registered' });
      return res.render('auth/register', { errors, title: 'Register', fullName, email, phone });
    }

    const newUser = new User({
      fullName,
      email,
      phone,
      password,
      role: 'user'
    });

    await newUser.save();
    req.flash('success_msg', 'Registration successful. Please login.');
    res.redirect('/');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Something went wrong');
    res.redirect('/register');
  }
};

// Logout
exports.logout = (req, res) => {
  req.logout((err) => {
    if (err) console.error(err);
    req.flash('success_msg', 'You are logged out');
    res.redirect('/');
  });
};