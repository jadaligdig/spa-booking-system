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

exports.list = (req, res) => ok(res, Branch.findAll());

exports.get = (req, res) => {
  const row = Branch.findById(req.params.id);
  if (!row) return fail(res, 404, 'Branch not found');
  return ok(res, row);
};

exports.create = (req, res) => {
  const data = clean(req.body);
  const errors = Branch.validate(data);
  if (errors.length) return fail(res, 400, 'Validation failed', errors);
  const row = Branch.create(data);
  audit.log(req.user.id, 'CREATE', 'branches', row.id, data.name);
  return created(res, row, 'Branch created');
};

exports.update = (req, res) => {
  if (!Branch.findById(req.params.id)) return fail(res, 404, 'Branch not found');
  const data = clean(req.body);
  const errors = Branch.validate(data);
  if (errors.length) return fail(res, 400, 'Validation failed', errors);
  const row = Branch.update(req.params.id, data);
  audit.log(req.user.id, 'UPDATE', 'branches', row.id, data.name);
  return ok(res, row, 'Branch updated');
};

exports.remove = (req, res) => {
  if (!Branch.remove(req.params.id)) return fail(res, 404, 'Branch not found');
  audit.log(req.user.id, 'DELETE', 'branches', req.params.id, 'soft delete');
  return ok(res, null, 'Branch deleted');
};
