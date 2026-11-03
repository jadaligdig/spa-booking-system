const db = require('../config/db');

exports.validate = (d) => {
  const errors = [];
  if (!Number.isInteger(d.booking_id) || d.booking_id < 1) errors.push('booking_id must be a valid booking id');
  if (!Number.isInteger(d.rating) || d.rating < 1 || d.rating > 5) errors.push('rating must be a whole number from 1 to 5');
  if (d.comment && d.comment.length > 255) errors.push('comment must be 255 characters or fewer');
  return errors;
};

exports.findAll = async () => {
  const [rows] = await db.query('SELECT * FROM reviews ORDER BY created_at DESC');
  return rows;
};

exports.findById = async (id) => {
  const [rows] = await db.query('SELECT * FROM reviews WHERE id = ?', [id]);
  return rows[0];
};

// Used by the controller to check the booking exists and is completed
exports.findBooking = async (bookingId) => {
  const [rows] = await db.query('SELECT id, status FROM bookings WHERE id = ?', [bookingId]);
  return rows[0];
};

exports.create = async (d) => {
  const [result] = await db.query(
    'INSERT INTO reviews (booking_id, rating, comment) VALUES (?, ?, ?)',
    [d.booking_id, d.rating, d.comment || null]);
  return exports.findById(result.insertId);
};

exports.update = async (id, d) => {
  const [result] = await db.query(
    'UPDATE reviews SET rating = ?, comment = ? WHERE id = ?',
    [d.rating, d.comment || null, id]);
  return result.affectedRows;
};

exports.remove = async (id) => {
  const [result] = await db.query('DELETE FROM reviews WHERE id = ?', [id]);
  return result.affectedRows;
};