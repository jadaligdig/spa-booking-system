const express = require('express');
require('../utils/workflowScheduler');
const router = express.Router();

const { authenticate } = require('../middleware/auth');
const workflow = require('../controllers/workflow.controller');

router.patch('/bookings/:id/status', authenticate, workflow.changeStatus);
router.post('/run-checks', authenticate, workflow.runChecks);

module.exports = router;