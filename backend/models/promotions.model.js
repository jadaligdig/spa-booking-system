const db = require('../config/db');

exports.validate = (d) => {
  const errors = [];
  if (!d.code || String(d.code).trim().length < 2) errors.push('code must be at least 2 characters');
  const pct = Number(d.discount_percent);
  if (!Number.isInteger(pct) || pct < 1 || pct > 100) errors.push('discount_percent must be a whole number from 1 to 100');
  if (!d.valid_from) errors.push('valid_from is required');
  if (!d.valid_until) errors.push('valid_until is required');
  if (d.valid_from && d.valid_until && d.valid_until < d.valid_from) errors.push('valid_until must not be before valid_from');
  return errors;
};

exports.findAll = async () => {
  const [rows] = await db.query('SELECT * FROM promotions ORDER BY valid_from DESC');
  return rows;
};

exports.findById = async (id) => {
  const [rows] = await db.query('SELECT * FROM promotions WHERE id = ?', [id]);
  return rows[0];
};

exports.create = async (d) => {
  const [result] = await db.query(
    `INSERT INTO promotions (code, discount_percent, valid_from, valid_until, is_active)
     VALUES (?, ?, ?, ?, ?)`,
    [d.code, d.discount_percent, d.valid_from, d.valid_until, d.is_active ?? 1]);
  return exports.findById(result.insertId);
};

exports.update = async (id, d) => {
  const [result] = await db.query(
    `UPDATE promotions SET code=?, discount_percent=?, valid_from=?, valid_until=?, is_active=?
     WHERE id=?`,
    [d.code, d.discount_percent, d.valid_from, d.valid_until, d.is_active ?? 1, id]);
  return result.affectedRows;
};

exports.remove = async (id) => {
  const [result] = await db.query('DELETE FROM promotions WHERE id = ?', [id]);
  return result.affectedRows;
};