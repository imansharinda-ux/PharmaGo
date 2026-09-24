const express = require('express');
const router = express.Router();
const {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  getUserOrders,
  cancelOrder
} = require('../controllers/orderController');
const { authenticateToken } = require('../middleware/auth');

router.post('/', authenticateToken, createOrder);
router.get('/', authenticateToken, getAllOrders);
router.get('/user/:user_id', authenticateToken, getUserOrders);
router.get('/:id', authenticateToken, getOrderById);
router.put('/:id/status', authenticateToken, updateOrderStatus);
router.put('/:id/cancel', authenticateToken, cancelOrder);

module.exports = router;