const User = require('../models/User');
const Transaction = require('../models/Transaction');
const InvestmentPlan = require('../models/InvestmentPlan');
const Investment = require('../models/Investment');
const { whatsappLink, calculateMaturity } = require('../utils/helpers');

// Admin Dashboard
exports.getDashboard = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const pendingDeposits = await Transaction.countDocuments({ type: 'deposit', status: 'pending' });
    const pendingWithdrawals = await Transaction.countDocuments({ type: 'withdrawal', status: 'pending' });
    const totalInvestments = await Investment.countDocuments();

    res.render('admin/dashboard', {
      title: 'Admin Dashboard',
      totalUsers,
      pendingDeposits,
      pendingWithdrawals,
      totalInvestments
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error loading admin dashboard');
    res.redirect('/dashboard');
  }
};

// Deposit Management
exports.getDeposits = async (req, res) => {
  try {
    const deposits = await Transaction.find({ type: 'deposit' })
      .populate('user', 'fullName email phone')
      .sort({ createdAt: -1 });
    res.render('admin/deposits', { title: 'Manage Deposits', deposits, baseUrl: process.env.BASE_URL });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error loading deposits');
    res.redirect('/admin/dashboard');
  }
};

exports.approveDeposit = async (req, res) => {
  try {
    const transactionId = req.params.id;
    const transaction = await Transaction.findById(transactionId).populate('user');
    if (!transaction || transaction.type !== 'deposit' || transaction.status !== 'pending') {
      req.flash('error_msg', 'Invalid transaction');
      return res.redirect('/admin/deposits');
    }

    // Credit user's wallet
    const user = transaction.user;
    user.walletBalance += transaction.amount;
    await user.save();

    transaction.status = 'approved';
    await transaction.save();

    req.flash('success_msg', `Deposit of ₹${transaction.amount} approved for ${user.fullName}`);
    res.redirect('/admin/deposits');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error approving deposit');
    res.redirect('/admin/deposits');
  }
};

exports.rejectDeposit = async (req, res) => {
  try {
    const transactionId = req.params.id;
    const transaction = await Transaction.findById(transactionId);
    if (!transaction || transaction.type !== 'deposit' || transaction.status !== 'pending') {
      req.flash('error_msg', 'Invalid transaction');
      return res.redirect('/admin/deposits');
    }

    transaction.status = 'rejected';
    await transaction.save();

    req.flash('success_msg', 'Deposit rejected');
    res.redirect('/admin/deposits');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error rejecting deposit');
    res.redirect('/admin/deposits');
  }
};

// Withdrawal Management
exports.getWithdrawals = async (req, res) => {
  try {
    const withdrawals = await Transaction.find({ type: 'withdrawal' })
      .populate('user', 'fullName email phone')
      .sort({ createdAt: -1 });
    res.render('admin/withdrawals', { title: 'Manage Withdrawals', withdrawals });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error loading withdrawals');
    res.redirect('/admin/dashboard');
  }
};

exports.approveWithdrawal = async (req, res) => {
  try {
    const transactionId = req.params.id;
    const transaction = await Transaction.findById(transactionId).populate('user');
    if (!transaction || transaction.type !== 'withdrawal' || transaction.status !== 'pending') {
      req.flash('error_msg', 'Invalid transaction');
      return res.redirect('/admin/withdrawals');
    }

    // Check if user has enough balance
    const user = transaction.user;
    if (user.walletBalance < transaction.amount) {
      req.flash('error_msg', 'Insufficient balance. Cannot approve.');
      return res.redirect('/admin/withdrawals');
    }

    // Deduct from wallet
    user.walletBalance -= transaction.amount;
    await user.save();

    transaction.status = 'approved';
    await transaction.save();

    req.flash('success_msg', `Withdrawal of ₹${transaction.amount} approved for ${user.fullName}`);
    res.redirect('/admin/withdrawals');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error approving withdrawal');
    res.redirect('/admin/withdrawals');
  }
};

exports.rejectWithdrawal = async (req, res) => {
  try {
    const transactionId = req.params.id;
    const transaction = await Transaction.findById(transactionId);
    if (!transaction || transaction.type !== 'withdrawal' || transaction.status !== 'pending') {
      req.flash('error_msg', 'Invalid transaction');
      return res.redirect('/admin/withdrawals');
    }

    transaction.status = 'rejected';
    await transaction.save();

    req.flash('success_msg', 'Withdrawal rejected');
    res.redirect('/admin/withdrawals');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error rejecting withdrawal');
    res.redirect('/admin/withdrawals');
  }
};

// User Management
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({ role: 'user' }).sort({ createdAt: -1 });
    res.render('admin/users', { title: 'Manage Users', users });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error loading users');
    res.redirect('/admin/dashboard');
  }
};

