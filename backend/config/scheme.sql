-- PharmaGo database schema
-- Safe to run many times: it creates missing tables/columns and never drops data.
-- Run it with:  npm run db:setup

-- ---------- users (customers + staff) ----------
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  role VARCHAR(50) DEFAULT 'customer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE users ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS vehicle VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS district VARCHAR(50);
-- roles: customer | pharmacist | delivery | admin | rider

-- ---------- medicines / products ----------
CREATE TABLE IF NOT EXISTS medicines (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  category VARCHAR(100),
  manufacturer VARCHAR(255),
  expiry_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE medicines ADD COLUMN IF NOT EXISTS rx_required BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE medicines ADD COLUMN IF NOT EXISTS pack_size VARCHAR(255);
ALTER TABLE medicines ADD COLUMN IF NOT EXISTS label VARCHAR(100);
ALTER TABLE medicines ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE medicines ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE;
-- category: rx | otc | vit | beauty | support | personal | baby | device

-- ---------- orders ----------
CREATE SEQUENCE IF NOT EXISTS order_no_seq START WITH 10001;

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  total_price DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  delivery_address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_no VARCHAR(20);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_type VARCHAR(20) NOT NULL DEFAULT 'cart';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS phone VARCHAR(30);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS district VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pay_method VARCHAR(30) NOT NULL DEFAULT 'card';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS note TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS rider_id INT REFERENCES users(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS eta VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS received_by VARCHAR(255);
ALTER TABLE orders ALTER COLUMN total_price SET DEFAULT 0;

-- older rows: give them an order number and the new status names
UPDATE orders SET order_no = 'PG-' || nextval('order_no_seq') WHERE order_no IS NULL;
UPDATE orders SET status = 'awaiting_review' WHERE status = 'pending';
UPDATE orders SET status = 'verified' WHERE status = 'confirmed';
ALTER TABLE orders ALTER COLUMN status SET DEFAULT 'awaiting_review';
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_order_no ON orders(order_no);
-- statuses: awaiting_review | verified | packed | picked_up | out_for_delivery | delivered | rejected | cancelled

CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INT NOT NULL,
  medicine_id INT NOT NULL,
  quantity INT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (medicine_id) REFERENCES medicines(id)
);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS added_by VARCHAR(20) NOT NULL DEFAULT 'customer';

-- every step of an order (this is what builds the tracking page)
CREATE TABLE IF NOT EXISTS order_events (
  id SERIAL PRIMARY KEY,
  order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  kind VARCHAR(30) NOT NULL,
  title VARCHAR(255) NOT NULL,
  note TEXT,
  actor_id INT REFERENCES users(id),
  actor_name VARCHAR(255),
  customer_visible BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- uploaded prescription files
CREATE TABLE IF NOT EXISTS prescriptions (
  id SERIAL PRIMARY KEY,
  order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  original_name VARCHAR(255),
  mime_type VARCHAR(100),
  size_bytes INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- chat between a customer and the pharmacists about one order
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  sender_id INT REFERENCES users(id),
  sender_role VARCHAR(20) NOT NULL,
  sender_name VARCHAR(255),
  body TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pharmacists (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  license_number VARCHAR(255) UNIQUE,
  specialization VARCHAR(255),
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_events_order_id ON order_events(order_id);
CREATE INDEX IF NOT EXISTS idx_medicines_category ON medicines(category);
