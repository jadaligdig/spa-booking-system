// Run with:  npm run setup
// WARNING: drops the old database and rebuilds it from schema.sql + seed.sql.
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const fs = require('fs');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function main() {
  const dbName = process.env.DB_NAME || 'spa_booking';

  // Separate connection (not the app's pool) because it must run many statements per file
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });

  await conn.query(`DROP DATABASE IF EXISTS \`${dbName}\``);
  await conn.query(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8')); // creates + selects the database
  await conn.query(fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8'));

  // Demo accounts (password is hashed - we never store plain passwords)
  const insertUser =
    'INSERT INTO users (role_id, email, password_hash, full_name) VALUES ((SELECT id FROM roles WHERE name = ?), ?, ?, ?)';
  await conn.query(insertUser, ['admin', 'admin@spa.test', bcrypt.hashSync('admin123', 10), 'Admin User']);
  await conn.query(insertUser, ['receptionist', 'reception@spa.test', bcrypt.hashSync('reception123', 10), 'Front Desk']);
  await conn.query(insertUser, ['customer', 'customer@spa.test', bcrypt.hashSync('customer123', 10), 'Maria Santos']);

  await conn.end();
  console.log('Database ready:', dbName);
  console.log('Login with admin@spa.test / admin123');
}

main().catch((err) => {
  console.error('Setup failed:', err.message);
  process.exit(1);
});