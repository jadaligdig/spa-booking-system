const Category = require('../models/categories.model');
const audit = require('../utils/audit');
const { ok, created, fail } = require('../utils/respond');

const clean = (b = {}) => ({
  name: String(b.name ?? '').trim(),
  description: String(b.description ?? '').trim(),
});

const wrap = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (err) {
    console.error(err);
    if (err.code === 'ER_ROW_IS_REFERENCED_2') return fail(res, 409, 'Cannot delete: it is still in use');
    return fail(res, 500, 'Server error');
  }
};

exports.list = wrap(async (req, res) => ok(res, await Category.findAll()));

exports.get = wrap(async (req, res) => {
  const row = await Category.findById(req.params.id);
  if (!row) return fail(res, 404, 'Category not found');
  return ok(res, row);
});

exports.create = wrap(async (req, res) => {
  const data = clean(req.body);
  const errors = Category.validate(data);
  if (errors.length) return fail(res, 400, 'Validation failed', errors);
  const row = await Category.create(data);
  await audit.log(req.user.id, 'CREATE', 'service_categories', row.id, data.name);
  return created(res, row, 'Category created');
});

exports.update = wrap(async (req, res) => {
  if (!(await Category.findById(req.params.id))) return fail(res, 404, 'Category not found');
  const data = clean(req.body);
  const errors = Category.validate(data);
  if (errors.length) return fail(res, 400, 'Validation failed', errors);
  const row = await Category.update(req.params.id, data);
  await audit.log(req.user.id, 'UPDATE', 'service_categories', row.id, data.name);
  return ok(res, row, 'Category updated');
});

exports.remove = wrap(async (req, res) => {
  if (!(await Category.remove(req.params.id))) return fail(res, 404, 'Category not found');
  await audit.log(req.user.id, 'DELETE', 'service_categories', req.params.id, '');
  return ok(res, null, 'Category deleted');
});