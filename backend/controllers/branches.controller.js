const Branch = require('../models/branches.model');
const audit = require('../utils/audit');
const { ok, created, fail } = require('../utils/respond');

// Sanitize: pick only the fields we expect and trim the text
const clean = (b = {}) => ({
  name: String(b.name ?? '').trim(),
  address: String(b.address ?? '').trim(),
  open_time: String(b.open_time ?? '09:00').trim(),
  close_time: String(b.close_time ?? '21:00').trim(),
});

// Passes any error to middleware/errorHandler.js, which picks the right status code
const wrap = (fn) => async (req, res, next) => {
  try {
    await fn(req, res);
  } catch (err) {
    next(err);
  }
};

exports.list = wrap(async (req, res) => ok(res, await Branch.findAll()));

exports.get = wrap(async (req, res) => {
  const row = await Branch.findById(req.params.id);
  if (!row) return fail(res, 404, 'Branch not found');
  return ok(res, row);
});

exports.create = wrap(async (req, res) => {
  const data = clean(req.body);
  const errors = Branch.validate(data);
  if (errors.length) return fail(res, 400, 'Validation failed', errors);
  const row = await Branch.create(data);
  await audit.log(req.user.id, 'CREATE', 'branches', row.id, data.name);
  return created(res, row, 'Branch created');
});

exports.update = wrap(async (req, res) => {
  if (!(await Branch.findById(req.params.id))) return fail(res, 404, 'Branch not found');
  const data = clean(req.body);
  const errors = Branch.validate(data);
  if (errors.length) return fail(res, 400, 'Validation failed', errors);
  const row = await Branch.update(req.params.id, data);
  await audit.log(req.user.id, 'UPDATE', 'branches', row.id, data.name);
  return ok(res, row, 'Branch updated');
});

exports.remove = wrap(async (req, res) => {
  if (!(await Branch.remove(req.params.id))) return fail(res, 404, 'Branch not found');
  await audit.log(req.user.id, 'DELETE', 'branches', req.params.id, 'soft delete');
  return ok(res, null, 'Branch deleted');
});