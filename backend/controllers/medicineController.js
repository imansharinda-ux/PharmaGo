const pool = require('../config/database');

exports.getAllMedicines = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM medicines');
    res.json({
      message: 'Medicines retrieved successfully',
      count: result.rows.length,
      medicines: result.rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMedicineById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM medicines WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Medicine not found' });
    }

    res.json({
      message: 'Medicine retrieved successfully',
      medicine: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createMedicine = async (req, res) => {
  try {
    const { name, description, price, stock, category } = req.body;

    const result = await pool.query(
      'INSERT INTO medicines (name, description, price, stock, category) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, description, price, stock, category]
    );

    res.status(201).json({
      message: 'Medicine created successfully',
      medicine: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateMedicine = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, stock, category } = req.body;

    const result = await pool.query(
      'UPDATE medicines SET name = $1, description = $2, price = $3, stock = $4, category = $5 WHERE id = $6 RETURNING *',
      [name, description, price, stock, category, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Medicine not found' });
    }

    res.json({
      message: 'Medicine updated successfully',
      medicine: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteMedicine = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM medicines WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Medicine not found' });
    }

    res.json({
      message: 'Medicine deleted successfully',
      medicine: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
