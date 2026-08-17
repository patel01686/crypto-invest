const mongoose = require('mongoose');

const InvestmentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  plan: { type: mongoose.Schema.Types.ObjectId, ref: 'InvestmentPlan', required: true },
  amount: { type: Number, required: true },
  startDate: { type: Date, default: Date.now },
  maturityDate: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['active', 'matured', 'cancelled'],
    default: 'active' 
  },
  returnsCredited: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Investment', InvestmentSchema);