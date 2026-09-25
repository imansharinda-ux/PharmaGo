const bcrypt = require('bcryptjs');
const pool = require('../config/database');

const ROLE_LABEL = { pharmacist: 'Pharmacist', delivery: 'Delivery master', admin: 'Admin', rider: 'Rider' };

// GET /api/staff  (admin)
exports.listStaff = async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT u.id, u.name, u.email, u.role, u.phone, u.vehicle, u.active, u.created_at,
        CASE WHEN u.role = 'rider' THEN (SELECT COUNT(*)::int FROM orders WHERE rider_id = u.id)
             ELSE (SELECT COUNT(DISTINCT order_id)::int FROM order_events WHERE actor_id = u.id) END AS work
      FROM users u WHERE u.role <> 'customer' ORDER BY CASE u.role WHEN 'admin' THEN 0 WHEN 'pharmacist' THEN 1 WHEN 'delivery' THEN 2 ELSE 3 END, u.name`);
    res.json({ staff: r.rows.map(s => ({ ...s, role_label: ROLE_LABEL[s.role] || s.role })) });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// POST /api/staff  (admin) { name, email, password, role, phone, vehicle }
exports.createStaff = async (req, res) => {
  try {
    const { name, email, password, role, phone, vehicle } = req.body;
    const dup = await pool.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [email]);
    if (dup.rows.length) return res.status(400).json({ error: 'That email already has an account' });
    const hash = await bcrypt.hash(password, 10);
    const r = await pool.query(
      'INSERT INTO users (name, email, password, role, phone, vehicle) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, name, email, role, phone, vehicle, active',
      [name.trim(), email.trim(), hash, role, phone || null, role === 'rider' ? (vehicle || 'Motorbike') : null]
    );
    res.status(201).json({ message: `${name} added as ${ROLE_LABEL[role]}`, staff: r.rows[0] });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// PATCH /api/staff/:id  (admin) { active }
exports.updateStaff = async (req, res) => {
  try {
    if (Number(req.params.id) === req.user.id && req.body.active === false) return res.status(400).json({ error: 'You can’t disable your own account' });
    const r = await pool.query("UPDATE users SET active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND role <> 'customer' RETURNING id, name, active", [!!req.body.active, req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Staff member not found' });
    res.json({ message: `${r.rows[0].name} ${r.rows[0].active ? 'enabled' : 'disabled'}`, staff: r.rows[0] });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// GET /api/staff/riders  (delivery master, admin)
exports.listRiders = async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT id, name, phone, vehicle,
        (SELECT COUNT(*)::int FROM orders WHERE rider_id = users.id AND status IN ('packed','picked_up','out_for_delivery')) AS load
      FROM users WHERE role = 'rider' AND active = TRUE ORDER BY name`);
    res.json({ riders: r.rows });
  } catch (error) { res.status(500).json({ error: error.message }); }
};
