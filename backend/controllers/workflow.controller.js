const workflow = require('../models/workflow.model');
const audit = require('../utils/audit');

// Get bookings for the workflow page
exports.findBookings = async (req, res) => {
    try {
        const rows = await workflow.findBookings();

        return res.json({
            message: 'Bookings retrieved successfully',
            data: rows
        });
    } catch (error) {
        console.error('Booking list error:', error);
        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};

// Change booking status
exports.changeStatus = async (req, res) => {
    try {
        const bookingId = Number(req.params.id);
        const { new_status, reason } = req.body;

        if (!Number.isInteger(bookingId) || bookingId <= 0) {
            return res.status(400).json({
                message: 'Invalid booking ID'
            });
        }

        if (!new_status) {
            return res.status(400).json({
                message: 'New status is required'
            });
        }

        const result = await workflow.changeStatus(
            bookingId,
            new_status,
            req.user.id,
            reason || ''
        );

        if (result.error) {
            return res.status(result.statusCode).json({
                message: result.error
            });
        }

        await audit.log(
            req.user.id,
            'CHANGE_STATUS',
            'bookings',
            bookingId,
            `${result.old_status} -> ${result.new_status}`
        );

        return res.json({
            message: 'Booking status updated successfully',
            data: result
        });
    } catch (error) {
        console.error('Workflow error:', error);
        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};

// Run automatic booking checks
exports.runChecks = async (req, res) => {
    try {
        const result = await workflow.runChecks();

        await audit.log(
            req.user.id,
            'RUN_BOOKING_CHECKS',
            'bookings',
            null,
            JSON.stringify(result)
        );

        return res.json({
            message: 'Automatic booking checks completed',
            data: result
        });
    } catch (error) {
        console.error('Run checks error:', error);
        return res.status(500).json({
            message: 'Internal server error'
        });
    }
};