const router = require('express').Router();
const { authenticate, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/promotions.controller');

router.use(authenticate); // every route below needs a logged-in user (401 otherwise)

router.get('/', ctrl.list);                                          // GET    /api/promotions
router.get('/:id', ctrl.get);                                        // GET    /api/promotions/3
router.post('/', requireRole('admin'), ctrl.create);                 // POST   /api/promotions
router.put('/:id', requireRole('admin'), ctrl.update);               // PUT    /api/promotions/3
router.delete('/:id', requireRole('admin'), ctrl.remove);            // DELETE /api/promotions/3

module.exports = router;