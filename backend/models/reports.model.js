const db = require('../config/db');

// RIGHT JOIN: every service is listed, even a service with 0 bookings
exports.servicePopularity = async () => {
  const [rows] = await db.query(
    `SELECT s.id, s.name, COUNT(b.id) AS total_bookings
     FROM bookings b
     RIGHT JOIN services s ON s.id = b.service_id
     GROUP BY s.id, s.name
     ORDER BY total_bookings DESC, s.name ASC`);
  return rows;
};

exports.dashboard = async () => {
  const [byStatus] = await db.query(
    'SELECT status, COUNT(*) AS total FROM bookings GROUP BY status');
  const [[revenue]] = await db.query(
    'SELECT COALESCE(SUM(amount), 0) AS total FROM payments');
  const [[rating]] = await db.query(
    'SELECT ROUND(AVG(rating), 2) AS avg_rating FROM reviews');
  return {
    bookingsByStatus: byStatus,
    totalRevenue: Number(revenue.total),
    averageRating: rating.avg_rating === null ? null : Number(rating.avg_rating),
  };
};