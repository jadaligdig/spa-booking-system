const payments = require('../models/payments.model');
const transactions = require('../models/transactions.model');

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
            return res.status(400).json({
                message: 'Amount must be greater than zero'
            });
        }

        if (!validMethods.includes(method)) {
            return res.status(400).json({
                message: 'Invalid payment method'
            });
        }

        if (!validKinds.includes(kind)) {
            return res.status(400).json({
                message: 'Invalid payment kind'
            });
        }

        const booking = await transactions.findBookingById(booking_id);

        if (!booking) {
            return res.status(404).json({
                message: 'Booking not found'
            });
        }

        const payment = await payments.createPayment({
            booking_id,
            amount: Number(amount),
            method,
            kind
        });

        res.status(201).json({
            message: 'Payment recorded successfully',
            payment_id: payment.id
        });
    } catch (error) {
        console.error('Create payment error:', error);
        res.status(500).json({
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
                message: 'Booking not found'
            });
        }

        const paymentList = await payments.findPaymentsByBookingId(
            req.params.bookingId
        );

        res.json(paymentList);
    } catch (error) {
        console.error('Get payments error:', error);
        res.status(500).json({
            message: 'Failed to get payments'
        });
    }
};