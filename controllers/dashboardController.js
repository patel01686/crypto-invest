const Investment = require('../models/Investment');
const Transaction = require('../models/Transaction');
const InvestmentPlan = require('../models/InvestmentPlan'); // ✅ Added to fetch plans

// ----- DASHBOARD (with plans) -----
exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user._id;

    // Active investments
    const activeInvestments = await Investment.find({ user: userId, status: 'active' })
      .populate('plan', 'name returnRate tenureDays');

    // Total invested
    const investments = await Investment.find({ user: userId });
    const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);

    // Recent transactions (last 5)
    const recentTransactions = await Transaction.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(5);

    // ✅ Fetch all active investment plans
    const plans = await InvestmentPlan.find({ isActive: true });

    res.render('user/dashboard', {
      title: 'Dashboard',
      user: req.user,
      walletBalance: req.user.walletBalance,
      totalInvested,
      activeInvestments,
      recentTransactions,
      plans: plans || [] // ✅ Pass plans to view
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error loading dashboard');
    res.redirect('/');
  }
};

// ----- TRANSACTIONS -----
exports.getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user._id })
      .sort({ createdAt: -1 });
    res.render('user/transactions', {
      title: 'Transaction History',
      transactions
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error loading transactions');
    res.redirect('/dashboard');
  }
};

// ----- MY INVESTMENTS -----
exports.getMyInvestments = async (req, res) => {
  try {
    const investments = await Investment.find({ user: req.user._id })
      .populate('plan', 'name')
      .sort({ createdAt: -1 });
    res.render('user/my-investments', {
      title: 'My Investments',
      investments
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error loading investments');
    res.redirect('/dashboard');
  }
};