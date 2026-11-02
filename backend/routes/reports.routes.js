const router = require('express').Router();
const { authenticate, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/reports.controller');

router.use(authenticate); // every route below needs a logged-in user (401 otherwise)

router.get('/service-popularity', requireRole('admin', 'receptionist'), ctrl.servicePopularity); // GET /api/reports/service-popularity
router.get('/dashboard', requireRole('admin', 'receptionist'), ctrl.dashboard);                  // GET /api/reports/dashboard

module.exports = router;