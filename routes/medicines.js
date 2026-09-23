const express = require('express');
const router = express.Router();
const {
  getAllMedicines,
  getMedicineById,
  createMedicine,
  updateMedicine,
  deleteMedicine
} = require('../controllers/medicineController');

router.get('/', getAllMedicines);
router.get('/:id', getMedicineById);
router.post('/', createMedicine);
router.put('/:id', updateMedicine);
router.delete('/:id', deleteMedicine);

module.exports = router;