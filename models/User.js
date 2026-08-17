const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const BankAccountSchema = new mongoose.Schema({
  accountHolder: { type: String, required: true },
  bankName: { type: String, required: true },
  accountNumber: { type: String, required: true },
  ifscCode: { type: String, required: true },
  isDefault: { type: Boolean, default: false },
});

const UserSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  walletBalance: { type: Number, default: 0 },
  bankAccounts: [BankAccountSchema],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

module.exports = mongoose.model('User', UserSchema);