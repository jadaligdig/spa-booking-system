const router = require('express').Router();
const { authenticate, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/users.controller');

router.use(authenticate);
router.use(requireRole('admin'));

// INNER JOIN report: users with their role (must come before '/:id')
router.get('/report/with-roles', ctrl.report);

router.get('/', ctrl.list);
router.get('/:id', ctrl.get);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.deactivate);

module.exports = router;