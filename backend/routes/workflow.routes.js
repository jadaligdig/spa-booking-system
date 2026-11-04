const express = require('express');
require('../utils/workflowScheduler');

const router = express.Router();

const { authenticate } = require('../middleware/auth');
const workflow = require('../controllers/workflow.controller');

// Get bookings
router.get('/bookings', authenticate, workflow.findBookings);

// Change booking status
router.patch('/bookings/:id/status', authenticate, workflow.changeStatus);

// Run automatic booking checks
router.post('/run-checks', authenticate, workflow.runChecks);

module.exports = router;