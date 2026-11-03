const router = require('express').Router();
const { authenticate, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/rooms.controller');

router.use(authenticate);

// View rooms
router.get('/', ctrl.list);

// Only admins can add rooms
router.post('/', requireRole('admin'), ctrl.create);

module.exports = router;