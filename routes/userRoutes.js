const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

// Import controllers (only once)
const dashboardController = require('../controllers/dashboardController');
const depositController = require('../controllers/depositController');
const withdrawController = require('../controllers/withdrawController');
const investController = require('../controllers/investController');

// Dashboard
router.get('/dashboard', ensureAuthenticated, dashboardController.getDashboard);

// Transactions (NEW)
router.get('/transactions', ensureAuthenticated, dashboardController.getTransactions);

// My Investments
router.get('/my-investments', ensureAuthenticated, dashboardController.getMyInvestments);

// Deposit
router.get('/deposit', ensureAuthenticated, depositController.getDeposit);
router.post('/deposit', ensureAuthenticated, depositController.postDeposit);

// Withdraw
router.get('/withdraw', ensureAuthenticated, withdrawController.getWithdraw);
router.post('/withdraw', ensureAuthenticated, withdrawController.postWithdraw);

// Profile (Bank Accounts)
router.get('/profile', ensureAuthenticated, (req, res) => {
  res.render('user/profile', { title: 'Profile', user: req.user });
});
router.post('/profile/add-bank', ensureAuthenticated, withdrawController.addBankAccount);
router.get('/profile/remove-bank/:accountId', ensureAuthenticated, withdrawController.removeBankAccount);

router.post('/profile/add-wallet', ensureAuthenticated, withdrawController.addWalletAddress);
router.get('/profile/remove-wallet/:addressId', ensureAuthenticated, withdrawController.removeWalletAddress);

// Invest
router.get('/invest', ensureAuthenticated, investController.getInvest);
router.post('/invest', ensureAuthenticated, investController.postInvest);

module.exports = router;