exports.toggleUserStatus = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    if (!user) {
      req.flash('error_msg', 'User not found');
      return res.redirect('/admin/users');
    }
    user.isActive = !user.isActive;
    await user.save();
    req.flash('success_msg', `User ${user.fullName} ${user.isActive ? 'activated' : 'deactivated'}`);
    res.redirect('/admin/users');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error updating user status');
    res.redirect('/admin/users');
  }
};

exports.adjustBalance = async (req, res) => {
  try {
    const { userId, amount, action } = req.body;
    if (!userId || !amount || isNaN(amount) || amount <= 0) {
      req.flash('error_msg', 'Invalid input');
      return res.redirect('/admin/users');
    }
    const user = await User.findById(userId);
    if (!user) {
      req.flash('error_msg', 'User not found');
      return res.redirect('/admin/users');
    }

    const adjustment = parseFloat(amount);
    if (action === 'add') {
      user.walletBalance += adjustment;
    } else if (action === 'deduct') {
      if (user.walletBalance < adjustment) {
        req.flash('error_msg', 'Insufficient balance to deduct');
        return res.redirect('/admin/users');
      }
      user.walletBalance -= adjustment;
    } else {
      req.flash('error_msg', 'Invalid action');
      return res.redirect('/admin/users');
    }
    await user.save();

    // Create transaction record for admin adjustment
    const transaction = new Transaction({
      user: user._id,
      type: 'admin_adjust',
      amount: adjustment,
      status: 'completed',
      metadata: { adminNote: `Admin ${action === 'add' ? 'added' : 'deducted'} ₹${adjustment}` }
    });
    await transaction.save();

    req.flash('success_msg', `Balance adjusted for ${user.fullName}`);
    res.redirect('/admin/users');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error adjusting balance');
    res.redirect('/admin/users');
  }
};

// Plan Management
exports.getPlans = async (req, res) => {
  try {
    const plans = await InvestmentPlan.find().sort({ createdAt: -1 });
    res.render('admin/plans', { title: 'Manage Investment Plans', plans });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error loading plans');
    res.redirect('/admin/dashboard');
  }
};

exports.getCreatePlan = (req, res) => {
  res.render('admin/plan-form', { title: 'Create Plan', plan: null });
};

exports.postCreatePlan = async (req, res) => {
  try {
    const { name, description, returnRate, tenureDays, minAmount, maxAmount } = req.body;
    if (!name || !returnRate || !tenureDays || !minAmount || !maxAmount) {
      req.flash('error_msg', 'All fields are required');
      return res.redirect('/admin/plans/create');
    }
    const plan = new InvestmentPlan({
      name,
      description: description || '',
      returnRate: parseFloat(returnRate),
      tenureDays: parseInt(tenureDays),
      minAmount: parseFloat(minAmount),
      maxAmount: parseFloat(maxAmount),
      isActive: true
    });
    await plan.save();
    req.flash('success_msg', 'Plan created successfully');
    res.redirect('/admin/plans');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error creating plan');
    res.redirect('/admin/plans/create');
  }
};

exports.getEditPlan = async (req, res) => {
  try {
    const plan = await InvestmentPlan.findById(req.params.id);
    if (!plan) {
      req.flash('error_msg', 'Plan not found');
      return res.redirect('/admin/plans');
    }
    res.render('admin/plan-form', { title: 'Edit Plan', plan });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error loading plan');
    res.redirect('/admin/plans');
  }
};

exports.postEditPlan = async (req, res) => {
  try {
    const { name, description, returnRate, tenureDays, minAmount, maxAmount, isActive } = req.body;
    const plan = await InvestmentPlan.findById(req.params.id);
    if (!plan) {
      req.flash('error_msg', 'Plan not found');
      return res.redirect('/admin/plans');
    }
    plan.name = name;
    plan.description = description || '';
    plan.returnRate = parseFloat(returnRate);
    plan.tenureDays = parseInt(tenureDays);
    plan.minAmount = parseFloat(minAmount);
    plan.maxAmount = parseFloat(maxAmount);
    plan.isActive = isActive === 'on' ? true : false;
    await plan.save();
    req.flash('success_msg', 'Plan updated successfully');
    res.redirect('/admin/plans');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error updating plan');
    res.redirect('/admin/plans');
  }
};

exports.deletePlan = async (req, res) => {
  try {
    await InvestmentPlan.findByIdAndDelete(req.params.id);
    req.flash('success_msg', 'Plan deleted');
    res.redirect('/admin/plans');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error deleting plan');
    res.redirect('/admin/plans');
  }
};