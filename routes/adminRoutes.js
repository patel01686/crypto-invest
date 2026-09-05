const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');   // ✅ correct import
const { ensureAdmin } = require('../middleware/admin');         // ✅ correct import
const { qrUpload } = require('../middleware/upload');

const adminController = require('../controllers/adminController');
const settingsController = require('../controllers/settingsController');

// Dashboard
router.get('/dashboard', ensureAuthenticated, ensureAdmin, adminController.getDashboard);

// Deposit management
router.get('/deposits', ensureAuthenticated, ensureAdmin, adminController.getDeposits);
router.get('/deposits/approve/:id', ensureAuthenticated, ensureAdmin, adminController.approveDeposit);
router.get('/deposits/reject/:id', ensureAuthenticated, ensureAdmin, adminController.rejectDeposit);

// Withdrawal management
router.get('/withdrawals', ensureAuthenticated, ensureAdmin, adminController.getWithdrawals);
router.get('/withdrawals/approve/:id', ensureAuthenticated, ensureAdmin, adminController.approveWithdrawal);
router.get('/withdrawals/reject/:id', ensureAuthenticated, ensureAdmin, adminController.rejectWithdrawal);

// User management
router.get('/users', ensureAuthenticated, ensureAdmin, adminController.getUsers);
router.get('/users/toggle/:id', ensureAuthenticated, ensureAdmin, adminController.toggleUserStatus);
router.post('/users/adjust-balance', ensureAuthenticated, ensureAdmin, adminController.adjustBalance);
router.get('/investments', ensureAuthenticated, ensureAdmin, adminController.getInvestments);

// Plan management
router.get('/plans', ensureAuthenticated, ensureAdmin, adminController.getPlans);
router.get('/plans/create', ensureAuthenticated, ensureAdmin, adminController.getCreatePlan);
router.post('/plans/create', ensureAuthenticated, ensureAdmin, adminController.postCreatePlan);
router.get('/plans/edit/:id', ensureAuthenticated, ensureAdmin, adminController.getEditPlan);
router.post('/plans/edit/:id', ensureAuthenticated, ensureAdmin, adminController.postEditPlan);
router.get('/plans/delete/:id', ensureAuthenticated, ensureAdmin, adminController.deletePlan);

// Settings
router.get('/settings', ensureAuthenticated, ensureAdmin, settingsController.getSettings);
router.post('/settings/upi', ensureAuthenticated, ensureAdmin, settingsController.updateUpiId);
router.post('/settings/qr', ensureAuthenticated, ensureAdmin, qrUpload.single('qrImage'), settingsController.uploadQr);

module.exports = router;