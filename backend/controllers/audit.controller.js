const db = require('../config/db');
const { ok, fail } = require('../utils/respond');

exports.findAll = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT id, user_id, action, table_name, record_id, details, created_at
             FROM audit_logs
             ORDER BY created_at DESC`
        );

        return ok(res, rows);
    } catch (error) {
        console.error('Audit logs error:', error);
        return fail(res, 500, 'Internal server error');
    }
};