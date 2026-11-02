const router = require('express').Router();
const { authenticate, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/categories.controller');

router.use(authenticate); // every route below needs a logged-in user (401 otherwise)

router.get('/', ctrl.list);                                          // GET    /api/categories
router.get('/:id', ctrl.get);                                        // GET    /api/categories/3
router.post('/', requireRole('admin'), ctrl.create);                 // POST   /api/categories
router.put('/:id', requireRole('admin'), ctrl.update);               // PUT    /api/categories/3
router.delete('/:id', requireRole('admin'), ctrl.remove);            // DELETE /api/categories/3

module.exports = router;