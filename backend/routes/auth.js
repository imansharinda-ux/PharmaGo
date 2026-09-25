const express = require('express');
const router = express.Router();
const { register, login, logout, me } = require('../controllers/authController');
const { validateRegister, validateLogin } = require('../middleware/validators');
const { authenticateToken } = require('../middleware/auth');

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/logout', logout);
router.get('/me', authenticateToken, me);

module.exports = router;
