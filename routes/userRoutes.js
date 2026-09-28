const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const User = require('../models/User');

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

// ✅ Refer & Earn (auto-generate code if missing)
router.get('/refer-earn', ensureAuthenticated, async (req, res) => {
  try {
    let user = await User.findById(req.user._id)
      .populate('referrals', 'fullName email createdAt');

    if (!user.referralCode) {
      const generateCode = () => {
        const prefix = user.fullName.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '');
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        return (prefix || 'USR') + random;
      };

      let newCode;
      let exists = true;
      while (exists) {
        newCode = generateCode();
        exists = await User.findOne({ referralCode: newCode });
      }
      user.referralCode = newCode;
      await user.save();
    }

    res.render('user/refer-earn', { title: 'Refer & Earn', user });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error loading page');
    res.redirect('/dashboard');
  }
});

// Deposit
router.get('/deposit', ensureAuthenticated, depositController.getDeposit);
router.post('/deposit', ensureAuthenticated, depositController.postDeposit);

// Withdraw
router.get('/withdraw', ensureAuthenticated, withdrawController.getWithdraw);
router.post('/withdraw', ensureAuthenticated, withdrawController.postWithdraw);

router.get('/profile', ensureAuthenticated, async (req, res) => {
  try {
    let user = await User.findById(req.user._id)
      .populate('referrals', 'fullName email createdAt');

    // ✅ Auto-generate agar missing hai
    if (!user.referralCode) {
      const generateCode = () => {
        const prefix = user.fullName.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '');
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        return (prefix || 'USR') + random;
      };

      let newCode;
      let exists = true;
      while (exists) {
        newCode = generateCode();
        exists = await User.findOne({ referralCode: newCode });
      }
      user.referralCode = newCode;
      await user.save();
    }

    res.render('user/profile', { title: 'Profile', user });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error loading profile');
    res.redirect('/dashboard');
  }
});
router.post('/profile/add-bank', ensureAuthenticated, withdrawController.addBankAccount);
router.get('/profile/remove-bank/:accountId', ensureAuthenticated, withdrawController.removeBankAccount);
router.post('/profile/add-wallet', ensureAuthenticated, withdrawController.addWalletAddress);
router.get('/profile/remove-wallet/:addressId', ensureAuthenticated, withdrawController.removeWalletAddress);

// Invest
router.get('/invest', ensureAuthenticated, investController.getInvest);
router.post('/invest', ensureAuthenticated, investController.postInvest);

module.exports = router;