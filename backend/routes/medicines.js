const express = require('express');
const router = express.Router();
const {
  getAllMedicines,
  getMedicineById,
  createMedicine,
  updateMedicine,
  deleteMedicine
} = require('../controllers/medicineController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', getAllMedicines);
router.get('/:id', getMedicineById);
router.post('/', authenticateToken, createMedicine);
router.put('/:id', authenticateToken, updateMedicine);
router.delete('/:id', authenticateToken, deleteMedicine);

module.exports = router;