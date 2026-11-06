const db = require('../config/db');

exports.findAllBookings = async () => {
    const [rows] = await db.query(`
        SELECT
            b.*,
            c.full_name AS customer_name,
            s.name AS service_name,
            s.duration_min,
            s.cleanup_min,
            t.full_name AS therapist_name,
            r.name AS room_name
        FROM bookings b
        INNER JOIN customers c ON b.customer_id = c.id
        INNER JOIN services s ON b.service_id = s.id
        INNER JOIN therapists t ON b.therapist_id = t.id
        INNER JOIN rooms r ON b.room_id = r.id
        ORDER BY b.start_at DESC
    `);

    return rows;
};

exports.findBookingById = async (id) => {
    const [rows] = await db.query(
        `SELECT
            b.*,
            s.duration_min,
            s.cleanup_min
        FROM bookings b
        INNER JOIN services s ON b.service_id = s.id
        WHERE b.id = ?`,
        [id]
    );

    return rows[0];
};

exports.findServiceDetails = async (serviceId) => {
    const [rows] = await db.query(
        `SELECT duration_min, price, cleanup_min
        FROM services
        WHERE id = ? AND is_active = 1`,
        [serviceId]
    );

    return rows[0];
};

exports.createBooking = async (d) => {
    const [result] = await db.query(
        `INSERT INTO bookings
            (customer_id, service_id, therapist_id, room_id,
             start_at, end_at, blocked_until, status, total_price, notes, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            d.customer_id,
            d.service_id,
            d.therapist_id,
            d.room_id,
            d.start_at,
            d.end_at,
            d.blocked_until,
            d.status || 'pending',
            d.total_price,
            d.notes || null,
            d.created_by || null
        ]
    );

    return exports.findBookingById(result.insertId);
};

exports.updateBookingTime = async (id, d) => {
    await db.query(
        `UPDATE bookings
        SET start_at = ?, end_at = ?, blocked_until = ?
        WHERE id = ?`,
        [d.start_at, d.end_at, d.blocked_until, id]
    );

    return exports.findBookingById(id);
};

exports.cancelBooking = async (id) => {
    await db.query(
        "UPDATE bookings SET status = 'cancelled' WHERE id = ?",
        [id]
    );

    return exports.findBookingById(id);
};

exports.createPayment = async (d) => {
    const [result] = await db.query(
        `INSERT INTO payments (booking_id, amount, method, kind)
        VALUES (?, ?, ?, ?)`,
        [d.booking_id, d.amount, d.method, d.kind || 'payment']
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

exports.findBookingDetails = async (id) => {
    let sql = `
        SELECT
            b.id AS booking_id,
            b.start_at,
            b.end_at,
            b.blocked_until,
            b.status,
            b.total_price,
            c.full_name AS customer_name,
            s.name AS service_name,
            t.full_name AS therapist_name,
            r.name AS room_name
        FROM bookings b
        INNER JOIN customers c ON b.customer_id = c.id
        INNER JOIN services s ON b.service_id = s.id
        INNER JOIN therapists t ON b.therapist_id = t.id
        INNER JOIN rooms r ON b.room_id = r.id
    `;

    const params = [];

    if (id !== undefined) {
        sql += ' WHERE b.id = ?';
        params.push(id);
    }

    sql += ' ORDER BY b.start_at DESC';

    const [rows] = await db.query(sql, params);

    return id === undefined ? rows : rows[0];
};

exports.updateBookingStatus = async (bookingId, status) => {
    await db.query(
        'UPDATE bookings SET status = ? WHERE id = ?',
        [status, bookingId]
    );

    return exports.findBookingById(bookingId);
};