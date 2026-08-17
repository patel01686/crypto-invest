const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { whatsappLink } = require('../utils/helpers');

exports.getWithdraw = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const bankAccounts = user.bankAccounts;
    res.render('user/withdraw', {
      title: 'Withdraw Funds',
      bankAccounts,
      walletBalance: user.walletBalance
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error loading withdrawal page');
    res.redirect('/dashboard');
  }
};

exports.postWithdraw = async (req, res) => {
  try {
    const { amount, bankAccountId } = req.body;
    const user = await User.findById(req.user._id);

    if (!amount || isNaN(amount) || amount <= 0) {
      req.flash('error_msg', 'Invalid amount');
      return res.redirect('/withdraw');
    }

    if (amount > user.walletBalance) {
      req.flash('error_msg', 'Insufficient balance');
      return res.redirect('/withdraw');
    }

    // Find the selected bank account
    const bankAccount = user.bankAccounts.id(bankAccountId);
    if (!bankAccount) {
      req.flash('error_msg', 'Please select a bank account');
      return res.redirect('/withdraw');
    }

    // Create pending withdrawal transaction
    const transaction = new Transaction({
      user: user._id,
      type: 'withdrawal',
      amount: parseFloat(amount),
      status: 'pending',
      metadata: {
        bankAccount: {
          accountHolder: bankAccount.accountHolder,
          bankName: bankAccount.bankName,
          accountNumber: bankAccount.accountNumber,
          ifscCode: bankAccount.ifscCode
        }
      }
    });
    await transaction.save();

    // (Optional) Freeze balance or just check at approval time
    // We'll check at approval time; for now we don't deduct.

    // WhatsApp notification
    const adminPhone = process.env.ADMIN_PHONE;
    const message = `New Withdrawal Request\nUser: ${user.fullName}\nAmount: ₹${amount}\nBank: ${bankAccount.bankName}\nAccount: ${bankAccount.accountNumber}\nIFSC: ${bankAccount.ifscCode}`;
    const waLink = whatsappLink(adminPhone, message);

    req.flash('success_msg', 'Withdrawal request submitted. Admin will process it shortly.');
    res.render('user/withdraw-success', {
      title: 'Withdrawal Submitted',
      transaction,
      waLink
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error submitting withdrawal');
    res.redirect('/withdraw');
  }
};

// Add bank account
exports.addBankAccount = async (req, res) => {
  try {
    const { accountHolder, bankName, accountNumber, ifscCode } = req.body;
    if (!accountHolder || !bankName || !accountNumber || !ifscCode) {
      req.flash('error_msg', 'All fields are required');
      return res.redirect('/profile');
    }

    const user = await User.findById(req.user._id);
    // If first account, make it default
    const isDefault = user.bankAccounts.length === 0;
    user.bankAccounts.push({ accountHolder, bankName, accountNumber, ifscCode, isDefault });
    await user.save();

    req.flash('success_msg', 'Bank account added successfully');
    res.redirect('/profile');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error adding bank account');
    res.redirect('/profile');
  }
};

// Remove bank account (optional)
exports.removeBankAccount = async (req, res) => {
  try {
    const { accountId } = req.params;
    const user = await User.findById(req.user._id);
    user.bankAccounts.id(accountId).remove();
    await user.save();
    req.flash('success_msg', 'Bank account removed');
    res.redirect('/profile');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error removing bank account');
    res.redirect('/profile');
  }
};