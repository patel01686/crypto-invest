const express = require('express');
const router = express.Router();
const { forwardAuthenticated } = require('../middleware/auth');
const { 
  getLogin, postLogin, getRegister, postRegister, logout 
} = require('../controllers/authController');

router.get('/login', forwardAuthenticated, getLogin);
router.post('/login', postLogin);
router.get('/register', forwardAuthenticated, getRegister);
router.post('/register', postRegister);
router.get('/logout', logout);

module.exports = router;