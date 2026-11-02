const router = require('express').Router();
const { authenticate, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/branches.controller');

router.use(authenticate); // every route below needs a logged-in user (401 otherwise)

router.get('/', ctrl.list);                                          // GET    /api/branches
router.get('/:id', ctrl.get);                                        // GET    /api/branches/3
router.post('/', requireRole('admin'), ctrl.create);                 // POST   /api/branches
router.put('/:id', requireRole('admin'), ctrl.update);               // PUT    /api/branches/3
router.delete('/:id', requireRole('admin'), ctrl.remove);            // DELETE /api/branches/3

module.exports = router;
