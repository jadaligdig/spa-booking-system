// CONTROLLER = receives the request, calls the model, sends the response.
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Users = require('../models/users.model');
const audit = require('../utils/audit');
const { ok, fail } = require('../utils/respond');

exports.login = (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  if (!email || !password) return fail(res, 400, 'Email and password are required');

  const user = Users.findByEmail(email);
  if (!user || !user.is_active || !bcrypt.compareSync(password, user.password_hash)) {
    return fail(res, 401, 'Wrong email or password');
  }
  const token = jwt.sign({ id: user.id, role: user.role, name: user.full_name }, process.env.JWT_SECRET, { expiresIn: '8h' });
  audit.log(user.id, 'LOGIN', 'users', user.id);
  return ok(res, { token, user: { id: user.id, full_name: user.full_name, role: user.role } }, 'Login successful');
};

exports.me = (req, res) => ok(res, req.user);
