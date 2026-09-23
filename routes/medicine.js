const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Get all medicines - to be implemented' });
});

router.get('/:id', (req, res) => {
  res.json({ message: 'Get medicine by ID - to be implemented' });
});

router.post('/', (req, res) => {
  res.json({ message: 'Create medicine - to be implemented' });
});

router.put('/:id', (req, res) => {
  res.json({ message: 'Update medicine - to be implemented' });
});

router.delete('/:id', (req, res) => {
  res.json({ message: 'Delete medicine - to be implemented' });
});

module.exports = router;
