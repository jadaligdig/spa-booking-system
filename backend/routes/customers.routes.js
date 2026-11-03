const router = require('express').Router();
const { authenticate, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/customers.controller');

router.use(authenticate);

router.get('/', ctrl.list);
router.get('/:id', ctrl.get);
router.post('/', ctrl.create);                          // reception can add customers too
router.put('/:id', ctrl.update);
router.delete('/:id', requireRole('admin'), ctrl.remove);

module.exports = router;