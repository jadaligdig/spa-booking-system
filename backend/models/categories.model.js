const db = require('../config/db');

exports.validate = (d) => {
  const errors = [];
  if (!d.name || d.name.length < 2) errors.push('name must be at least 2 characters');
  return errors;
};

// LEFT JOIN: categories with no services still appear (service_count = 0)
exports.findAll = async () => {
  const [rows] = await db.query(
    `SELECT c.*, COUNT(s.id) AS service_count
     FROM service_categories c
     LEFT JOIN services s ON s.category_id = c.id
     GROUP BY c.id
     ORDER BY c.name`
  );
  return rows;
};

exports.findById = async (id) => {
  const [rows] = await db.query('SELECT * FROM service_categories WHERE id = ?', [id]);
  return rows[0];
};

exports.create = async (d) => {
  const [result] = await db.query(
    'INSERT INTO service_categories (name, description) VALUES (?, ?)',
    [d.name, d.description]
  );
  return exports.findById(result.insertId);
};

exports.update = async (id, d) => {
  await db.query('UPDATE service_categories SET name = ?, description = ? WHERE id = ?', [d.name, d.description, id]);
  return exports.findById(id);
};

exports.remove = async (id) => {
  const [result] = await db.query('DELETE FROM service_categories WHERE id = ?', [id]);
  return result.affectedRows;
};