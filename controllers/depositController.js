const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { whatsappLink } = require('../utils/helpers');
const path = require('path');
const fs = require('fs');

// Helper: find UPI QR (fallback)
const getQrPath = () => {
  const baseDir = path.join(__dirname, '../public/images');
  const possibleNames = ['upi_qr.png', 'qr.png', 'qr.jpg', 'qr.jpeg'];
  for (const name of possibleNames) {
    const fullPath = path.join(baseDir, name);
    if (fs.existsSync(fullPath)) {
      return '/images/' + name;
    }
  }
  return null;
};

// GET deposit page
exports.getDeposit = (req, res) => {
  // Read from .env
  const upiId = process.env.UPI_ID || 'admin@upi';
  const usdtTrc20Address = process.env.USDT_TRC20_ADDRESS || 'TXYZ...1234';
  const usdtErc20Address = process.env.USDT_ERC20_ADDRESS || '0xABC...789';
  const usdtBep20Address = process.env.USDT_BEP20_ADDRESS || '0xDEF...456';

  // QR images – place your own images in public/images/
  const upiQr = '/images/upi-qr.png';
  const trc20Qr = '/images/usdt-trc20-qr.png';
  const erc20Qr = '/images/usdt-erc20-qr.png';
  const bep20Qr = '/images/usdt-bep20-qr.png';

  res.render('user/deposit', {
    title: 'Deposit Funds',
    upiId,
    upiQr,
    usdtTrc20Address,
    usdtErc20Address,
    usdtBep20Address,
    trc20Qr,
    erc20Qr,
    bep20Qr,
    baseUrl: process.env.BASE_URL,
    qrExists: true
  });
};

// POST deposit
exports.postDeposit = async (req, res) => {
  try {
    const { method, amount, utr } = req.body;

    if (!method || !amount || !utr) {
      req.flash('error_msg', 'All fields are required');
      return res.redirect('/deposit');
    }

    const depositAmount = parseFloat(amount);
    if (isNaN(depositAmount) || depositAmount <= 0) {
      req.flash('error_msg', 'Invalid amount');
      return res.redirect('/deposit');
    }

    // Determine currency and method label
    let currency = 'INR';
    let methodLabel = method.toUpperCase();

    if (method === 'usdt_trc20' || method === 'usdt_erc20' || method === 'usdt_bep20') {
      currency = 'USDT';
      methodLabel = method.toUpperCase().replace('_', ' ');
    } else if (method === 'upi') {
      currency = 'INR';
      methodLabel = 'UPI';
    }

    const transaction = new Transaction({
      user: req.user._id,
      type: 'deposit',
      amount: depositAmount,
      status: 'pending',
      metadata: {
        utr: utr,
        method: method
      }
    });
    await transaction.save();

    const adminPhone = process.env.ADMIN_PHONE;
    const message = `New Deposit Request\nUser: ${req.user.fullName}\nAmount: ${depositAmount} ${currency}\nMethod: ${methodLabel}\nUTR: ${utr}`;
    const waLink = whatsappLink(adminPhone, message);

    req.flash('success_msg', 'Deposit request submitted.');
    res.render('user/deposit-success', {
      title: 'Deposit Submitted',
      transaction,
      waLink,
      baseUrl: process.env.BASE_URL
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error submitting deposit');
    res.redirect('/deposit');
  }
};