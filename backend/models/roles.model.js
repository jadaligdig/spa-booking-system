const db = require('../config/db');

exports.findAll = async () => {
    const [rows] = await db.query('SELECT * FROM roles');
    return rows;
};

exports.findById = async (id) => {
    const [rows] = await db.query('SELECT * FROM roles WHERE id = ?', [id]);
    return rows[0];
};