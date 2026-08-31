const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { whatsappLink } = require('../utils/helpers');
const path = require('path');
const fs = require('fs');

// Helper: find QR image
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

// GET deposit page
exports.getDeposit = (req, res) => {
  const qrImage = getQrPath();
  const upiId = process.env.UPI_ID || 'admin@upi';
  
  // Hardcoded dummy addresses for demo (you can store in env or DB)
  const usdtTrc20Address = process.env.USDT_TRC20_ADDRESS || 'TXYZ...1234';
  const usdtErc20Address = process.env.USDT_ERC20_ADDRESS || '0xABC...789';
  const usdtBep20Address = process.env.USDT_BEP20_ADDRESS || '0xDEF...456';
  
  res.render('user/deposit', {
    title: 'Deposit Funds',
    qrImage,
    upiId,
    baseUrl: process.env.BASE_URL,
    qrExists: qrImage !== null,
    usdtTrc20Qr: '/images/usdt-trc20-qr.png', // you can place your own QR images
    usdtErc20Qr: '/images/usdt-erc20-qr.png',
    usdtBep20Qr: '/images/usdt-bep20-qr.png',
    usdtTrc20Address,
    usdtErc20Address,
    usdtBep20Address
  });
};

// POST deposit (handle different methods)
exports.postDeposit = async (req, res) => {
  try {
    const { method, amount, utr } = req.body;
    
    // ✅ Validation – no screenshot required
    if (!method || !amount || !utr) {
      req.flash('error_msg', 'All fields are required');
      return res.redirect('/deposit');
    }

    const depositAmount = parseFloat(amount);
    if (isNaN(depositAmount) || depositAmount <= 0) {
      req.flash('error_msg', 'Invalid amount');
      return res.redirect('/deposit');
    }

    // Create transaction record (without screenshot)
    const transaction = new Transaction({
      user: req.user._id,
      type: 'deposit',
      amount: depositAmount,
      status: 'pending',
      metadata: {
        utr: utr,
        method: method // 'upi', 'usdt_trc20', etc.
      }
    });
    await transaction.save();

    // Prepare WhatsApp message
    const adminPhone = process.env.ADMIN_PHONE;
    const message = `New Deposit Request\nUser: ${req.user.fullName}\nAmount: ${depositAmount} ${method === 'upi' ? 'INR' : 'USDT'}\nMethod: ${method.toUpperCase()}\nUTR: ${utr}`;
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