const { qrUpload } = require('../middleware/upload');
const fs = require('fs');
const path = require('path');

exports.getSettings = (req, res) => {
  const upiId = process.env.UPI_ID || 'admin@upi';
  const qrExists = fs.existsSync(path.join(__dirname, '../public/images/upi_qr.png'));
  res.render('admin/settings', {
    title: 'Site Settings',
    upiId,
    qrExists
  });
};

exports.updateUpiId = (req, res) => {
  const { upiId } = req.body;
  if (!upiId) {
    req.flash('error_msg', 'UPI ID is required');
    return res.redirect('/admin/settings');
  }
  // Update .env file or store in DB; for simplicity, we update process.env (but restart needed for persistence)
  // In production, store in a Settings collection. We'll just update process.env and suggest restart.
  process.env.UPI_ID = upiId;
  req.flash('success_msg', 'UPI ID updated (will persist on restart if .env is updated manually)');
  res.redirect('/admin/settings');
};

exports.uploadQr = (req, res) => {
  // Multer handles upload
  if (!req.file) {
    req.flash('error_msg', 'Please upload an image');
    return res.redirect('/admin/settings');
  }
  req.flash('success_msg', 'QR Code uploaded successfully');
  res.redirect('/admin/settings');
};