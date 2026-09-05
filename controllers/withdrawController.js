const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { whatsappLink } = require('../utils/helpers');

// GET withdraw page
exports.getWithdraw = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.render('user/withdraw', {
      title: 'Withdraw Funds',
      bankAccounts: user.bankAccounts || [],
      walletAddresses: user.walletAddresses || [],
      walletBalance: user.walletBalance
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error loading withdrawal page');
    res.redirect('/dashboard');
  }
};

// POST withdrawal – FIXED ✅
exports.postWithdraw = async (req, res) => {
  try {
    const { amount, withdrawType, accountId } = req.body;
    const user = await User.findById(req.user._id);

    if (!amount || isNaN(amount) || amount <= 0) {
      req.flash('error_msg', 'Invalid amount');
      return res.redirect('/withdraw');
    }

    if (amount > user.walletBalance) {
      req.flash('error_msg', 'Insufficient balance');
      return res.redirect('/withdraw');
    }

    let metadata = {};

    if (withdrawType === 'bank') {
      const bankAccount = user.bankAccounts.id(accountId);
      if (!bankAccount) {
        req.flash('error_msg', 'Select a bank account');
        return res.redirect('/withdraw');
      }
      // ✅ Store as bankAccount for admin view
      metadata = {
        bankAccount: {
          accountHolder: bankAccount.accountHolder,
          bankName: bankAccount.bankName,
          accountNumber: bankAccount.accountNumber,
          ifscCode: bankAccount.ifscCode
        }
      };
    } else if (withdrawType === 'wallet') {
      const wallet = user.walletAddresses.id(accountId);
      if (!wallet) {
        req.flash('error_msg', 'Select a wallet address');
        return res.redirect('/withdraw');
      }
      // ✅ Store as walletAddress
      metadata = {
        walletAddress: {
          network: wallet.network,
          address: wallet.address,
          label: wallet.label
        }
      };
    } else {
      req.flash('error_msg', 'Invalid method');
      return res.redirect('/withdraw');
    }

    // Create transaction
    const transaction = new Transaction({
      user: user._id,
      type: 'withdrawal',
      amount: parseFloat(amount),
      status: 'pending',
      metadata: metadata
    });
    await transaction.save();

    // WhatsApp message
    const adminPhone = process.env.ADMIN_PHONE;
    let message = `New Withdrawal Request\nUser: ${user.fullName}\nAmount: ₹${amount}\n`;
    if (withdrawType === 'bank') {
      message += `Bank: ${metadata.bankAccount.bankName}\nAccount: ${metadata.bankAccount.accountNumber}\nIFSC: ${metadata.bankAccount.ifscCode}`;
    } else {
      message += `Network: ${metadata.walletAddress.network}\nAddress: ${metadata.walletAddress.address}`;
    }
    const waLink = whatsappLink(adminPhone, message);

    req.flash('success_msg', 'Withdrawal request submitted');
    res.render('user/withdraw-success', { title: 'Withdrawal Submitted', transaction, waLink });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error submitting withdrawal');
    res.redirect('/withdraw');
  }
};

// ---- BANK ACCOUNT FUNCTIONS ----
exports.addBankAccount = async (req, res) => {
  try {
    const { accountHolder, bankName, accountNumber, ifscCode } = req.body;
    if (!accountHolder || !bankName || !accountNumber || !ifscCode) {
      req.flash('error_msg', 'All fields required');
      return res.redirect('/profile');
    }
    const user = await User.findById(req.user._id);
    const isDefault = user.bankAccounts.length === 0;
    user.bankAccounts.push({ accountHolder, bankName, accountNumber, ifscCode, isDefault });
    await user.save();
    req.flash('success_msg', 'Bank account added');
    res.redirect('/profile');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error adding bank account');
    res.redirect('/profile');
  }
};

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

// ---- WALLET FUNCTIONS ----
exports.addWalletAddress = async (req, res) => {
  try {
    const { network, address, label } = req.body;
    if (!network || !address) {
      req.flash('error_msg', 'Network and address required');
      return res.redirect('/profile');
    }
    const user = await User.findById(req.user._id);
    const isDefault = user.walletAddresses.length === 0;
    user.walletAddresses.push({ network, address, label: label || '', isDefault });
    await user.save();
    req.flash('success_msg', 'Wallet address added');
    res.redirect('/profile');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error adding wallet');
    res.redirect('/profile');
  }
};

exports.removeWalletAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const user = await User.findById(req.user._id);
    user.walletAddresses.id(addressId).remove();
    await user.save();
    req.flash('success_msg', 'Wallet address removed');
    res.redirect('/profile');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error removing wallet');
    res.redirect('/profile');
  }
};