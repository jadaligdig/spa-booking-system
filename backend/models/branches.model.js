// REFERENCE EXAMPLE (Member B owns it). Read this file top to bottom, then build services the same way.
const db = require('../config/db');

// Validation lives in the model: returns a list of problems (empty list = valid)
exports.validate = (d) => {
  const errors = [];
  if (!d.name || d.name.length < 2) errors.push('name must be at least 2 characters');
  if (!d.address) errors.push('address is required');
  const time = /^([01]\d|2[0-3]):[0-5]\d$/;
  if (!time.test(d.open_time)) errors.push('open_time must look like HH:MM');
  if (!time.test(d.close_time)) errors.push('close_time must look like HH:MM');
  if (time.test(d.open_time) && time.test(d.close_time) && d.open_time >= d.close_time)
    errors.push('open_time must be earlier than close_time');
  return errors;
};

exports.findAll = async () => {
  const [rows] = await db.query('SELECT * FROM branches WHERE is_active = 1 ORDER BY name');
  return rows;
};

exports.findById = async (id) => {
  const [rows] = await db.query('SELECT * FROM branches WHERE id = ?', [id]);
  return rows[0];
};

exports.create = async (d) => {
  const [result] = await db.query(
    'INSERT INTO branches (name, address, open_time, close_time) VALUES (?, ?, ?, ?)',
    [d.name, d.address, d.open_time, d.close_time]
  );
  return exports.findById(result.insertId);
};

exports.update = async (id, d) => {
  await db.query(
    'UPDATE branches SET name = ?, address = ?, open_time = ?, close_time = ? WHERE id = ?',
    [d.name, d.address, d.open_time, d.close_time, id]
  );
  return exports.findById(id);
};

// Soft delete: we never erase the row, we just hide it (bookings may still point to it)
exports.remove = async (id) => {
  const [result] = await db.query('UPDATE branches SET is_active = 0 WHERE id = ?', [id]);
  return result.affectedRows;
};