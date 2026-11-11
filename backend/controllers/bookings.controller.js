const bookings = require('../models/bookings.model');
const availability = require('../models/availability.model');
const { ok, created, fail } = require('../utils/respond');

function parseDateTime(value) {
    if (typeof value !== 'string') return null;

    const match = value.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}):(\d{2})$/);
    if (!match) return null;

    const [, date, hour, minute] = match;
    const parsed = new Date(`${date}T${hour}:${minute}:00`);

    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDateTime(date) {
    const pad = number => String(number).padStart(2, '0');

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
        `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function calculateBookingTimes(startAt, durationMin, cleanupMin = 0) {
    const start = parseDateTime(startAt);

    if (!start || !Number.isFinite(Number(durationMin)) || Number(durationMin) <= 0) {
        return null;
    }

    const end = new Date(start.getTime() + Number(durationMin) * 60000);
    const blockedUntil = new Date(
        end.getTime() + Math.max(0, Number(cleanupMin) || 0) * 60000
    );

        return {
        start_at: formatDateTime(start),
        end_at: formatDateTime(end),
        start_datetime: formatDateTime(start),
        end_datetime: formatDateTime(end),
        blocked_until: formatDateTime(blockedUntil)
    };
}

// GET /api/bookings
exports.getBookings = async (req, res) => {
    try {
        const rows = await bookings.findAllBookings();
        return ok(res, rows);
    } catch (error) {
        console.error('Get bookings error:', error);
        return fail(res, 500, 'Failed to get bookings');
    }
};

// GET /api/bookings/:id
exports.getBookingById = async (req, res) => {
    try {
        const booking = await bookings.findBookingById(req.params.id);

        if (!booking) {
            return fail(res, 404, 'Booking not found');
        }

        return ok(res, booking);
    } catch (error) {
        console.error('Get booking error:', error);
        return fail(res, 500, 'Failed to get booking');
    }
};

// POST /api/bookings
exports.createBooking = async (req, res) => {
    try {
        const {
            customer_id,
            service_id,
            therapist_id,
            room_id,
            start_at,
            notes,
            created_by
        } = req.body;

        if (!customer_id || !service_id || !therapist_id || !room_id || !start_at) {
            return fail(
                res,
                400,
                'Customer, service, therapist, room, and start time are required'
            );
        }

        const service = await bookings.findServiceDetails(service_id);

        if (!service) {
            return fail(res, 404, 'Active service not found');
        }

        const times = calculateBookingTimes(
            start_at,
            service.duration_min,
            service.cleanup_min
        );

        if (!times) {
            return fail(res, 400, 'Invalid start time or service duration');
        }

        const problems = await availability.checkConflicts({
            therapist_id,
            room_id,
            ...times
        });

        if (problems.length) {
            return fail(res, 409, 'Booking conflict', problems);
        }

        const booking = await bookings.createBooking({
            customer_id,
            service_id,
            therapist_id,
            room_id,
            ...times,
            status: 'pending',
            total_price: service.price,
            notes: notes || null,
            created_by: created_by || null
        });

        return created(res, booking, 'Booking created');
    } catch (error) {
        console.error('Create booking error:', error);
        return fail(res, 500, 'Failed to create booking');
    }
};

// PUT /api/bookings/:id/reschedule
exports.rescheduleBooking = async (req, res) => {
    try {
        const booking = await bookings.findBookingById(req.params.id);

        if (!booking) {
            return fail(res, 404, 'Booking not found');
        }

        if (['cancelled', 'no_show', 'completed'].includes(booking.status)) {
            return fail(res, 400, 'This booking cannot be rescheduled');
        }

        const times = calculateBookingTimes(
            req.body.start_at,
            booking.duration_min,
            booking.cleanup_min
        );

        if (!times) {
            return fail(res, 400, 'Invalid start time');
        }

        const problems = await availability.checkConflicts({
            therapist_id: booking.therapist_id,
            room_id: booking.room_id,
            ...times,
            ignore_booking_id: booking.id
        });

        if (problems.length) {
            return fail(res, 409, 'Booking conflict', problems);
        }

        const updated = await bookings.updateBookingTime(booking.id, times);

        return ok(res, updated, 'Booking rescheduled');
    } catch (error) {
        console.error('Reschedule booking error:', error);
        return fail(res, 500, 'Failed to reschedule booking');
    }
};

// PATCH /api/bookings/:id/cancel
exports.cancelBooking = async (req, res) => {
    try {
        const booking = await bookings.findBookingById(req.params.id);

        if (!booking) {
            return fail(res, 404, 'Booking not found');
        }

        if (booking.status === 'cancelled') {
            return fail(res, 400, 'Booking is already cancelled');
        }

        const updated = await bookings.cancelBooking(booking.id);

        return ok(res, updated, 'Booking cancelled');
    } catch (error) {
        console.error('Cancel booking error:', error);
        return fail(res, 500, 'Failed to cancel booking');
    }
};

// GET /api/bookings/report/details
// GET /api/bookings/:id/details
exports.getBookingDetails = async (req, res) => {
    try {
        const id = req.params.id || undefined;
        const details = await bookings.findBookingDetails(id);

        if (id && !details) {
            return fail(res, 404, 'Booking not found');
        }

        return ok(res, details);
    } catch (error) {
        console.error('Get booking details error:', error);
        return fail(res, 500, 'Failed to get booking details');
    }
};