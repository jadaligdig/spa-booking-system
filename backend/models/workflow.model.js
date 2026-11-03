const db = require('../config/db');

// Allowed booking status changes
const allowedMoves = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['in_service', 'cancelled', 'no_show'],
    in_service: ['completed']
};

// Manually change a booking's status
exports.changeStatus = async (bookingId, newStatus, userId, reason = '') => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [rows] = await connection.query(
            `SELECT id, status, start_at, total_price,
       TIMESTAMPDIFF(
         MINUTE,
         NOW(),
         STR_TO_DATE(start_at, '%Y-%m-%d %H:%i')
       ) AS minutes_until_start
       FROM bookings
       WHERE id = ?
       FOR UPDATE`,
            [bookingId]
        );

        if (!rows.length) {
            await connection.rollback();
            return { error: 'Booking not found', statusCode: 404 };
        }

        const booking = rows[0];
        const oldStatus = booking.status;

        if (!allowedMoves[oldStatus]?.includes(newStatus)) {
            await connection.rollback();

            return {
                error: `Cannot change status from ${oldStatus} to ${newStatus}`,
                statusCode: 400
            };
        }

        await connection.query(
            'UPDATE bookings SET status = ? WHERE id = ?',
            [newStatus, bookingId]
        );

        await connection.query(
            `INSERT INTO booking_status_history
       (booking_id, old_status, new_status, changed_by, reason)
       VALUES (?, ?, ?, ?, ?)`,
            [bookingId, oldStatus, newStatus, userId ?? null, reason]
        );

        // Add a 50% cancellation fee if cancelled within 2 hours before start.
        if (
            newStatus === 'cancelled' &&
            booking.minutes_until_start >= 0 &&
            booking.minutes_until_start < 120
        ) {
            const fee = Number(booking.total_price) * 0.5;

            await connection.query(
                `INSERT INTO payments (booking_id, amount, method, kind)
         VALUES (?, ?, ?, ?)`,
                [bookingId, fee, 'cash', 'cancel_fee']
            );
        }

        await connection.commit();

        return {
            booking_id: bookingId,
            old_status: oldStatus,
            new_status: newStatus
        };

    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

// Run automatic booking checks
exports.runChecks = async () => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        let pendingAlerts = 0;
        let lateAlerts = 0;
        let noShows = 0;

        // Find pending bookings older than 30 minutes.
        const [pendingBookings] = await connection.query(
            `SELECT id
       FROM bookings
       WHERE status = 'pending'
       AND created_at <= DATE_SUB(NOW(), INTERVAL 30 MINUTE)
       FOR UPDATE`
        );

        for (const booking of pendingBookings) {
            const [existing] = await connection.query(
                `SELECT id FROM alerts
         WHERE booking_id = ? AND type = 'unconfirmed_booking'
         LIMIT 1`,
                [booking.id]
            );

            if (!existing.length) {
                await connection.query(
                    `INSERT INTO alerts (booking_id, type, message)
           VALUES (?, ?, ?)`,
                    [
                        booking.id,
                        'unconfirmed_booking',
                        `Booking #${booking.id} is still pending after 30 minutes`
                    ]
                );

                pendingAlerts++;
            }
        }

        // Find confirmed bookings that are at least 15 minutes late.
        const [lateBookings] = await connection.query(
            `SELECT id, start_at
       FROM bookings
       WHERE status = 'confirmed'
       AND STR_TO_DATE(start_at, '%Y-%m-%d %H:%i')
           <= DATE_SUB(NOW(), INTERVAL 15 MINUTE)
       FOR UPDATE`
        );

        for (const booking of lateBookings) {
            const [existing] = await connection.query(
                `SELECT id FROM alerts
         WHERE booking_id = ? AND type = 'late_booking'
         LIMIT 1`,
                [booking.id]
            );

            if (!existing.length) {
                await connection.query(
                    `INSERT INTO alerts (booking_id, type, message)
           VALUES (?, ?, ?)`,
                    [
                        booking.id,
                        'late_booking',
                        `Booking #${booking.id} is at least 15 minutes late`
                    ]
                );

                lateAlerts++;
            }

            // Automatically mark bookings 30 minutes late as no_show.
            const [timeCheck] = await connection.query(
                `SELECT
         STR_TO_DATE(start_at, '%Y-%m-%d %H:%i')
           <= DATE_SUB(NOW(), INTERVAL 30 MINUTE) AS is_no_show
         FROM bookings
         WHERE id = ?`,
                [booking.id]
            );

            if (timeCheck[0].is_no_show) {
                await connection.query(
                    `UPDATE bookings SET status = 'no_show' WHERE id = ?`,
                    [booking.id]
                );

                await connection.query(
                    `INSERT INTO booking_status_history
           (booking_id, old_status, new_status, changed_by, reason)
           VALUES (?, ?, ?, ?, ?)`,
                    [
                        booking.id,
                        'confirmed',
                        'no_show',
                        null,
                        'Automatically marked no-show after 30 minutes'
                    ]
                );

                noShows++;
            }
        }

        await connection.commit();

        return {
            pending_alerts_created: pendingAlerts,
            late_alerts_created: lateAlerts,
            bookings_marked_no_show: noShows
        };

    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};