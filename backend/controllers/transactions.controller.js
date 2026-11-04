const transactions = require('../models/transactions.model');
const availability = require('../models/availability.model');

function parseDateTime(value) {
    if (typeof value !== 'string') return null;

    const match = value.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}):(\d{2})$/);
    if (!match) return null;

    const [, date, hour, minute] = match;
    const parsed = new Date(`${date}T${hour}:${minute}:00`);

    if (Number.isNaN(parsed.getTime())) return null;
    return parsed;
}

function formatDateTime(date) {
    const pad = (number) => String(number).padStart(2, '0');

    return (
        `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
        `${pad(date.getHours())}:${pad(date.getMinutes())}`
    );
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
        blocked_until: formatDateTime(blockedUntil)
    };
}

// GET /api/bookings
exports.getBookings = async (req, res) => {
    try {
        const bookings = await transactions.findAllBookings();
        res.json(bookings);
    } catch (error) {
        console.error('Get bookings error:', error);
        res.status(500).json({ message: 'Failed to get bookings' });
    }
};

// GET /api/bookings/:id
exports.getBookingById = async (req, res) => {
    try {
        const booking = await transactions.findBookingById(req.params.id);

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        res.json(booking);
    } catch (error) {
        console.error('Get booking error:', error);
        res.status(500).json({ message: 'Failed to get booking' });
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

        if (
            !customer_id ||
            !service_id ||
            !therapist_id ||
            !room_id ||
            !start_at
        ) {
            return res.status(400).json({
                message: 'Customer, service, therapist, room, and start time are required'
            });
        }

        const service = await transactions.findServiceDetails(service_id);

        if (!service) {
            return res.status(404).json({ message: 'Active service not found' });
        }

        const times = calculateBookingTimes(
            start_at,
            service.duration_min,
            service.cleanup_min
        );

        if (!times) {
            return res.status(400).json({ message: 'Invalid start time or service duration' });
        }

        const problems = await availability.checkConflicts({
            therapist_id,
            room_id,
            ...times
        });

        if (problems.length) {
            return res.status(409).json({
                message: 'Booking conflicts with spa rules',
                reasons: problems
            });
        }

        const bookingId = await transactions.createBooking({
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

        res.status(201).json({
            message: 'Booking created successfully',
            booking_id: bookingId
        });
    } catch (error) {
        console.error('Create booking error:', error);
        res.status(500).json({ message: 'Failed to create booking' });
    }
};

// PUT /api/bookings/:id/reschedule
exports.rescheduleBooking = async (req, res) => {
    try {
        const booking = await transactions.findBookingById(req.params.id);

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        if (['cancelled', 'no_show', 'completed'].includes(booking.status)) {
            return res.status(400).json({
                message: 'This booking cannot be rescheduled'
            });
        }

        const times = calculateBookingTimes(
            req.body.start_at,
            booking.duration_min,
            booking.cleanup_min
        );

        if (!times) {
            return res.status(400).json({ message: 'Invalid start time' });
        }

        const problems = await availability.checkConflicts({
            therapist_id: booking.therapist_id,
            room_id: booking.room_id,
            ...times,
            ignore_booking_id: booking.id
        });

        if (problems.length) {
            return res.status(409).json({
                message: 'Booking conflicts with spa rules',
                reasons: problems
            });
        }

        await transactions.updateBookingTime(booking.id, times);

        res.json({ message: 'Booking rescheduled successfully' });
    } catch (error) {
        console.error('Reschedule booking error:', error);
        res.status(500).json({ message: 'Failed to reschedule booking' });
    }
};

// PATCH /api/bookings/:id/cancel
exports.cancelBooking = async (req, res) => {
    try {
        const booking = await transactions.findBookingById(req.params.id);

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        if (booking.status === 'cancelled') {
            return res.status(400).json({ message: 'Booking is already cancelled' });
        }

        await transactions.cancelBooking(booking.id);
        res.json({ message: 'Booking cancelled successfully' });
    } catch (error) {
        console.error('Cancel booking error:', error);
        res.status(500).json({ message: 'Failed to cancel booking' });
    }
};

// GET /api/bookings/:id/details
exports.getBookingDetails = async (req, res) => {
    try {
        const details = await transactions.findBookingDetails(req.params.id);

        if (!details) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        res.json(details);
    } catch (error) {
        console.error('Get booking details error:', error);
        res.status(500).json({ message: 'Failed to get booking details' });
    }
};

// POST /api/payments
exports.createPayment = async (req, res) => {
    try {
        const { booking_id, amount, method, kind } = req.body;
        const validMethods = ['cash', 'card', 'gcash'];
        const validKinds = ['deposit', 'payment', 'refund', 'cancel_fee'];

        if (!booking_id || amount === undefined || !method || !kind) {
            return res.status(400).json({
                message: 'Booking, amount, method, and payment kind are required'
            });
        }

        if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
            return res.status(400).json({ message: 'Amount must be greater than zero' });
        }

        if (!validMethods.includes(method)) {
            return res.status(400).json({ message: 'Invalid payment method' });
        }

        if (!validKinds.includes(kind)) {
            return res.status(400).json({ message: 'Invalid payment kind' });
        }

        const booking = await transactions.findBookingById(booking_id);

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        const paymentId = await transactions.createPayment({
            booking_id,
            amount: Number(amount),
            method,
            kind
        });

        res.status(201).json({
            message: 'Payment recorded successfully',
            payment_id: paymentId
        });
    } catch (error) {
        console.error('Create payment error:', error);
        res.status(500).json({ message: 'Failed to record payment' });
    }
};

// GET /api/payments/booking/:bookingId
exports.getPayments = async (req, res) => {
    try {
        const booking = await transactions.findBookingById(req.params.bookingId);

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        const payments = await transactions.findPaymentsByBookingId(
            req.params.bookingId
        );

        res.json(payments);
    } catch (error) {
        console.error('Get payments error:', error);
        res.status(500).json({ message: 'Failed to get payments' });
    }
};