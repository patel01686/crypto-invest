const moment = require('moment'); // optional, but we can use native Date

module.exports = {
  // Generate WhatsApp deep link
  whatsappLink: (phone, message) => {
    const encoded = encodeURIComponent(message);
    return `https://wa.me/${phone}?text=${encoded}`;
  },
  
  // Format date
  formatDate: (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  },
  
  // Calculate maturity date
  calculateMaturity: (startDate, tenureDays) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + tenureDays);
    return d;
  },
  
  // Check if investment is matured
  isMatured: (investment) => {
    return new Date() >= new Date(investment.maturityDate);
  },
  
  // Calculate returns (simple interest)
  calculateReturn: (amount, rate, tenureDays) => {
    // example: 5% weekly return = amount * (rate/100) * (tenureDays/7)
    const weeklyReturn = (amount * rate) / 100;
    const weeks = tenureDays / 7;
    return parseFloat((weeklyReturn * weeks).toFixed(2));
  }
};