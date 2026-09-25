const path = require('path');
const fs = require('fs');
const pool = require('../config/database');
const { UPLOAD_ROOT } = require('../middleware/upload');

// ---------------------------------------------------------------------------
// Order status flow
//   awaiting_review -> verified -> packed -> picked_up -> out_for_delivery -> delivered
//   (awaiting_review -> rejected)   (awaiting_review / any active step -> cancelled)
// ---------------------------------------------------------------------------
const FLOW = ['awaiting_review', 'verified', 'packed', 'picked_up', 'out_for_delivery', 'delivered'];
const LABEL = {
  awaiting_review: 'Awaiting review', verified: 'Verified', packed: 'Ready for delivery', picked_up: 'With courier',
  out_for_delivery: 'Out for delivery', delivered: 'Delivered', rejected: 'Rejected', cancelled: 'Cancelled'
};
const DELIVERY_VISIBLE = ['packed', 'picked_up', 'out_for_delivery', 'delivered'];
const STAFF = ['pharmacist', 'delivery', 'admin'];

class HttpError extends Error { constructor(status, message) { super(message); this.status = status; } }
const fail = (status, message) => { throw new HttpError(status, message); };

// run fn inside a transaction and send its result (or the error) as JSON
const handle = fn => async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(req, client);
    await client.query('COMMIT');
    res.status(result && result.__status ? result.__status : 200).json(result);
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    res.status(error.status || 500).json({ error: error.message });
  } finally {
    client.release();
  }
};

const daysFor = district => (String(district).toLowerCase() === 'colombo' ? 1 : 3);
const etaText = district => {
  const d = new Date(); d.setDate(d.getDate() + daysFor(district));
  const w = d.toLocaleDateString('en-GB', { weekday: 'long' });
  const dm = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
  return `${w}, ${dm}`;
};
const actorName = user => user ? user.name : 'Customer';

async function addEvent(client, orderId, kind, title, note, user, visible = true) {
  await client.query(
    'INSERT INTO order_events (order_id, kind, title, note, actor_id, actor_name, customer_visible) VALUES ($1,$2,$3,$4,$5,$6,$7)',
    [orderId, kind, title, note || null, user ? user.id : null, user && user.role !== 'customer' ? user.name : 'Customer', visible]
  );
}

async function recalcTotal(client, orderId) {
  await client.query(
    'UPDATE orders SET total_price = COALESCE((SELECT SUM(price * quantity) FROM order_items WHERE order_id = $1), 0), updated_at = CURRENT_TIMESTAMP WHERE id = $1',
    [orderId]
  );
}

async function restoreStock(client, orderId) {
  const items = await client.query('SELECT medicine_id, quantity FROM order_items WHERE order_id = $1', [orderId]);
  for (const it of items.rows) await client.query('UPDATE medicines SET stock = stock + $1 WHERE id = $2', [it.quantity, it.medicine_id]);
}

async function nextOrderNo(client) {
  const r = await client.query("SELECT 'PG-' || nextval('order_no_seq') AS no");
  return r.rows[0].no;
}

// Load an order by its number and check the user may see it
async function loadOrder(client, orderNo, user, { lock = false } = {}) {
  const r = await client.query(`SELECT * FROM orders WHERE order_no = $1 ${lock ? 'FOR UPDATE' : ''}`, [String(orderNo).toUpperCase()]);
  if (!r.rows.length) fail(404, 'Order not found');
  const o = r.rows[0];
  if (user) {
    if (user.role === 'customer' && o.user_id !== user.id) fail(404, 'Order not found');
    if (user.role === 'delivery' && !DELIVERY_VISIBLE.includes(o.status)) fail(403, 'This order is not ready for delivery yet');
    if (!['customer', ...STAFF].includes(user.role)) fail(403, 'Not allowed');
  }
  return o;
}

