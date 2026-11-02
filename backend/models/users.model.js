// MODEL = talks to the database. No req/res here.
// Member A: add findAll, findById, create, update, deactivate (and the INNER JOIN report) in this file.
const db = require('../config/db');

exports.findByEmail = async (email) => {
  const [rows] = await db.query(
    `SELECT u.id, u.email, u.password_hash, u.full_name, u.is_active, r.name AS role
     FROM users u INNER JOIN roles r ON r.id = u.role_id
     WHERE u.email = ?`,
    [email]
  );
  return rows[0];
};