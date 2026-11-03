const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/availability.controller');

router.use(authenticate);

// GET available therapists and rooms
router.get('/services', ctrl.services);
router.get('/', ctrl.list);

module.exports = router;