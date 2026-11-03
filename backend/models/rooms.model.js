const db = require('../config/db');

// Check room information before saving.
exports.validate = (d) => {
  const errors = [];

  if (!d.branch_id || !Number.isInteger(Number(d.branch_id))) {
    errors.push('A valid branch_id is required');
  }

  if (!d.name || !d.name.trim()) {
    errors.push('Room name is required');
  }

  const allowedTypes = ['standard', 'couple', 'vip'];

  if (!allowedTypes.includes(d.room_type || 'standard')) {
    errors.push('Room type must be standard, couple, or vip');
  }

  return errors;
};

// Get all active rooms.
exports.findAll = async () => {
  const [rows] = await db.query(
    'SELECT * FROM rooms WHERE is_active = 1 ORDER BY name'
  );
  return rows;
};

// Find one room.
exports.findById = async (id) => {
  const [rows] = await db.query(
    'SELECT * FROM rooms WHERE id = ?',
    [id]
  );
  return rows[0];
};

// Add a room.
exports.create = async (d) => {
  const [result] = await db.query(
    `INSERT INTO rooms (branch_id, name, room_type)
     VALUES (?, ?, ?)`,
    [d.branch_id, d.name, d.room_type || 'standard']
  );

  return exports.findById(result.insertId);
};