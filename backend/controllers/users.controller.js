const bcrypt = require('bcryptjs');
const User = require('../models/users.model');
const audit = require('../utils/audit');
const { ok, created, fail } = require('../utils/respond');

const clean = (b = {}) => ({
  full_name: String(b.full_name ?? '').trim(),
  email: String(b.email ?? '').trim().toLowerCase(),
  role_id: Number(b.role_id),
  password: String(b.password ?? ''),
});

const validate = (d, needPassword) => {
  const errors = [];
  if (d.full_name.length < 2) errors.push('full_name must be at least 2 characters');
  if (!/^\S+@\S+\.\S+$/.test(d.email)) errors.push('email is not valid');
  if (!Number.isInteger(d.role_id) || d.role_id < 1) errors.push('role_id is required');
  if (needPassword && d.password.length < 6) errors.push('password must be at least 6 characters');
  return errors;
};

const wrap = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (err) {
    console.error(err);
    if (err.code === 'ER_DUP_ENTRY') return fail(res, 409, 'A user with that email already exists');
    if (err.code === 'ER_NO_REFERENCED_ROW_2') return fail(res, 400, 'That role does not exist');
    return fail(res, 500, 'Server error');
  }
};

// INNER JOIN report: users with their role
exports.report = wrap(async (req, res) => ok(res, await User.findAll()));

exports.list = wrap(async (req, res) => ok(res, await User.findAll()));

exports.get = wrap(async (req, res) => {
  const row = await User.findById(req.params.id);
  if (!row) return fail(res, 404, 'User not found');
  return ok(res, row);
});

exports.create = wrap(async (req, res) => {
  const data = clean(req.body);
  const errors = validate(data, true);
  if (errors.length) return fail(res, 400, 'Validation failed', errors);
  const row = await User.create({
    role_id: data.role_id,
    email: data.email,
    full_name: data.full_name,
    password_hash: bcrypt.hashSync(data.password, 10),   // never store the plain password
  });
  await audit.log(req.user.id, 'CREATE', 'users', row.id, data.email);
  return created(res, row, 'User created');
});

exports.update = wrap(async (req, res) => {
  if (!(await User.findById(req.params.id))) return fail(res, 404, 'User not found');
  const data = clean(req.body);
  const errors = validate(data, false);
  if (errors.length) return fail(res, 400, 'Validation failed', errors);
  const row = await User.update(req.params.id, data);
  await audit.log(req.user.id, 'UPDATE', 'users', row.id, data.email);
  return ok(res, row, 'User updated');
});

exports.deactivate = wrap(async (req, res) => {
  if (Number(req.params.id) === req.user.id) return fail(res, 400, 'You cannot deactivate your own account');
  if (!(await User.deactivate(req.params.id))) return fail(res, 404, 'User not found');
  await audit.log(req.user.id, 'DELETE', 'users', req.params.id, 'deactivated');
  return ok(res, null, 'User deactivated');
});