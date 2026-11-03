const router = require('express').Router();
const { authenticate, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/therapists.controller');

router.use(authenticate);

// View therapists
router.get('/', ctrl.list);
router.get('/report/utilization', ctrl.utilizationReport);
router.get('/:id', ctrl.get);

// Only admins can add, edit, or delete therapists
router.post('/', requireRole('admin'), ctrl.create);
router.put('/:id', requireRole('admin'), ctrl.update);
router.delete('/:id', requireRole('admin'), ctrl.remove);

module.exports = router;