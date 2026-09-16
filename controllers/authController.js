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
    phone: '',
    referralCode: req.query.ref || ''
  });
};

// POST Register
exports.postRegister = async (req, res) => {
  const { fullName, email, phone, password, password2, referralCode } = req.body;
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
    return res.render('auth/register', { errors, title: 'Register', fullName, email, phone, referralCode });
  }

  try {
    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      errors.push({ msg: 'Email or Phone already registered' });
      return res.render('auth/register', { errors, title: 'Register', fullName, email, phone, referralCode });
    }

    // Generate unique referral code
    const generateCode = () => {
      const prefix = fullName.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '');
      const random = Math.random().toString(36).substring(2, 8).toUpperCase();
      return (prefix || 'USR') + random;
    };

    let newReferralCode;
    let exists = true;
    while (exists) {
      newReferralCode = generateCode();
      exists = await User.findOne({ referralCode: newReferralCode });
    }

    // Check referrer
    let referrer = null;
    if (referralCode && referralCode.trim()) {
      referrer = await User.findOne({ referralCode: referralCode.trim().toUpperCase() });
    }

    // ✅ NEW USER gets ₹300 signup bonus
    const newUser = new User({
      fullName,
      email,
      phone,
      password,
      role: 'user',
      referralCode: newReferralCode,
      referredBy: referrer ? referrer._id : null,
      referrals: [],
      walletBalance: 300  // ✅ ₹300 SIGNUP BONUS
    });

    await newUser.save();

    // ✅ REFERRER gets ₹500 bonus
    if (referrer) {
      referrer.referrals.push(newUser._id);
      referrer.walletBalance += 500;  // ✅ ₹500 REFERRAL BONUS
      await referrer.save();

      // Transaction record for referrer
      const Transaction = require('../models/Transaction');
      await Transaction.create({
        user: referrer._id,
        type: 'return',
        amount: 500,
        status: 'completed',
        metadata: { note: `Referral bonus – ${newUser.fullName} joined` }
      });

      // Transaction record for new user
      await Transaction.create({
        user: newUser._id,
        type: 'return',
        amount: 300,
        status: 'completed',
        metadata: { note: 'Signup bonus' }
      });
    } else {
      // Agar koi referral nahi, sirf signup bonus ka transaction
      const Transaction = require('../models/Transaction');
      await Transaction.create({
        user: newUser._id,
        type: 'return',
        amount: 300,
        status: 'completed',
        metadata: { note: 'Signup bonus' }
      });
    }

    req.flash('success_msg', 'Registration successful! ₹300 bonus credited. Please login.');
    res.redirect('/login');
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