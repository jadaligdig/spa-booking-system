const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const alerts = require('../controllers/alerts.controller');

router.get('/', authenticate, alerts.findAll);
router.get('/report/booking-alerts', authenticate, alerts.bookingAlertsReport);
router.post('/', authenticate, alerts.create);
router.patch('/:id/resolve', authenticate, alerts.resolve);
router.delete('/:id', authenticate, alerts.remove);

module.exports = router;