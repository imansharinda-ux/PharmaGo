const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS_ORIGIN can be one address or a comma-separated list
const origins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:3000').split(',').map(s => s.trim());

app.use(express.json({ limit: '1mb' }));
app.use(cors({ origin: origins }));

// Product photos added by the admin (prescriptions are NOT public — they go through /api/orders/.../file)
app.use('/uploads/products', express.static(path.join(__dirname, 'uploads', 'products')));

app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to PharmaGo Backend!',
    version: '2.0.0',
    status: 'Running'
  });
});

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const authRoutes = require('./routes/auth');
const medicineRoutes = require('./routes/medicines');
const orderRoutes = require('./routes/orders');
const staffRoutes = require('./routes/staff');

app.use('/api/auth', authRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/staff', staffRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: err.message
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 PharmaGo Backend running on http://localhost:${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

module.exports = app;
