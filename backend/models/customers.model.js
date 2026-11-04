const db = require('../config/db');

exports.validate = (d) => {
  const errors = [];

  if (!d.full_name || d.full_name.length < 2) {
    errors.push('full_name must be at least 2 characters');
  }

  if (!d.phone || !/^[0-9+\-\s]{7,20}$/.test(d.phone)) {
    errors.push('phone must be 7 to 20 digits');
  }

  if (d.email && !/^\S+@\S+\.\S+$/.test(d.email)) {
    errors.push('email is not valid');
  }

  return errors;
};

exports.findAll = async () => {
  const [rows] = await db.query(
    'SELECT * FROM customers ORDER BY full_name'
  );
  return rows;
};

exports.findById = async (id) => {
  const [rows] = await db.query(
    'SELECT * FROM customers WHERE id = ?',
    [id]
  );
  return rows[0];
};

exports.create = async (d) => {
  const [result] = await db.query(
    'INSERT INTO customers (full_name, phone, email) VALUES (?, ?, ?)',
    [d.full_name, d.phone, d.email || null]
  );

  return exports.findById(result.insertId);
};

exports.update = async (id, d) => {
  await db.query(
    'UPDATE customers SET full_name = ?, phone = ?, email = ? WHERE id = ?',
    [d.full_name, d.phone, d.email || null, id]
  );

  return exports.findById(id);
};

exports.remove = async (id) => {
  const [result] = await db.query(
    'DELETE FROM customers WHERE id = ?',
    [id]
  );

  return result.affectedRows;
};