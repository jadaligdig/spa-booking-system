const alerts = require('../models/alerts.model');
const audit = require('../utils/audit');
const { ok, created, fail } = require('../utils/respond');

exports.findAll = async (req, res) => {
    try {
        const rows = await alerts.findAll();
        return ok(res, rows);
    } catch (error) {
        console.error('Alerts list error:', error);
        return fail(res, 500, 'Internal server error');
    }
};

exports.create = async (req, res) => {
    try {
        const { booking_id, type, message } = req.body;

        if (!type || !message) {
            return fail(res, 400, 'Type and message are required');
        }

        const id = await alerts.create(booking_id, type, message);

        await audit.log(req.user.id, 'CREATE_ALERT', 'alerts', id, message);

        return created(res, { id }, 'Alert created successfully');
    } catch (error) {
        console.error('Alert create error:', error);
        return fail(res, 500, 'Internal server error');
    }
};

exports.resolve = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return fail(res, 400, 'Invalid alert ID');
        }

        const affected = await alerts.resolve(id);

        if (!affected) {
            return fail(res, 404, 'Alert not found');
        }

        await audit.log(req.user.id, 'RESOLVE_ALERT', 'alerts', id);

        return ok(res, null, 'Alert resolved successfully');
    } catch (error) {
        console.error('Alert resolve error:', error);
        return fail(res, 500, 'Internal server error');
    }
};

exports.remove = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return fail(res, 400, 'Invalid alert ID');
        }

        const affected = await alerts.remove(id);

        if (!affected) {
            return fail(res, 404, 'Alert not found');
        }

        await audit.log(req.user.id, 'DELETE_ALERT', 'alerts', id);

        return ok(res, null, 'Alert deleted successfully');
    } catch (error) {
        console.error('Alert delete error:', error);
        return fail(res, 500, 'Internal server error');
    }
};

exports.bookingAlertsReport = async (req, res) => {
    try {
        const rows = await alerts.bookingAlertsReport();
        return ok(res, rows);
    } catch (error) {
        console.error('Booking alerts report error:', error);
        return fail(res, 500, 'Internal server error');
    }
};