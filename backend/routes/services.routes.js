const router = require('express').Router();
const { authenticate, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/services.controller');

router.use(authenticate); // every route below needs a logged-in user (401 otherwise)

router.get('/', ctrl.list); 
router.get('/report/by-category', ctrl.reportByCategory);            // GET    /api/services
router.get('/:id', ctrl.get);                                        // GET    /api/services/3
router.post('/', requireRole('admin'), ctrl.create);                 // POST   /api/services
router.put('/:id', requireRole('admin'), ctrl.update);               // PUT    /api/services/3
router.delete('/:id', requireRole('admin'), ctrl.remove);            // DELETE /api/services/3

module.exports = router;