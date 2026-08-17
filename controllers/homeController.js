const InvestmentPlan = require('../models/InvestmentPlan');
const Investment = require('../models/Investment');

exports.getHome = async (req, res) => {
  try {
    const plans = await InvestmentPlan.find({ isActive: true });
    let totalInvested = 0;
    let activeInvestments = [];

    if (req.user) {
      const investments = await Investment.find({ user: req.user._id });
      totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
      activeInvestments = investments.filter(inv => inv.status === 'active');
    }

    res.render('index', {
      title: 'Crypto Invest – Grow Your Wealth',
      plans: plans || [],
      user: req.user || null,
      totalInvested: totalInvested,
      activeInvestments: activeInvestments
    });
  } catch (err) {
    console.error(err);
    res.render('index', {
      title: 'Crypto Invest',
      plans: [],
      user: req.user || null,
      totalInvested: 0,
      activeInvestments: []
    });
  }
};