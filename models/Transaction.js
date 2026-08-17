const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { 
    type: String, 
    enum: ['deposit', 'withdrawal', 'investment', 'return', 'admin_adjust'],
    required: true 
  },
  amount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'completed'],
    default: 'pending' 
  },
  metadata: {
    utr: String,
    screenshotUrl: String,
    bankAccount: {
      accountHolder: String,
      bankName: String,
      accountNumber: String,
      ifscCode: String,
    },
    planName: String,
    investmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Investment' },
    adminNote: String,
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Transaction', TransactionSchema);