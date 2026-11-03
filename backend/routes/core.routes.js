const express = require('express');
const router = express.Router();
const CoreController = require('../controllers/core.controller');
const authMiddleware = require('../middleware/auth'); // assuming project auth middleware exists

// INNER JOIN Report Route
router.get('/users/report/with-roles', CoreController.getUsersReport);

// Customers Full CRUD Routes
router.get('/customers', CoreController.listCustomers);
router.get('/customers/:id', CoreController.getCustomer);
router.post('/customers', CoreController.createCustomer);
router.put('/customers/:id', CoreController.updateCustomer);
router.delete('/customers/:id', CoreController.deleteCustomer);

module.exports = router;