const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { upload } = require('../middleware/upload');
const { whatsappLink } = require('../utils/helpers');
const path = require('path');
const fs = require('fs');

// Check if QR exists, else use placeholder
const getQrPath = () => {
  const qrPath = path.join(__dirname, '../public/images/upi_qr.png');
  if (fs.existsSync(qrPath)) {
    return '/images/upi_qr.png';
  }
  return '/images/upi_qr_placeholder.png'; // you can create a placeholder or fallback
};

exports.getDeposit = (req, res) => {
  const qrImage = getQrPath();
  const upiId = process.env.UPI_ID || 'admin@upi';
  res.render('user/deposit', {
    title: 'Deposit Funds',
    qrImage,
    upiId,
    baseUrl: process.env.BASE_URL
  });
};

exports.postDeposit = async (req, res) => {
  try {
    const { amount, utr } = req.body;
    const screenshotFile = req.file;

    if (!amount || !utr || !screenshotFile) {
      req.flash('error_msg', 'All fields are required');
      return res.redirect('/deposit');
    }

    // Validate amount
    if (isNaN(amount) || amount <= 0) {
      req.flash('error_msg', 'Invalid amount');
      return res.redirect('/deposit');
    }

    // Save transaction as pending
    const screenshotUrl = `/uploads/screenshots/${screenshotFile.filename}`;
    const transaction = new Transaction({
      user: req.user._id,
      type: 'deposit',
      amount: parseFloat(amount),
      status: 'pending',
      metadata: {
        utr: utr,
        screenshotUrl: screenshotUrl
      }
    });
    await transaction.save();

    // Generate WhatsApp link with message
    const adminPhone = process.env.ADMIN_PHONE;
    const baseUrl = process.env.BASE_URL;
    const fullScreenshotUrl = `${baseUrl}${screenshotUrl}`;
    const message = `New Deposit Request\nUser: ${req.user.fullName}\nAmount: ₹${amount}\nUTR: ${utr}\nScreenshot: ${fullScreenshotUrl}`;
    const waLink = whatsappLink(adminPhone, message);

    req.flash('success_msg', 'Deposit request submitted. Please send payment notification to admin.');
    res.render('user/deposit-success', {
      title: 'Deposit Submitted',
      transaction,
      waLink,
      baseUrl
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error submitting deposit');
    res.redirect('/deposit');
  }
};