const Customer = require('../models/customers.model');
const audit = require('../utils/audit');
const { ok, created, fail } = require('../utils/respond');

const clean = (b = {}) => ({
  full_name: String(b.full_name ?? '').trim(),
  phone: String(b.phone ?? '').trim(),
  email: String(b.email ?? '').trim().toLowerCase(),
});

const wrap = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (err) {
    console.error(err);
    if (err.code === 'ER_DUP_ENTRY') return fail(res, 409, 'A customer with that email or phone already exists');
    if (err.code === 'ER_ROW_IS_REFERENCED_2') return fail(res, 409, 'This customer has bookings and cannot be deleted');
    return fail(res, 500, 'Server error');
  }
};

exports.list = wrap(async (req, res) => ok(res, await Customer.findAll()));

exports.get = wrap(async (req, res) => {
  const row = await Customer.findById(req.params.id);
  if (!row) return fail(res, 404, 'Customer not found');
  return ok(res, row);
});

exports.create = wrap(async (req, res) => {
  const data = clean(req.body);
  const errors = Customer.validate(data);
  if (errors.length) return fail(res, 400, 'Validation failed', errors);
  const row = await Customer.create(data);
  await audit.log(req.user.id, 'CREATE', 'customers', row.id, data.full_name);
  return created(res, row, 'Customer created');
});

exports.update = wrap(async (req, res) => {
  if (!(await Customer.findById(req.params.id))) return fail(res, 404, 'Customer not found');
  const data = clean(req.body);
  const errors = Customer.validate(data);
  if (errors.length) return fail(res, 400, 'Validation failed', errors);
  const row = await Customer.update(req.params.id, data);
  await audit.log(req.user.id, 'UPDATE', 'customers', row.id, data.full_name);
  return ok(res, row, 'Customer updated');
});

exports.remove = wrap(async (req, res) => {
  if (!(await Customer.remove(req.params.id))) return fail(res, 404, 'Customer not found');
  await audit.log(req.user.id, 'DELETE', 'customers', req.params.id, '');
  return ok(res, null, 'Customer deleted');
});