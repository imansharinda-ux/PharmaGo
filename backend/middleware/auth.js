const jwt = require('jsonwebtoken');

// Checks the "Authorization: Bearer <token>" header and puts the user on req.user
exports.authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, email, name, role }
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Same as authenticateToken but does not fail when there is no token
exports.optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token) {
    try { req.user = jwt.verify(token, process.env.JWT_SECRET); } catch (e) { /* ignore */ }
  }
  next();
};

// Only lets the listed roles through, e.g. requireRole('pharmacist', 'admin')
exports.requireRole = (...roles) => (req, res, next) => {
  if (req.user && roles.includes(req.user.role)) return next();
  res.status(403).json({ error: `This action needs one of these roles: ${roles.join(', ')}` });
};

exports.isAdmin = exports.requireRole('admin');
