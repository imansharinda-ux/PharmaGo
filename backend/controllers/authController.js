const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const publicUser = u => ({ id: u.id, email: u.email, name: u.name, role: u.role, phone: u.phone, address: u.address, district: u.district });
const signToken = u => jwt.sign({ id: u.id, email: u.email, name: u.name, role: u.role }, process.env.JWT_SECRET, { expiresIn: '24h' });

// Customers create their own account. Staff accounts are created by the admin.
exports.register = async (req, res) => {
  try {
    const { email, password, name, phone, address, district } = req.body;
    const userExists = await pool.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (email, password, name, phone, address, district, role) VALUES ($1, $2, $3, $4, $5, $6, 'customer') RETURNING *",
      [email.trim(), hashedPassword, name.trim(), phone || null, address || null, district || null]
    );
    const user = result.rows[0];
    res.status(201).json({ message: 'User registered successfully', token: signToken(user), user: publicUser(user) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email.trim()]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    if (!user.active) {
      return res.status(403).json({ error: 'This account is disabled. Please contact the admin.' });
    }
    if (user.role === 'rider') {
      return res.status(403).json({ error: 'Riders do not use the web portal. Please contact your delivery master.' });
    }
    res.json({ message: 'Login successful', token: signToken(user), user: publicUser(user) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.me = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (!result.rows.length || !result.rows[0].active) return res.status(401).json({ error: 'Account not found or disabled' });
    res.json({ user: publicUser(result.rows[0]) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.logout = async (req, res) => {
  res.json({ message: 'Logout successful' });
};
