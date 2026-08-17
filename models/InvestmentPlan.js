const mongoose = require('mongoose');

const InvestmentPlanSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  returnRate: { type: Number, required: true }, // percentage per tenure
  tenureDays: { type: Number, required: true },
  minAmount: { type: Number, required: true },
  maxAmount: { type: Number, required: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('InvestmentPlan', InvestmentPlanSchema);