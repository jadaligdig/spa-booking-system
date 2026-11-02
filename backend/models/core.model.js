const db = require('../config/db');

exports.findAllRoles = async () => {
    const [rows] = await db.query('SELECT * FROM roles');
    return rows;
};

exports.findRoleById = async (id) => {
    const [rows] = await db.query('SELECT * FROM roles WHERE id = ?', [id]);
    return rows[0];
};

exports.findAllUsers = async () => {
    const [rows] = await db.query('SELECT * FROM users');
    return rows;
};

exports.findUserById = async (id) => {
    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0];
};

exports.findUserByEmail = async (email) => {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
};

exports.createUser = async (d) => {
    const [result] = await db.query(
        'INSERT INTO users (username, email, password, role_id) VALUES (?, ?, ?, ?)',
        [d.username, d.email, d.password, d.role_id]
    );
    return exports.findUserById(result.insertId);
};

exports.removeUser = async (id) => {
    const [result] = await db.query('DELETE FROM users WHERE id = ?', [id]);
    return result.affectedRows;
};

// --- CUSTOMERS ---
exports.findAllCustomers = async () => {
    const [rows] = await db.query('SELECT * FROM customers');
    return rows;
};

exports.findCustomerById = async (id) => {
    const [rows] = await db.query('SELECT * FROM customers WHERE id = ?', [id]);
    return rows[0];
};

exports.createCustomer = async (d) => {
    const [result] = await db.query(
        'INSERT INTO customers (name, email, phone) VALUES (?, ?, ?)',
        [d.name, d.email, d.phone]
    );
    return exports.findCustomerById(result.insertId);
};

exports.removeCustomer = async (id) => {
    const [result] = await db.query('DELETE FROM customers WHERE id = ?', [id]);
    return result.affectedRows;
};