const payments = require('../models/payments.model');
const transactions = require('../models/transactions.model');

exports.createPayment = async (req, res) => {
    try {
        const { booking_id, amount, method, kind } = req.body;

        const validMethods = ['cash', 'card', 'gcash'];
        const validKinds = ['deposit', 'payment', 'refund', 'cancel_fee'];

        if (!booking_id || amount === undefined || !method || !kind) {
            return res.status(400).json({
                success: false,
                message: 'All payment fields are required'
            });
        }

        const numericAmount = Number(amount);

        if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Amount must be greater than 0'
            });
        }

        if (
            !validMethods.includes(method) ||
            !validKinds.includes(kind)
        ) {
            return res.status(400).json({
                success: false,
                message: 'Invalid payment method or kind'
            });
        }

        const booking = await transactions.findBookingById(booking_id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        const payment = await payments.createPayment({
            booking_id,
            amount: numericAmount,
            method,
            kind
        });

        // Deposits and payments confirm pending bookings.
        if (
            ['deposit', 'payment'].includes(kind) &&
            booking.status === 'pending'
        ) {
            await transactions.updateBookingStatus(booking_id, 'confirmed');
        }

        return res.status(201).json({
            success: true,
            message: 'Payment recorded successfully',
            data: payment
        });
    } catch (error) {
        console.error('Create payment error:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to record payment'
        });
    }
};

exports.getPayments = async (req, res) => {
    try {
        const booking = await transactions.findBookingById(
            req.params.bookingId
        );

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        const paymentList = await payments.findPaymentsByBookingId(
            req.params.bookingId
        );

        return res.json({
            success: true,
            message: 'Payments retrieved successfully',
            data: paymentList
        });
    } catch (error) {
        console.error('Get payments error:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve payments'
        });
    }
};