// Everything the order page needs, filtered by role
async function fullOrder(client, orderId, user) {
  const o = (await client.query(
    `SELECT o.*, r.name AS rider_name, r.phone AS rider_phone, r.vehicle AS rider_vehicle
     FROM orders o LEFT JOIN users r ON r.id = o.rider_id WHERE o.id = $1`, [orderId])).rows[0];
  const items = (await client.query(
    `SELECT oi.id, oi.medicine_id, oi.quantity, oi.price, oi.added_by, m.name, m.pack_size, m.image_url, m.rx_required
     FROM order_items oi JOIN medicines m ON m.id = oi.medicine_id WHERE oi.order_id = $1 ORDER BY oi.id`, [orderId])).rows;
  const isCustomer = !user || user.role === 'customer';
  const events = (await client.query(
    `SELECT kind, title, note, actor_name, created_at FROM order_events WHERE order_id = $1 ${isCustomer ? 'AND customer_visible = TRUE' : ''} ORDER BY created_at, id`, [orderId])).rows;
  const showRx = user && ['customer', 'pharmacist', 'admin'].includes(user.role);
  const prescriptions = showRx ? (await client.query(
    'SELECT id, original_name, mime_type, size_bytes, created_at FROM prescriptions WHERE order_id = $1 ORDER BY id', [orderId])).rows
    .map(p => ({ ...p, url: `/api/orders/${o.order_no}/prescriptions/${p.id}/file` })) : [];
  return {
    order: {
      id: o.id, order_no: o.order_no, tracking_no: o.order_no.replace('PG-', 'PGX-'), type: o.order_type,
      status: o.status, status_label: LABEL[o.status] || o.status,
      customer_name: o.customer_name, phone: o.phone, address: o.delivery_address, district: o.district,
      pay_method: o.pay_method, note: o.note, eta: o.eta, received_by: o.received_by,
      total: Number(o.total_price), created_at: o.created_at, updated_at: o.updated_at,
      delivery_days: daysFor(o.district) === 1 ? '1 day' : '2–3 days',
      rider: o.rider_id ? { id: o.rider_id, name: o.rider_name, phone: o.rider_phone, vehicle: o.rider_vehicle } : null
    },
    items: items.map(i => ({ ...i, price: Number(i.price), line_total: Number(i.price) * i.quantity })),
    events,
    prescriptions
  };
}

const summaryRow = r => ({
  order_no: r.order_no, type: r.order_type, status: r.status, status_label: LABEL[r.status] || r.status,
  customer_name: r.customer_name, district: r.district, created_at: r.created_at, total: Number(r.total_price),
  item_count: Number(r.item_count || 0), items_summary: r.items_summary || '', eta: r.eta,
  rider_name: r.rider_name || null, pay_method: r.pay_method
});
const LIST_SQL = `SELECT o.*, r.name AS rider_name,
  (SELECT COALESCE(SUM(quantity),0) FROM order_items WHERE order_id = o.id) AS item_count,
  (SELECT string_agg(m.name || CASE WHEN oi.quantity > 1 THEN ' × ' || oi.quantity ELSE '' END, ', ' ORDER BY oi.id)
     FROM order_items oi JOIN medicines m ON m.id = oi.medicine_id WHERE oi.order_id = o.id) AS items_summary
  FROM orders o LEFT JOIN users r ON r.id = o.rider_id`;

// ===========================================================================
// Customer
// ===========================================================================

