require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const flash = require('connect-flash');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const mongoose = require('mongoose');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');

// ✅ Import home controller (for landing page)
const homeController = require('./controllers/homeController');

// Import config
const connectDB = require('./config/db');
const passportConfig = require('./config/passport');

const app = express();

// Connect to MongoDB
connectDB();

// ------------------------- ADMIN SEEDER (inline) -------------------------
const User = require('./models/User');

async function createAdminIfNotExists() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    const existingAdmin = await User.findOne({ role: 'admin' });
    if (!existingAdmin) {
      const admin = new User({
        fullName: 'Super Admin',
        email: adminEmail,
        phone: '9999999999',
        password: adminPassword,
        role: 'admin',
        isActive: true,
        walletBalance: 0
      });
      await admin.save();
      console.log('✅ Admin user created successfully');
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Password: ${adminPassword}`);
    } else {
      console.log('✅ Admin user already exists');
    }
  } catch (err) {
    console.error('❌ Error creating admin:', err.message);
  }
}

createAdminIfNotExists();

// Passport config
passportConfig(passport);

// Body parser
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// EJS setup
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layouts/main');

// Session
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Flash messages
app.use(flash());

// Global variables
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  res.locals.user = req.user || null;
  next();
});

// ------------------------- ROUTES -------------------------
app.use('/', authRoutes);
app.use('/', userRoutes);
app.use('/admin', adminRoutes);

// ✅ ROOT ROUTE – Home page (hero banner + investment plans)
app.get('/', homeController.getHome);

// 404 handler
app.use((req, res) => {
  res.status(404).render('404', { title: 'Page Not Found' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});