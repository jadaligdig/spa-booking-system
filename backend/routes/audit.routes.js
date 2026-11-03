const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const audit = require('../controllers/audit.controller');

router.get('/', authenticate, requireRole('admin'), audit.findAll);

module.exports = router;