const db = require('../config/db');

// Never return password_hash to the browser (except in findByEmail, which login needs)
const COLS = 'u.id, u.email, u.full_name, u.is_active, u.role_id, r.name AS role';

exports.findByEmail = async (email) => {
  const [rows] = await db.query(
    `SELECT u.id, u.email, u.password_hash, u.full_name, u.is_active, r.name AS role
     FROM users u INNER JOIN roles r ON r.id = u.role_id
     WHERE u.email = ?`,
    [email]
  );
  return rows[0];
};

// INNER JOIN report: users with their role
exports.findAll = async () => {
  const [rows] = await db.query(
    `SELECT ${COLS} FROM users u INNER JOIN roles r ON r.id = u.role_id ORDER BY u.id`
  );
  return rows;
};

exports.findById = async (id) => {
  const [rows] = await db.query(
    `SELECT ${COLS} FROM users u INNER JOIN roles r ON r.id = u.role_id WHERE u.id = ?`,
    [id]
  );
  return rows[0];
};

// d.password_hash must already be hashed in the controller: bcrypt.hashSync(password, 10)
exports.create = async (d) => {
  const [result] = await db.query(
    'INSERT INTO users (role_id, email, password_hash, full_name) VALUES (?, ?, ?, ?)',
    [d.role_id, d.email, d.password_hash, d.full_name]
  );
  return exports.findById(result.insertId);
};

exports.update = async (id, d) => {
  await db.query(
    'UPDATE users SET role_id = ?, email = ?, full_name = ? WHERE id = ?',
    [d.role_id, d.email, d.full_name, id]
  );
  return exports.findById(id);
};

// Soft delete: audit_logs and bookings still point to this user
exports.deactivate = async (id) => {
  const [result] = await db.query('UPDATE users SET is_active = 0 WHERE id = ?', [id]);
  return result.affectedRows;
};