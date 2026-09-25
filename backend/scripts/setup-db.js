// Creates/updates the PharmaGo tables and adds demo accounts + products.
// Safe to run again: it never deletes data and skips anything that already exists.
//   npm run db:setup
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const pool = require('../config/database');

const STAFF = [
  { name: 'Iman Sharinda', email: 'imansharinda@gmail.com', password: 'customer123', role: 'customer', phone: '077 123 4567', address: '[Street address]', district: 'Kandy' },
  { name: 'Dilani Jayasinghe', email: 'pharmacist@pharmago.lk', password: 'pharm123', role: 'pharmacist' },
  { name: 'Saman Kumara', email: 'delivery@pharmago.lk', password: 'deliver123', role: 'delivery' },
  { name: 'PharmaGo Admin', email: 'admin@pharmago.lk', password: 'admin123', role: 'admin' },
  { name: 'Nuwan Perera', email: 'nuwan@pharmago.lk', password: 'rider123', role: 'rider', phone: '077 000 0001', vehicle: 'Motorbike' },
  { name: 'Chaminda Silva', email: 'chaminda@pharmago.lk', password: 'rider123', role: 'rider', phone: '077 000 0002', vehicle: 'Van' }
];

async function run() {
  const sql = fs.readFileSync(path.join(__dirname, '..', 'config', 'scheme.sql'), 'utf8');
  await pool.query(sql);
  console.log('✅ Tables are up to date');

  let added = 0;
  for (const u of STAFF) {
    const exists = await pool.query('SELECT id FROM users WHERE email = $1', [u.email]);
    if (exists.rows.length) continue;
    const hash = await bcrypt.hash(u.password, 10);
    await pool.query(
      'INSERT INTO users (name, email, password, role, phone, address, district, vehicle) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
      [u.name, u.email, hash, u.role, u.phone || null, u.address || null, u.district || null, u.vehicle || null]
    );
    added++;
  }
  console.log(`✅ Accounts ready (${added} added)`);

  const products = JSON.parse(fs.readFileSync(path.join(__dirname, 'products.json'), 'utf8'));
  let pAdded = 0;
  for (const p of products) {
    const exists = await pool.query('SELECT id FROM medicines WHERE LOWER(name) = LOWER($1)', [p.name]);
    if (exists.rows.length) {
      // fill in the new columns for products that were created before this update
      await pool.query(
        'UPDATE medicines SET rx_required = $2, pack_size = COALESCE(pack_size, $3), label = COALESCE(label, $4), image_url = COALESCE(image_url, $5), category = COALESCE(category, $6) WHERE id = $1',
        [exists.rows[0].id, p.rx_required, p.pack_size, p.label, p.image_url, p.category]
      );
      continue;
    }
    await pool.query(
      'INSERT INTO medicines (name, description, price, stock, category, rx_required, pack_size, label, image_url) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
      [p.name, null, p.price, 100, p.category, p.rx_required, p.pack_size, p.label, p.image_url]
    );
    pAdded++;
  }
  console.log(`✅ Products ready (${pAdded} added)`);
  console.log('\nDemo logins:');
  STAFF.filter(u => u.role !== 'rider').forEach(u => console.log(`  ${u.role.padEnd(11)} ${u.email}  /  ${u.password}`));
}

run()
  .then(() => pool.end())
  .catch(err => { console.error('❌ Setup failed:', err.message); pool.end(); process.exit(1); });
