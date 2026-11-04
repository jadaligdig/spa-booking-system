const db = require('../config/db');

// Get all bookings
exports.findAllBookings = async () => {
    const [rows] = await db.query(`
        SELECT
          b.*,
          c.full_name AS customer_name,
          s.name AS service_name,
          t.full_name AS therapist_name,
          r.name AS room_name
        FROM bookings b
        LEFT JOIN customers c ON c.id = b.customer_id
        LEFT JOIN services s ON s.id = b.service_id
        LEFT JOIN therapists t ON t.id = b.therapist_id
        LEFT JOIN rooms r ON r.id = b.room_id
        ORDER BY b.start_at DESC
    `);

    return rows;
};

// Get one booking
exports.findBookingById = async (id) => {
    const [rows] = await db.query(
        `
        SELECT
          b.*,
          s.duration_min,
          s.cleanup_min
        FROM bookings b
        LEFT JOIN services s ON s.id = b.service_id
        WHERE b.id = ?
        `,
        [id]
    );

    return rows[0];
};

// Get service details
exports.findServiceDetails = async (serviceId) => {
    const [rows] = await db.query(
        `
        SELECT duration_min, price, cleanup_min
        FROM services
        WHERE id = ? AND is_active = 1
        `,
        [serviceId]
    );

    return rows[0];
};

// Create a booking
exports.createBooking = async (data) => {
    const [result] = await db.query(
        `
        INSERT INTO bookings
          (customer_id, service_id, therapist_id, room_id,
           start_at, end_at, blocked_until, status,
           total_price, notes, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
            data.customer_id,
            data.service_id,
            data.therapist_id,
            data.room_id,
            data.start_datetime,
            data.end_datetime,
            data.blocked_until,
            data.status,
            data.total_price,
            data.notes,
            data.created_by
        ]
    );

    return exports.findBookingById(result.insertId);
};

// Update booking date and time
exports.updateBookingTime = async (id, data) => {
    await db.query(
        `
        UPDATE bookings
        SET start_at = ?,
            end_at = ?,
            blocked_until = ?
        WHERE id = ?
        `,
        [
            data.start_datetime,
            data.end_datetime,
            data.blocked_until,
            id
        ]
    );

    return exports.findBookingById(id);
};

// Cancel a booking
exports.cancelBooking = async (id) => {
    await db.query(
        `UPDATE bookings SET status = 'cancelled' WHERE id = ?`,
        [id]
    );

    return exports.findBookingById(id);
};

// Get booking details for a report or one booking
exports.findBookingDetails = async (id) => {
    let sql = `
        SELECT
          b.*,
          c.full_name AS customer_name,
          s.name AS service_name,
          t.full_name AS therapist_name,
          r.name AS room_name
        FROM bookings b
        LEFT JOIN customers c ON c.id = b.customer_id
        LEFT JOIN services s ON s.id = b.service_id
        LEFT JOIN therapists t ON t.id = b.therapist_id
        LEFT JOIN rooms r ON r.id = b.room_id
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