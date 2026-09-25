const express = require('express');
const router = express.Router();
const c = require('../controllers/orderController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validateCheckout } = require('../middleware/validators');
const { prescriptionUpload, handleUpload } = require('../middleware/upload');

const staff = requireRole('pharmacist', 'delivery', 'admin');
const pharmacy = requireRole('pharmacist', 'admin');
const delivery = requireRole('delivery', 'admin');

// Public tracking by order number (no personal details)
router.get('/track/:orderNo', c.trackPublic);

router.use(authenticateToken);

// Customer
router.post('/', requireRole('customer'), validateCheckout, c.createOrder);
router.post('/prescription', requireRole('customer'), handleUpload(prescriptionUpload), c.createPrescriptionOrder);
router.get('/my', requireRole('customer'), c.getMyOrders);

// Staff lists
router.get('/', staff, c.listOrders);
router.get('/stats', staff, c.stats);
router.post('/auto-assign', delivery, c.autoAssign);

// One order (customer who owns it, or staff)
router.get('/:orderNo', c.getOrder);
router.post('/:orderNo/cancel', requireRole('customer', 'admin'), c.cancelOrder);
router.get('/:orderNo/prescriptions/:id/file', c.getPrescriptionFile);
router.get('/:orderNo/messages', c.getMessages);
router.post('/:orderNo/messages', c.postMessage);

// Pharmacist (and admin)
router.post('/:orderNo/items', pharmacy, c.addItem);
router.patch('/:orderNo/items/:itemId', pharmacy, c.updateItem);
router.delete('/:orderNo/items/:itemId', pharmacy, c.removeItem);
router.post('/:orderNo/verify', pharmacy, c.verify);
router.post('/:orderNo/pack', pharmacy, c.pack);
router.post('/:orderNo/reject', pharmacy, c.reject);

// Delivery master (and admin)
router.post('/:orderNo/rider', delivery, c.assignRider);
router.patch('/:orderNo/eta', delivery, c.setEta);
router.post('/:orderNo/advance', delivery, c.advance);
router.post('/:orderNo/undo', delivery, c.undo);
router.post('/:orderNo/failed', delivery, c.failedAttempt);
router.post('/:orderNo/updates', delivery, c.postUpdate);

// Admin
router.patch('/:orderNo/status', requireRole('admin'), c.setStatus);

module.exports = router;
