const express = require('express');
const router = express.Router();
const { listStaff, createStaff, updateStaff, listRiders } = require('../controllers/staffController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validateStaff } = require('../middleware/validators');

router.use(authenticateToken);
router.get('/riders', requireRole('delivery', 'admin'), listRiders);
router.get('/', requireRole('admin'), listStaff);
router.post('/', requireRole('admin'), validateStaff, createStaff);
router.patch('/:id', requireRole('admin'), updateStaff);

module.exports = router;
