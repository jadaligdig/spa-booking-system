const db = require('../config/db');

exports.findAll = async () => {
    const [rows] = await db.query(
        `SELECT a.*, b.status AS booking_status
     FROM alerts a
     LEFT JOIN bookings b ON a.booking_id = b.id
     ORDER BY a.created_at DESC`
    );
    return rows;
};

exports.create = async (bookingId, type, message) => {
    const [result] = await db.query(
        `INSERT INTO alerts (booking_id, type, message)
     VALUES (?, ?, ?)`,
        [bookingId ?? null, type, message]
    );
    return result.insertId;
};

exports.resolve = async (id) => {
    const [result] = await db.query(
        'UPDATE alerts SET is_resolved = 1 WHERE id = ?',
        [id]
    );
    return result.affectedRows;
};

exports.remove = async (id) => {
    const [result] = await db.query(
        'DELETE FROM alerts WHERE id = ?',
        [id]
    );
    return result.affectedRows;
};

// Report: all alerts and their related bookings
exports.bookingAlertsReport = async () => {
    const [rows] = await db.query(
        `SELECT
       b.id AS booking_id,
       b.status AS booking_status,
       a.id AS alert_id,
       a.type AS alert_type,
       a.message AS alert_message,
       a.is_resolved,
       a.created_at AS alert_created_at
     FROM bookings b
     LEFT JOIN alerts a ON a.booking_id = b.id

     UNION ALL

     SELECT
       b.id AS booking_id,
       b.status AS booking_status,
       a.id AS alert_id,
       a.type AS alert_type,
       a.message AS alert_message,
       a.is_resolved,
       a.created_at AS alert_created_at
     FROM alerts a
     LEFT JOIN bookings b ON b.id = a.booking_id
     WHERE b.id IS NULL`
    );

    return rows;
};