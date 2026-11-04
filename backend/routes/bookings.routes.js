const express = require('express');
const router = express.Router();
const bookings = require('../controllers/bookings.controller');

router.get('/', bookings.getBookings);
router.get('/report/details', bookings.getBookingDetails);
router.get('/:id', bookings.getBookingById);
router.get('/:id/details', bookings.getBookingDetails);
router.post('/', bookings.createBooking);
router.put('/:id/reschedule', bookings.rescheduleBooking);
router.patch('/:id/cancel', bookings.cancelBooking);

module.exports = router;