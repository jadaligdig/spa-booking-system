const db = require('../config/db');

// Check therapist information before saving.
exports.validate = (d) => {
  const errors = [];

  if (!d.branch_id || !Number.isInteger(Number(d.branch_id))) {
    errors.push('A valid branch_id is required');
  }

  if (!d.full_name || !d.full_name.trim()) {
    errors.push('Therapist full_name is required');
  }

  return errors;
};

// Get all active therapists.
exports.findAll = async () => {
  const [rows] = await db.query(
    'SELECT * FROM therapists WHERE is_active = 1 ORDER BY full_name'
  );
  return rows;
};

// Find one therapist.
exports.findById = async (id) => {
  const [rows] = await db.query(
    'SELECT * FROM therapists WHERE id = ?',
    [id]
  );
  return rows[0];
};

// Add a therapist.
exports.create = async (d) => {
  const [result] = await db.query(
    `INSERT INTO therapists
      (user_id, branch_id, full_name, specialty)
     VALUES (?, ?, ?, ?)`,
    [d.user_id || null, d.branch_id, d.full_name, d.specialty || null]
  );

  return exports.findById(result.insertId);
};

// Update a therapist.
exports.update = async (id, d) => {
  await db.query(
    `UPDATE therapists
     SET user_id = ?, branch_id = ?, full_name = ?, specialty = ?
     WHERE id = ?`,
    [d.user_id || null, d.branch_id, d.full_name, d.specialty || null, id]
  );

  return exports.findById(id);
};

// Soft-delete a therapist.
exports.remove = async (id) => {
  const [result] = await db.query(
    'UPDATE therapists SET is_active = 0 WHERE id = ?',
    [id]
  );

  return result.affectedRows;
};