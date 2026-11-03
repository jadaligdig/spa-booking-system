const express = require('express');
const router = express.Router();
const transactions = require('../controllers/transactions.controller');

router.get('/report/details', transactions.getBookingDetails);
router.get('/', transactions.getBookings);
router.get('/:id', transactions.getBookingById);
router.get('/:id/details', transactions.getBookingDetails);
router.post('/', transactions.createBooking);
router.put('/:id/reschedule', transactions.rescheduleBooking);
router.patch('/:id/cancel', transactions.cancelBooking);

module.exports = router;