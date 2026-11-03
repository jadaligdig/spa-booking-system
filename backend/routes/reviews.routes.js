const router = require('express').Router();
const { authenticate, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/reviews.controller');

router.use(authenticate); // every route below needs a logged-in user (401 otherwise)

router.get('/', ctrl.list);                                                        // GET    /api/reviews
router.get('/:id', ctrl.get);                                                      // GET    /api/reviews/3
router.post('/', requireRole('admin', 'receptionist', 'customer'), ctrl.create);   // POST   /api/reviews
router.put('/:id', requireRole('admin'), ctrl.update);                             // PUT    /api/reviews/3
router.delete('/:id', requireRole('admin'), ctrl.remove);                          // DELETE /api/reviews/3

module.exports = router;