const express = require('express');
const router = express.Router();
const {
  getAllMedicines,
  getMedicineById,
  createMedicine,
  updateMedicine,
  deleteMedicine
} = require('../controllers/medicineController');
const { authenticateToken, optionalAuth, requireRole } = require('../middleware/auth');
const { validateMedicine } = require('../middleware/validators');
const { productImageUpload, handleUpload } = require('../middleware/upload');

// Anyone can browse the shop
router.get('/', optionalAuth, getAllMedicines);
router.get('/:id', getMedicineById);

// Only the admin can add, edit or remove products
router.post('/', authenticateToken, requireRole('admin'), handleUpload(productImageUpload), validateMedicine, createMedicine);
router.put('/:id', authenticateToken, requireRole('admin'), handleUpload(productImageUpload), updateMedicine);
router.delete('/:id', authenticateToken, requireRole('admin'), deleteMedicine);

module.exports = router;
