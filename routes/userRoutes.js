const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const User = require('../models/User');

// Import controllers (only once)
const dashboardController = require('../controllers/dashboardController');
const depositController = require('../controllers/depositController');
const withdrawController = require('../controllers/withdrawController');
const investController = require('../controllers/investController');

// Dashboard
router.get('/dashboard', ensureAuthenticated, dashboardController.getDashboard);

// Transactions
router.get('/transactions', ensureAuthenticated, dashboardController.getTransactions);

// My Investments
router.get('/my-investments', ensureAuthenticated, dashboardController.getMyInvestments);

// Deposit
router.get('/deposit', ensureAuthenticated, depositController.getDeposit);
router.post('/deposit', ensureAuthenticated, depositController.postDeposit);

// Withdraw
router.get('/withdraw', ensureAuthenticated, withdrawController.getWithdraw);
router.post('/withdraw', ensureAuthenticated, withdrawController.postWithdraw);

// ✅ Profile (with referral details populated)
router.get('/profile', ensureAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('referrals', 'fullName email createdAt');
    res.render('user/profile', { title: 'Profile', user });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error loading profile');
    res.redirect('/dashboard');
  }
});

// Bank Accounts
router.post('/profile/add-bank', ensureAuthenticated, withdrawController.addBankAccount);
router.get('/profile/remove-bank/:accountId', ensureAuthenticated, withdrawController.removeBankAccount);

// Wallet Addresses
router.post('/profile/add-wallet', ensureAuthenticated, withdrawController.addWalletAddress);
router.get('/profile/remove-wallet/:addressId', ensureAuthenticated, withdrawController.removeWalletAddress);

// Invest
router.get('/invest', ensureAuthenticated, investController.getInvest);
router.post('/invest', ensureAuthenticated, investController.postInvest);

module.exports = router;