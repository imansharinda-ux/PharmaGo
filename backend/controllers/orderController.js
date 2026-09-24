const pool = require('../config/database');

exports.createOrder = async (req, res) => {
  const client = await pool.connect();
  try {
    const { user_id, delivery_address, items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Order must have at least one item' });
    }

    await client.query('BEGIN');

    let total_price = 0;
    for (const item of items) {
      const medicineResult = await client.query('SELECT price, stock FROM medicines WHERE id = $1', [item.medicine_id]);
      if (medicineResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: `Medicine with id ${item.medicine_id} not found` });
      }
      const medicine = medicineResult.rows[0];
      if (medicine.stock < item.quantity) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `Insufficient stock for medicine id ${item.medicine_id}` });
      }
      total_price += medicine.price * item.quantity;
    }

    const orderResult = await client.query(
      'INSERT INTO orders (user_id, total_price, delivery_address) VALUES ($1, $2, $3) RETURNING *',
      [user_id, total_price, delivery_address]
    );
    const order = orderResult.rows[0];

    for (const item of items) {
      const medicineResult = await client.query('SELECT price FROM medicines WHERE id = $1', [item.medicine_id]);
      const price = medicineResult.rows[0].price;

      await client.query(
        'INSERT INTO order_items (order_id, medicine_id, quantity, price) VALUES ($1, $2, $3, $4)',
        [order.id, item.medicine_id, item.quantity, price]
      );

      await client.query(
        'UPDATE medicines SET stock = stock - $1 WHERE id = $2',
        [item.quantity, item.medicine_id]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Order created successfully',
      order
    });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
    res.json({
      message: 'Orders retrieved successfully',
      count: result.rows.length,
      orders: result.rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const orderResult = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const itemsResult = await pool.query(
      `SELECT order_items.*, medicines.name AS medicine_name
       FROM order_items
       JOIN medicines ON order_items.medicine_id = medicines.id
       WHERE order_items.order_id = $1`,
      [id]
    );

    res.json({
      message: 'Order retrieved successfully',
      order: orderResult.rows[0],
      items: itemsResult.rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const result = await pool.query(
      'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({
      message: 'Order status updated successfully',
      order: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUserOrders = async (req, res) => {
  try {
    const { user_id } = req.params;
    const result = await pool.query('SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC', [user_id]);

    res.json({
      message: 'User orders retrieved successfully',
      count: result.rows.length,
      orders: result.rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.cancelOrder = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    await client.query('BEGIN');

    const orderResult = await client.query('SELECT * FROM orders WHERE id = $1', [id]);
    if (orderResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderResult.rows[0];
    if (order.status === 'cancelled') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Order already cancelled' });
    }
    if (order.status === 'delivered') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Cannot cancel a delivered order' });
    }

    const itemsResult = await client.query('SELECT * FROM order_items WHERE order_id = $1', [id]);
    for (const item of itemsResult.rows) {
      await client.query('UPDATE medicines SET stock = stock + $1 WHERE id = $2', [item.quantity, item.medicine_id]);
    }

    const updatedOrder = await client.query(
      "UPDATE orders SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *",
      [id]
    );

    await client.query('COMMIT');

    res.json({
      message: 'Order cancelled successfully',
      order: updatedOrder.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};