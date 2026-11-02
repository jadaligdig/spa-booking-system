// Call this after any create / update / delete so the action is recorded in audit_logs.
// Member E owns the audit_logs table and the screen that shows it.
const db = require('../config/db');

exports.log = async (userId, action, tableName, recordId, details = '') => {
  await db.query(
    'INSERT INTO audit_logs (user_id, action, table_name, record_id, details) VALUES (?, ?, ?, ?, ?)',
    [userId ?? null, action, tableName, recordId ?? null, String(details)]
  );
};