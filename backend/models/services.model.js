const db = require('../config/db');

exports.validate = (d) => {
  const errors = [];
  if (!d.name || d.name.length < 2) errors.push('name must be at least 2 characters');
  if (!Number.isInteger(d.category_id) || d.category_id < 1) errors.push('category_id is required');
  if (!Number.isInteger(d.duration_min) || d.duration_min <= 0) errors.push('duration_min must be a whole number above 0');
  if (!Number.isInteger(d.cleanup_min) || d.cleanup_min < 0) errors.push('cleanup_min must be 0 or more');
  if (!(d.price >= 0)) errors.push('price must be 0 or more');
  return errors;
};

exports.findAll = async () => {
  const [rows] = await db.query(
    `SELECT s.*, c.name AS category_name
     FROM services s
     LEFT JOIN service_categories c ON c.id = s.category_id
     WHERE s.is_active = 1
     ORDER BY s.name`
  );
  return rows;
};

exports.findById = async (id) => {
  const [rows] = await db.query(
    `SELECT s.*, c.name AS category_name
     FROM services s
     LEFT JOIN service_categories c ON c.id = s.category_id
     WHERE s.id = ?`,
    [id]
  );
  return rows[0];
};

exports.create = async (d) => {
  const [result] = await db.query(
    'INSERT INTO services (category_id, name, duration_min, price, cleanup_min) VALUES (?, ?, ?, ?, ?)',
    [d.category_id, d.name, d.duration_min, d.price, d.cleanup_min]
  );
  return exports.findById(result.insertId);
};

exports.update = async (id, d) => {
  await db.query(
    'UPDATE services SET category_id = ?, name = ?, duration_min = ?, price = ?, cleanup_min = ? WHERE id = ?',
    [d.category_id, d.name, d.duration_min, d.price, d.cleanup_min, id]
  );
  return exports.findById(id);
};

// Soft delete: bookings still point to this service, so we hide it instead of erasing it
exports.remove = async (id) => {
  const [result] = await db.query('UPDATE services SET is_active = 0 WHERE id = ?', [id]);
  return result.affectedRows;
};

/// LEFT JOIN report: every category, even ones with no services (count = 0)
exports.reportByCategory = async () => {
  const [rows] = await db.query(
    `SELECT c.id, c.name AS category, c.description, COUNT(s.id) AS service_count
     FROM service_categories c
     LEFT JOIN services s ON s.category_id = c.id AND s.is_active = 1
     GROUP BY c.id, c.name, c.description
     ORDER BY c.name`
  );
  return rows;
};