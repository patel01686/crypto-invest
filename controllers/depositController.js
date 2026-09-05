const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { whatsappLink } = require('../utils/helpers');
const path = require('path');
const fs = require('fs');

// ---------- Helper: find a single UPI QR (fallback) ----------
// (Not used directly now, but kept for fallback if needed)
const getQrPath = () => {
  const baseDir = path.join(__dirname, '../public/images');
  const possibleNames = ['upi_qr.png', 'qr.png', 'qr.jpg', 'qr.jpeg', 'upi_qr.jpg', 'upi_qr.jpeg'];
  for (const name of possibleNames) {
    const fullPath = path.join(baseDir, name);
    if (fs.existsSync(fullPath)) {
      return '/images/' + name;
    }
  }
  return null;
};

// ---------- GET deposit page ----------
exports.getDeposit = (req, res) => {
  // Read UPI IDs from environment variables
  const upiId1 = process.env.UPI_ID_1 || 'upi1@paytm';
  const upiId2 = process.env.UPI_ID_2 || 'upi2@paytm';
  const upiId3 = process.env.UPI_ID_3 || 'upi3@paytm';
  const usdtTrc20Address = process.env.USDT_TRC20_ADDRESS || 'TXYZ...1234';

  // QR image paths – place your own images in public/images/
  // For each UPI, you should have a separate QR code image.
  const upiQr1 = '/images/upi1-qr.png';
  const upiQr2 = '/images/upi2-qr.png';
  const upiQr3 = '/images/upi3-qr.png';
  const usdtTrc20Qr = '/images/usdt-trc20-qr.png';

  res.render('user/deposit', {
    title: 'Deposit Funds',
    // UPI details
    upiId1,
    upiId2,
    upiId3,
    upiQr1,
    upiQr2,
    upiQr3,
    // TRC20 details
    usdtTrc20Address,
    usdtTrc20Qr,
    // Other common data
    baseUrl: process.env.BASE_URL,
    qrExists: true // we always have images
  });
};

// ---------- POST deposit (handle all methods) ----------
exports.postDeposit = async (req, res) => {
  try {
    const { method, amount, utr } = req.body;

    // Validate all required fields
    if (!method || !amount || !utr) {
      req.flash('error_msg', 'All fields are required');
      return res.redirect('/deposit');
    }

    const depositAmount = parseFloat(amount);
    if (isNaN(depositAmount) || depositAmount <= 0) {
      req.flash('error_msg', 'Invalid amount');
      return res.redirect('/deposit');
    }

    // Determine currency and method label for display
    let currency = 'INR';
    let methodLabel = method.toUpperCase();

    if (method === 'usdt_trc20') {
      currency = 'USDT';
      methodLabel = 'USDT TRC20';
    } else if (method.startsWith('upi')) {
      currency = 'INR';
      methodLabel = `UPI (${method.toUpperCase()})`;
    }

    // Create transaction
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

    // WhatsApp message to admin
    const adminPhone = process.env.ADMIN_PHONE;
    const message = `New Deposit Request\nUser: ${req.user.fullName}\nAmount: ${depositAmount} ${currency}\nMethod: ${methodLabel}\nUTR: ${utr}`;
    const waLink = whatsappLink(adminPhone, message);

    req.flash('success_msg', 'Deposit request submitted. Admin will verify it shortly.');
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