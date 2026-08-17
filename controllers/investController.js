const InvestmentPlan = require('../models/InvestmentPlan');
const Investment = require('../models/Investment');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { calculateMaturity } = require('../utils/helpers');

exports.getInvest = async (req, res) => {
  try {
    const selectedPlanId = req.query.plan || null; // Home page se aaya ho toh
    const plans = await InvestmentPlan.find({ isActive: true });
    res.render('user/invest', {
      title: 'Invest Now',
      plans: plans || [],
      walletBalance: req.user.walletBalance || 0,
      selectedPlanId: selectedPlanId // View me pass karein (optional)
    });
  } catch (err) {
    console.error('Error in getInvest:', err);
    req.flash('error_msg', 'Error loading investment plans');
    res.redirect('/dashboard');
  }
};

// Process investment
exports.postInvest = async (req, res) => {
  try {
    const { planId, amount } = req.body;
    const user = await User.findById(req.user._id);

    // Validate
    if (!planId || !amount || isNaN(amount) || amount <= 0) {
      req.flash('error_msg', 'Invalid input');
      return res.redirect('/invest');
    }

    const plan = await InvestmentPlan.findById(planId);
    if (!plan || !plan.isActive) {
      req.flash('error_msg', 'Plan not available');
      return res.redirect('/invest');
    }

    const investAmount = parseFloat(amount);
    if (investAmount < plan.minAmount || investAmount > plan.maxAmount) {
      req.flash('error_msg', `Amount must be between ₹${plan.minAmount} and ₹${plan.maxAmount}`);
      return res.redirect('/invest');
    }

    if (investAmount > user.walletBalance) {
      req.flash('error_msg', 'Insufficient wallet balance');
      return res.redirect('/invest');
    }

    // Deduct from wallet
    user.walletBalance -= investAmount;
    await user.save();

    // Create investment
    const maturityDate = calculateMaturity(new Date(), plan.tenureDays);
    const investment = new Investment({
      user: user._id,
      plan: plan._id,
      amount: investAmount,
      startDate: new Date(),
      maturityDate: maturityDate,
      status: 'active'
    });
    await investment.save();

    // Create transaction record
    const transaction = new Transaction({
      user: user._id,
      type: 'investment',
      amount: investAmount,
      status: 'completed',
      metadata: {
        planName: plan.name,
        investmentId: investment._id
      }
    });
    await transaction.save();

    req.flash('success_msg', `Investment of ₹${investAmount} in ${plan.name} successful!`);
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error processing investment');
    res.redirect('/invest');
  }
};