const pool = require('../config/database');

// GET /api/medicines?search=&category=&rx=true|false&include_inactive=1
exports.getAllMedicines = async (req, res) => {
  try {
    const { search, category, rx } = req.query;
    const where = [];
    const params = [];
    const staff = req.user && ['admin', 'pharmacist'].includes(req.user.role);
    if (!(staff && req.query.include_inactive)) where.push('active = TRUE');
    if (search) { params.push(`%${search}%`); where.push(`(name ILIKE $${params.length} OR pack_size ILIKE $${params.length} OR label ILIKE $${params.length})`); }
    if (category && category !== 'all') { params.push(category); where.push(`category = $${params.length}`); }
    if (rx === 'true' || rx === 'false') { params.push(rx === 'true'); where.push(`rx_required = $${params.length}`); }
    const sql = `SELECT *,
      (SELECT COALESCE(SUM(oi.quantity),0) FROM order_items oi JOIN orders o ON o.id = oi.order_id
        WHERE oi.medicine_id = medicines.id AND o.status NOT IN ('cancelled','rejected')) AS sold
      FROM medicines ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY rx_required, id DESC`;
    const result = await pool.query(sql, params);
    res.json({ message: 'Medicines retrieved successfully', count: result.rows.length, medicines: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMedicineById = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM medicines WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Medicine not found' });
    res.json({ message: 'Medicine retrieved successfully', medicine: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Admin: add a new product. Accepts JSON or multipart (with an "image" file).
exports.createMedicine = async (req, res) => {
  try {
    const { name, description, price, stock, category, rx_required, pack_size, label } = req.body;
    const dup = await pool.query('SELECT id FROM medicines WHERE LOWER(name) = LOWER($1)', [name.trim()]);
    if (dup.rows.length) return res.status(400).json({ error: 'A product with that name is already in the shop' });
    const rx = rx_required === true || rx_required === 'true';
    const image_url = req.file ? `/uploads/products/${req.file.filename}` : (req.body.image_url || null);
    const result = await pool.query(
      `INSERT INTO medicines (name, description, price, stock, category, rx_required, pack_size, label, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [name.trim(), description || null, price, stock === undefined || stock === '' ? 100 : stock, rx ? 'rx' : (category || 'otc'), rx, pack_size || null, (label || (rx ? 'Prescription' : 'New')).toUpperCase(), image_url]
    );
    res.status(201).json({ message: 'Medicine created successfully', medicine: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Admin: update any field (only the fields you send are changed)
exports.updateMedicine = async (req, res) => {
  try {
    const allowed = ['name', 'description', 'price', 'stock', 'category', 'rx_required', 'pack_size', 'label', 'image_url', 'active'];
    const sets = []; const params = [];
    for (const k of allowed) {
      if (req.body[k] !== undefined) { params.push(req.body[k]); sets.push(`${k} = $${params.length}`); }
    }
    if (req.file) { params.push(`/uploads/products/${req.file.filename}`); sets.push(`image_url = $${params.length}`); }
    if (!sets.length) return res.status(400).json({ error: 'Nothing to update' });
    if (req.body.price !== undefined && !(Number(req.body.price) > 0)) return res.status(400).json({ error: 'Price must be a positive number' });
    if (req.body.stock !== undefined && !(Number.isInteger(Number(req.body.stock)) && Number(req.body.stock) >= 0)) return res.status(400).json({ error: 'Stock must be 0 or more' });
    params.push(req.params.id);
    const result = await pool.query(`UPDATE medicines SET ${sets.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${params.length} RETURNING *`, params);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Medicine not found' });
    res.json({ message: 'Medicine updated successfully', medicine: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Admin: remove a product from the shop. Products used in orders are hidden instead of deleted.
exports.deleteMedicine = async (req, res) => {
  try {
    const used = await pool.query('SELECT 1 FROM order_items WHERE medicine_id = $1 LIMIT 1', [req.params.id]);
    const result = used.rows.length
      ? await pool.query('UPDATE medicines SET active = FALSE WHERE id = $1 RETURNING *', [req.params.id])
      : await pool.query('DELETE FROM medicines WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Medicine not found' });
    res.json({ message: used.rows.length ? 'Medicine hidden from the shop (it is used in orders)' : 'Medicine deleted successfully', medicine: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
