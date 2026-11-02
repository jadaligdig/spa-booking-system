// Auto-loads every file named  <name>.routes.js  in this folder and mounts it at /api/<name>.
//   branches.routes.js  ->  /api/branches
// So nobody has to edit this file when they add a resource (fewer Git conflicts).
const fs = require('fs');
const express = require('express');
const router = express.Router();

fs.readdirSync(__dirname)
  .filter((f) => f.endsWith('.routes.js'))
  .forEach((f) => router.use('/' + f.replace('.routes.js', ''), require('./' + f)));

module.exports = router;
