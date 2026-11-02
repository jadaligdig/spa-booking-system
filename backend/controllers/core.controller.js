const User = require('../models/users.model');
const Customer = require('../models/customers.model');
const audit = require('../utils/audit');

exports.getUserById = async (req, res, next) => {
    try {
        const row = await User.findUserById(req.params.id);
        if (!row) return res.status(404).json({ success: false, message: 'User not found' });
        
        await audit.log(req.user, 'VIEW_USER', `Viewed user ID ${req.params.id}`);
        return res.json({ success: true, data: row });
    } catch (err) {
        return next(err);
    }
};

exports.createCustomer = async (req, res, next) => {
    try {
        const newCustomer = await Customer.createCustomer(req.body);
        await audit.log(req.user, 'CREATE_CUSTOMER', `Created customer ID ${newCustomer.id}`);
        return res.status(201).json({ success: true, data: newCustomer });
    } catch (err) {
        return next(err);
    }
};