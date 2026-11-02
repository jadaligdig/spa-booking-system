// ROUTE = maps  METHOD + URL  to a controller function.
const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/auth.controller');

router.post('/login', ctrl.login);          // POST /api/auth/login
router.get('/me', authenticate, ctrl.me);   // GET  /api/auth/me

module.exports = router;
