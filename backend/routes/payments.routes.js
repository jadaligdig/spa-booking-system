const express = require('express');
const router = express.Router();
const payments = require('../controllers/payments.controller');

router.post('/', payments.createPayment);
router.get('/booking/:bookingId', payments.getPayments);

module.exports = router;