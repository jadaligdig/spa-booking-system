const express = require('express');
const router = express.Router();
const transactions = require('../controllers/transactions.controller');

router.post('/', transactions.createPayment);
router.get('/booking/:bookingId', transactions.getPayments);

module.exports = router;