const db = require('../config/db');

exports.createPayment = async (payment) => {
    const [result] = await db.query(
        `INSERT INTO payments (booking_id, amount, method, kind)
         VALUES (?, ?, ?, ?)`,
        [
            payment.booking_id,
            payment.amount,
            payment.method,
            payment.kind
        ]
    );

    const [rows] = await db.query(
        'SELECT * FROM payments WHERE id = ?',
        [result.insertId]
    );

    return rows[0];
};

exports.findPaymentsByBookingId = async (bookingId) => {
    const [rows] = await db.query(
        `SELECT *
         FROM payments
         WHERE booking_id = ?
         ORDER BY paid_at DESC`,
        [bookingId]
    );

    return rows;
};