// POST /api/orders  — checkout a cart (products that don't need a prescription)
exports.createOrder = handle(async (req, client) => {
  const { items, customer_name, phone, address, district, pay_method, note } = req.body;
  const user = req.user;
  let total = 0;
  const lines = [];
  for (const it of items) {
    const m = (await client.query('SELECT * FROM medicines WHERE id = $1 FOR UPDATE', [it.medicine_id])).rows[0];
    if (!m || !m.active) fail(404, `Product ${it.medicine_id} is no longer in the shop`);
    if (m.rx_required) fail(400, `${m.name} needs a prescription. Upload your prescription and a pharmacist will add it.`);
    if (m.stock < it.quantity) fail(400, `Only ${m.stock} left of ${m.name}`);
    total += Number(m.price) * it.quantity;
    lines.push({ m, q: it.quantity });
  }
  const orderNo = await nextOrderNo(client);
  const o = (await client.query(
    `INSERT INTO orders (user_id, order_no, order_type, status, total_price, customer_name, phone, delivery_address, district, pay_method, note, eta)
     VALUES ($1,$2,'cart','awaiting_review',$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [user.id, orderNo, total, customer_name.trim(), phone.trim(), address.trim(), district, pay_method, note || null, etaText(district)]
  )).rows[0];
  for (const { m, q } of lines) {
    await client.query('INSERT INTO order_items (order_id, medicine_id, quantity, price, added_by) VALUES ($1,$2,$3,$4,$5)', [o.id, m.id, q, m.price, 'customer']);
    await client.query('UPDATE medicines SET stock = stock - $1 WHERE id = $2', [q, m.id]);
  }
  await addEvent(client, o.id, 'placed', 'Order placed', pay_method === 'card' ? 'Paid by card' : 'Cash on delivery', user);
  await client.query('UPDATE users SET phone = COALESCE(phone, $2), address = COALESCE(address, $3), district = COALESCE(district, $4) WHERE id = $1', [user.id, phone.trim(), address.trim(), district]);
  return { __status: 201, message: 'Order placed', ...(await fullOrder(client, o.id, user)) };
});

// POST /api/orders/prescription  (multipart: files[], district, note, phone, address, customer_name)
exports.createPrescriptionOrder = handle(async (req, client) => {
  const user = req.user;
  const files = req.files || [];
  if (!files.length) fail(400, 'Add a photo or PDF of your prescription');
  const { district, note } = req.body;
  if (!district) fail(400, 'Please choose a delivery district');
  const u = (await client.query('SELECT * FROM users WHERE id = $1', [user.id])).rows[0];
  const orderNo = await nextOrderNo(client);
  const o = (await client.query(
    `INSERT INTO orders (user_id, order_no, order_type, status, total_price, customer_name, phone, delivery_address, district, pay_method, note, eta)
     VALUES ($1,$2,'prescription','awaiting_review',0,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [user.id, orderNo, (req.body.customer_name || u.name).trim(), req.body.phone || u.phone, req.body.address || u.address, district,
      req.body.pay_method === 'cod' ? 'cod' : 'card', note || null, etaText(district)]
  )).rows[0];
  for (const f of files) {
    await client.query('INSERT INTO prescriptions (order_id, file_name, original_name, mime_type, size_bytes) VALUES ($1,$2,$3,$4,$5)',
      [o.id, f.filename, f.originalname, f.mimetype, f.size]);
  }
  await addEvent(client, o.id, 'placed', 'Prescription uploaded', `${files.length} ${files.length > 1 ? 'pages' : 'page'} sent to the pharmacist`, user);
  return { __status: 201, message: 'Prescription sent to the pharmacist', ...(await fullOrder(client, o.id, user)) };
});

// GET /api/orders/my
exports.getMyOrders = async (req, res) => {
  try {
    const r = await pool.query(`${LIST_SQL} WHERE o.user_id = $1 ORDER BY o.created_at DESC`, [req.user.id]);
    res.json({ orders: r.rows.map(summaryRow) });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// GET /api/orders/:orderNo
exports.getOrder = handle(async (req, client) => {
  const o = await loadOrder(client, req.params.orderNo, req.user);
  return fullOrder(client, o.id, req.user);
});

// GET /api/orders/track/:orderNo — public tracking by order number (no personal details)
exports.trackPublic = handle(async (req, client) => {
  const o = await loadOrder(client, req.params.orderNo, null);
  const full = await fullOrder(client, o.id, null);
  const { order } = full;
  return {
    order: { order_no: order.order_no, tracking_no: order.tracking_no, type: order.type, status: order.status, status_label: order.status_label,
      district: order.district, eta: order.eta, delivery_days: order.delivery_days, created_at: order.created_at, item_count: full.items.reduce((a, i) => a + i.quantity, 0),
      rider: order.rider ? { name: order.rider.name.split(' ')[0], vehicle: order.rider.vehicle } : null },
    events: full.events.map(e => ({ kind: e.kind, title: e.title, note: e.note, created_at: e.created_at }))
  };
});

// POST /api/orders/:orderNo/cancel — customer while awaiting review, admin any time before delivery
exports.cancelOrder = handle(async (req, client) => {
  const o = await loadOrder(client, req.params.orderNo, req.user, { lock: true });
  if (['cancelled', 'rejected', 'delivered'].includes(o.status)) fail(400, `This order is already ${LABEL[o.status].toLowerCase()}`);
  if (req.user.role === 'customer' && o.status !== 'awaiting_review') fail(400, 'This order is already being prepared, so it can’t be cancelled. Please chat with a pharmacist.');
  if (!['customer', 'admin'].includes(req.user.role)) fail(403, 'Only the customer or an admin can cancel an order');
  await restoreStock(client, o.id);
  await client.query("UPDATE orders SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = $1", [o.id]);
  await addEvent(client, o.id, 'cancelled', 'Order cancelled', req.user.role === 'customer' ? 'Cancelled by customer' : (req.body.reason || 'Cancelled by admin'), req.user);
  return { message: 'Order cancelled', ...(await fullOrder(client, o.id, req.user)) };
});

// GET /api/orders/:orderNo/prescriptions/:id/file
exports.getPrescriptionFile = async (req, res) => {
  const client = await pool.connect();
  try {
    if (req.user.role === 'delivery') return res.status(403).json({ error: 'Delivery staff cannot view prescriptions' });
    const o = await loadOrder(client, req.params.orderNo, req.user);
    const p = (await client.query('SELECT * FROM prescriptions WHERE id = $1 AND order_id = $2', [req.params.id, o.id])).rows[0];
    if (!p) return res.status(404).json({ error: 'File not found' });
    const file = path.join(UPLOAD_ROOT, 'prescriptions', path.basename(p.file_name));
    if (!fs.existsSync(file)) return res.status(404).json({ error: 'File is missing on the server' });
    res.setHeader('Content-Type', p.mime_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${(p.original_name || p.file_name).replace(/"/g, '')}"`);
    fs.createReadStream(file).pipe(res);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  } finally { client.release(); }
};

// Chat about an order: customer <-> pharmacists/admin
exports.getMessages = handle(async (req, client) => {
  if (req.user.role === 'delivery') fail(403, 'Chat is between the customer and the pharmacy');
  const o = await loadOrder(client, req.params.orderNo, req.user);
  const r = await client.query('SELECT id, sender_role, sender_name, body, created_at FROM messages WHERE order_id = $1 ORDER BY id', [o.id]);
  return { messages: r.rows };
});
exports.postMessage = handle(async (req, client) => {
  if (req.user.role === 'delivery') fail(403, 'Chat is between the customer and the pharmacy');
  const body = String(req.body.body || '').trim();
  if (!body) fail(400, 'Type a message');
  if (body.length > 1000) fail(400, 'Message is too long');
  const o = await loadOrder(client, req.params.orderNo, req.user);
  const r = await client.query(
    'INSERT INTO messages (order_id, sender_id, sender_role, sender_name, body) VALUES ($1,$2,$3,$4,$5) RETURNING id, sender_role, sender_name, body, created_at',
    [o.id, req.user.id, req.user.role, req.user.name, body]);
  return { __status: 201, message: r.rows[0] };
});

// ===========================================================================
// Staff
// ===========================================================================

// GET /api/orders?status=a,b&type=cart|prescription&search=
exports.listOrders = async (req, res) => {
  try {
    const where = []; const params = [];
    if (req.user.role === 'delivery') where.push(`o.status IN ('packed','picked_up','out_for_delivery','delivered')`);
    if (req.query.status) { params.push(String(req.query.status).split(',')); where.push(`o.status = ANY($${params.length})`); }
    if (req.query.type === 'cart' || req.query.type === 'prescription') { params.push(req.query.type); where.push(`o.order_type = $${params.length}`); }
    if (req.query.search) { params.push(`%${req.query.search}%`); where.push(`(o.order_no ILIKE $${params.length} OR o.customer_name ILIKE $${params.length})`); }
    const r = await pool.query(`${LIST_SQL} ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY o.created_at DESC LIMIT 500`, params);
    res.json({ orders: r.rows.map(summaryRow) });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// GET /api/orders/stats?type=
exports.stats = async (req, res) => {
  try {
    const params = []; let tw = '';
    if (req.query.type === 'cart' || req.query.type === 'prescription') { params.push(req.query.type); tw = 'WHERE order_type = $1'; }
    const r = await pool.query(`SELECT status, order_type, COUNT(*)::int AS n, COALESCE(SUM(total_price),0) AS total FROM orders ${tw} GROUP BY status, order_type`, params);
    const by = {}; const byType = { cart: 0, prescription: 0 }; let sales = 0; let all = 0;
    for (const row of r.rows) {
      by[row.status] = (by[row.status] || 0) + row.n; byType[row.order_type] = (byType[row.order_type] || 0) + row.n; all += row.n;
      if (!['awaiting_review', 'rejected', 'cancelled'].includes(row.status)) sales += Number(row.total);
    }
    const waiting = (await pool.query(`SELECT COUNT(*)::int AS n FROM orders WHERE status = 'packed' AND rider_id IS NULL ${params.length ? 'AND order_type = $1' : ''}`, params)).rows[0].n;
    res.json({ byStatus: by, byType, total: all, sales, waitingForRider: waiting });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// ----- pharmacist / admin: medicines in the order -----
const editableBy = (o, user) => {
  if (!['pharmacist', 'admin'].includes(user.role)) fail(403, 'Only pharmacists can change the medicines in an order');
  if (!['awaiting_review', 'verified'].includes(o.status)) fail(400, 'Items are locked once the order is packed');
};

exports.addItem = handle(async (req, client) => {
  const o = await loadOrder(client, req.params.orderNo, req.user, { lock: true });
  editableBy(o, req.user);
  const qty = Math.max(1, parseInt(req.body.quantity || 1, 10));
  const m = (await client.query('SELECT * FROM medicines WHERE id = $1 FOR UPDATE', [req.body.medicine_id])).rows[0];
  if (!m || !m.active) fail(404, 'Medicine not found');
  if (m.stock < qty) fail(400, `Only ${m.stock} left of ${m.name}`);
  const ex = (await client.query('SELECT * FROM order_items WHERE order_id = $1 AND medicine_id = $2', [o.id, m.id])).rows[0];
  if (ex) await client.query('UPDATE order_items SET quantity = quantity + $1 WHERE id = $2', [qty, ex.id]);
  else await client.query('INSERT INTO order_items (order_id, medicine_id, quantity, price, added_by) VALUES ($1,$2,$3,$4,$5)', [o.id, m.id, qty, m.price, 'pharmacist']);
  await client.query('UPDATE medicines SET stock = stock - $1 WHERE id = $2', [qty, m.id]);
  if (!ex) await addEvent(client, o.id, 'add', 'Medicine added by pharmacist', `${m.name} × ${qty}`, req.user);
  await recalcTotal(client, o.id);
  return fullOrder(client, o.id, req.user);
});

exports.updateItem = handle(async (req, client) => {
  const o = await loadOrder(client, req.params.orderNo, req.user, { lock: true });
  editableBy(o, req.user);
  const it = (await client.query('SELECT oi.*, m.name, m.stock FROM order_items oi JOIN medicines m ON m.id = oi.medicine_id WHERE oi.id = $1 AND oi.order_id = $2', [req.params.itemId, o.id])).rows[0];
  if (!it) fail(404, 'Item not found');
  const qty = parseInt(req.body.quantity, 10);
  if (!(qty >= 0)) fail(400, 'Quantity must be 0 or more');
  const diff = qty - it.quantity;
  if (diff > 0 && it.stock < diff) fail(400, `Only ${it.stock} more left of ${it.name}`);
  await client.query('UPDATE medicines SET stock = stock - $1 WHERE id = $2', [diff, it.medicine_id]);
  if (qty === 0) {
    await client.query('DELETE FROM order_items WHERE id = $1', [it.id]);
    await addEvent(client, o.id, 'remove', 'Medicine removed by pharmacist', it.name, req.user, false);
  } else {
    await client.query('UPDATE order_items SET quantity = $1 WHERE id = $2', [qty, it.id]);
  }
  await recalcTotal(client, o.id);
  return fullOrder(client, o.id, req.user);
});

exports.removeItem = (req, res) => { req.body = { quantity: 0 }; return exports.updateItem(req, res); };

// POST /:orderNo/verify
exports.verify = handle(async (req, client) => {
  const o = await loadOrder(client, req.params.orderNo, req.user, { lock: true });
  if (o.status !== 'awaiting_review') fail(400, 'Only orders awaiting review can be verified');
  await client.query("UPDATE orders SET status = 'verified', updated_at = CURRENT_TIMESTAMP WHERE id = $1", [o.id]);
  await addEvent(client, o.id, 'verified',
    o.order_type === 'prescription' ? 'Prescription verified by pharmacist' : 'Order confirmed',
    o.order_type === 'prescription' ? 'Doctor details, date and dosage confirmed' : 'Checked by pharmacist', req.user);
  return fullOrder(client, o.id, req.user);
});

// POST /:orderNo/pack
exports.pack = handle(async (req, client) => {
  const o = await loadOrder(client, req.params.orderNo, req.user, { lock: true });
  if (o.status !== 'verified') fail(400, 'Verify the order before packing');
  const n = (await client.query('SELECT COUNT(*)::int AS n FROM order_items WHERE order_id = $1', [o.id])).rows[0].n;
  if (!n) fail(400, 'Add at least one medicine before packing');
  await client.query("UPDATE orders SET status = 'packed', updated_at = CURRENT_TIMESTAMP WHERE id = $1", [o.id]);
  await addEvent(client, o.id, 'packed', 'Packed', 'Sealed and handed to delivery', req.user);
  return fullOrder(client, o.id, req.user);
});

// POST /:orderNo/reject  { reason }
exports.reject = handle(async (req, client) => {
  const o = await loadOrder(client, req.params.orderNo, req.user, { lock: true });
  if (o.status !== 'awaiting_review') fail(400, 'Only orders awaiting review can be rejected');
  await restoreStock(client, o.id);
  await client.query("UPDATE orders SET status = 'rejected', updated_at = CURRENT_TIMESTAMP WHERE id = $1", [o.id]);
  await addEvent(client, o.id, 'rejected', o.order_type === 'prescription' ? 'Prescription not accepted' : 'Order not accepted',
    req.body.reason || 'Please upload a clearer photo or a new prescription', req.user);
  return fullOrder(client, o.id, req.user);
});

// ----- delivery master / admin -----
const deliveryOnly = (o, user) => {
  if (!['delivery', 'admin'].includes(user.role)) fail(403, 'Only the delivery team can do this');
};

// POST /:orderNo/rider { rider_id | null }
exports.assignRider = handle(async (req, client) => {
  const o = await loadOrder(client, req.params.orderNo, req.user, { lock: true });
  deliveryOnly(o, req.user);
  if (!['packed', 'picked_up'].includes(o.status)) fail(400, 'Riders can be changed only before the order is out for delivery');
  if (req.body.rider_id === null) {
    if (o.status !== 'packed') fail(400, 'The rider already has the package');
    await client.query('UPDATE orders SET rider_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1', [o.id]);
    await addEvent(client, o.id, 'assign', 'Rider unassigned', null, req.user, false);
    return fullOrder(client, o.id, req.user);
  }
  const r = (await client.query("SELECT * FROM users WHERE id = $1 AND role = 'rider' AND active = TRUE", [req.body.rider_id])).rows[0];
  if (!r) fail(404, 'Rider not found or disabled');
  await client.query('UPDATE orders SET rider_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [r.id, o.id]);
  await addEvent(client, o.id, 'assign', 'Rider assigned', `${r.name} · ${r.vehicle || 'Rider'}`, req.user);
  return fullOrder(client, o.id, req.user);
});

// POST /api/orders/auto-assign { type }
exports.autoAssign = handle(async (req, client) => {
  const params = []; let tw = '';
  if (req.body.type === 'cart' || req.body.type === 'prescription') { params.push(req.body.type); tw = 'AND order_type = $1'; }
  const targets = (await client.query(`SELECT * FROM orders WHERE status = 'packed' AND rider_id IS NULL ${tw} ORDER BY district, created_at FOR UPDATE`, params)).rows;
  const riders = (await client.query(
    `SELECT u.*, (SELECT COUNT(*)::int FROM orders WHERE rider_id = u.id AND status IN ('packed','picked_up','out_for_delivery')) AS load
     FROM users u WHERE role = 'rider' AND active = TRUE`)).rows;
  if (!riders.length) fail(400, 'No active riders. Ask the admin to add one.');
  const byDistrict = {};
  for (const o of targets) {
    const r = byDistrict[o.district] || riders.slice().sort((a, b) => a.load - b.load)[0];
    byDistrict[o.district] = r; r.load++;
    const eta = etaText(o.district);
    await client.query('UPDATE orders SET rider_id = $1, eta = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3', [r.id, eta, o.id]);
    await addEvent(client, o.id, 'assign', 'Rider assigned', `${r.name} · ${r.vehicle || 'Rider'} (auto-assigned)`, req.user);
    await addEvent(client, o.id, 'eta', 'Delivery date set', `Estimated ${eta}`, req.user);
  }
  return { assigned: targets.length, message: targets.length ? `${targets.length} order(s) assigned` : 'Every packed order already has a rider' };
});

// PATCH /:orderNo/eta { eta }
exports.setEta = handle(async (req, client) => {
  const o = await loadOrder(client, req.params.orderNo, req.user, { lock: true });
  deliveryOnly(o, req.user);
  const eta = String(req.body.eta || '').trim();
  if (eta.length < 3) fail(400, 'Enter the new delivery date');
  await client.query('UPDATE orders SET eta = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [eta, o.id]);
  await addEvent(client, o.id, 'eta', 'Delivery date updated', `New estimate: ${eta}`, req.user);
  return fullOrder(client, o.id, req.user);
});

// POST /:orderNo/advance { received_by } — ticks the next delivery step
exports.advance = handle(async (req, client) => {
  const o = await loadOrder(client, req.params.orderNo, req.user, { lock: true });
  deliveryOnly(o, req.user);
  if (o.status === 'packed') {
    if (!o.rider_id) fail(400, 'Assign a rider before confirming pickup');
    const r = (await client.query('SELECT name FROM users WHERE id = $1', [o.rider_id])).rows[0];
    await client.query("UPDATE orders SET status = 'picked_up', updated_at = CURRENT_TIMESTAMP WHERE id = $1", [o.id]);
    await addEvent(client, o.id, 'picked', 'Picked up by courier', `${r.name} collected the package`, req.user);
  } else if (o.status === 'picked_up') {
    await client.query("UPDATE orders SET status = 'out_for_delivery', updated_at = CURRENT_TIMESTAMP WHERE id = $1", [o.id]);
    await addEvent(client, o.id, 'out', 'Out for delivery', `On the way to ${o.district}`, req.user);
  } else if (o.status === 'out_for_delivery') {
    const rb = String(req.body.received_by || '').trim();
    await client.query("UPDATE orders SET status = 'delivered', received_by = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2", [rb || null, o.id]);
    await addEvent(client, o.id, 'delivered', 'Delivered', rb ? `Received by ${rb}` : 'Handed to the customer', req.user);
  } else fail(400, 'This order has no next delivery step');
  return fullOrder(client, o.id, req.user);
});

// POST /:orderNo/undo — unticks the last delivery step
exports.undo = handle(async (req, client) => {
  const o = await loadOrder(client, req.params.orderNo, req.user, { lock: true });
  deliveryOnly(o, req.user);
  const back = { picked_up: 'packed', out_for_delivery: 'picked_up', delivered: 'out_for_delivery' }[o.status];
  if (!back) fail(400, 'Nothing to undo');
  await client.query('UPDATE orders SET status = $1, received_by = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [back, o.id]);
  await addEvent(client, o.id, 'undo', `${LABEL[o.status]} unticked`, 'Step undone by the delivery team', req.user);
  return fullOrder(client, o.id, req.user);
});

// POST /:orderNo/failed { reason }
exports.failedAttempt = handle(async (req, client) => {
  const o = await loadOrder(client, req.params.orderNo, req.user, { lock: true });
  deliveryOnly(o, req.user);
  if (o.status !== 'out_for_delivery') fail(400, 'Only orders out for delivery can have a failed attempt');
  const reason = String(req.body.reason || 'Customer not reachable').trim();
  await client.query("UPDATE orders SET status = 'picked_up', updated_at = CURRENT_TIMESTAMP WHERE id = $1", [o.id]);
  await addEvent(client, o.id, 'failed', 'Delivery attempt failed', `${reason} — we will try again`, req.user);
  return fullOrder(client, o.id, req.user);
});

// POST /:orderNo/updates { title, note } — custom tracking update the customer sees
exports.postUpdate = handle(async (req, client) => {
  const o = await loadOrder(client, req.params.orderNo, req.user, { lock: true });
  deliveryOnly(o, req.user);
  const title = String(req.body.title || '').trim();
  if (!title) fail(400, 'Add a title for the update');
  await addEvent(client, o.id, 'update', title.slice(0, 200), String(req.body.note || '').trim() || 'Tracking update', req.user);
  return fullOrder(client, o.id, req.user);
});

// ----- admin -----
// PATCH /:orderNo/status { status } — correct the status of an active order
exports.setStatus = handle(async (req, client) => {
  const o = await loadOrder(client, req.params.orderNo, req.user, { lock: true });
  const s = req.body.status;
  if (!FLOW.includes(s)) fail(400, 'Choose one of: ' + FLOW.join(', '));
  if (['cancelled', 'rejected'].includes(o.status)) fail(400, 'This order is closed');
  if (['picked_up', 'out_for_delivery', 'delivered'].includes(s) && !o.rider_id) fail(400, 'Assign a rider first');
  await client.query('UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [s, o.id]);
  await addEvent(client, o.id, 'admin', 'Status changed by admin', `Set to ${LABEL[s]}`, req.user, false);
  return fullOrder(client, o.id, req.user);
});

exports.LABEL = LABEL;
