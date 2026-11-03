const Service = require('../models/services.model');
const audit = require('../utils/audit');
const { ok, created, fail } = require('../utils/respond');

const clean = (b = {}) => ({
  name: String(b.name ?? '').trim(),
  category_id: Number(b.category_id),
  duration_min: Number(b.duration_min),
  cleanup_min: Number(b.cleanup_min ?? 0),
  price: b.price === '' || b.price == null ? NaN : Number(b.price),
});

const wrap = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (err) {
    console.error(err);
    if (err.code === 'ER_ROW_IS_REFERENCED_2') return fail(res, 409, 'Cannot delete: it is still in use');
    if (err.code === 'ER_NO_REFERENCED_ROW_2') return fail(res, 400, 'That category does not exist');
    if (err.code === 'ER_DUP_ENTRY') return fail(res, 409, 'A service with that name already exists');
    return fail(res, 500, 'Server error');
  }
};

exports.list = wrap(async (req, res) => ok(res, await Service.findAll()));

exports.reportByCategory = wrap(async (req, res) => ok(res, await Service.reportByCategory()));

exports.get = wrap(async (req, res) => {
  const row = await Service.findById(req.params.id);
  if (!row) return fail(res, 404, 'Service not found');
  return ok(res, row);
});

exports.create = wrap(async (req, res) => {
  const data = clean(req.body);
  const errors = Service.validate(data);
  if (errors.length) return fail(res, 400, 'Validation failed', errors);
  const row = await Service.create(data);
  await audit.log(req.user.id, 'CREATE', 'services', row.id, data.name);
  return created(res, row, 'Service created');
});

exports.update = wrap(async (req, res) => {
  if (!(await Service.findById(req.params.id))) return fail(res, 404, 'Service not found');
  const data = clean(req.body);
  const errors = Service.validate(data);
  if (errors.length) return fail(res, 400, 'Validation failed', errors);
  const row = await Service.update(req.params.id, data);
  await audit.log(req.user.id, 'UPDATE', 'services', row.id, data.name);
  return ok(res, row, 'Service updated');
});

exports.remove = wrap(async (req, res) => {
  if (!(await Service.remove(req.params.id))) return fail(res, 404, 'Service not found');
  await audit.log(req.user.id, 'DELETE', 'services', req.params.id, '');
  return ok(res, null, 'Service deleted');
});