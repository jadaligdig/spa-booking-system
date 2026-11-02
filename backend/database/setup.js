// Run with:  npm run setup
// WARNING: deletes the old database file and rebuilds it from schema.sql + seed.sql.
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const file = path.join(__dirname, process.env.DB_FILE || 'spa.db');
fs.rmSync(file, { force: true });

const db = require('../config/db'); // opens a fresh empty database file
db.exec(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));
db.exec(fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8'));

// Demo accounts (password is hashed - we never store plain passwords)
const insertUser = db.prepare(
  'INSERT INTO users (role_id, email, password_hash, full_name) VALUES ((SELECT id FROM roles WHERE name = ?), ?, ?, ?)'
);
insertUser.run('admin', 'admin@spa.test', bcrypt.hashSync('admin123', 10), 'Admin User');
insertUser.run('receptionist', 'reception@spa.test', bcrypt.hashSync('reception123', 10), 'Front Desk');
insertUser.run('customer', 'customer@spa.test', bcrypt.hashSync('customer123', 10), 'Maria Santos');

console.log('Database ready:', file);
console.log('Login with admin@spa.test / admin123');
