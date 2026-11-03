const Promotion = require('../models/promotions.model');
const audit = require('../utils/audit');
const { ok, created, fail } = require('../utils/respond');

// Pick only the fields we expect and trim the text
const clean = (p = {}) => ({
  code: String(p.code ?? '').trim().toUpperCase(),
  discount_percent: Number(p.discount_percent),
  valid_from: String(p.valid_from ?? '').trim(),
  valid_until: String(p.valid_until ?? '').trim(),
  is_active: p.is_active === 0 || p.is_active === false ? 0 : 1,
});

// Same idea as the branches controller, plus a 409 for duplicate promo codes
const wrap = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return fail(res, 409, 'Promotion code already exists');
    console.error(err);
    return fail(res, 500, 'Server error');
  }
};

exports.list = wrap(async (req, res) => ok(res, await Promotion.findAll()));

exports.get = wrap(async (req, res) => {
  const row = await Promotion.findById(req.params.id);
  if (!row) return fail(res, 404, 'Promotion not found');
  return ok(res, row);
});

exports.create = wrap(async (req, res) => {
  const data = clean(req.body);
  const errors = Promotion.validate(data);
  if (errors.length) return fail(res, 400, 'Validation failed', errors);
  const row = await Promotion.create(data);
  await audit.log(req.user.id, 'CREATE', 'promotions', row.id, data.code);
  return created(res, row, 'Promotion created');
});

exports.update = wrap(async (req, res) => {
  if (!(await Promotion.findById(req.params.id))) return fail(res, 404, 'Promotion not found');
  const data = clean(req.body);
  const errors = Promotion.validate(data);
  if (errors.length) return fail(res, 400, 'Validation failed', errors);
  await Promotion.update(req.params.id, data);
  const row = await Promotion.findById(req.params.id);
  await audit.log(req.user.id, 'UPDATE', 'promotions', row.id, data.code);
  return ok(res, row, 'Promotion updated');
});

exports.remove = wrap(async (req, res) => {
  if (!(await Promotion.remove(req.params.id))) return fail(res, 404, 'Promotion not found');
  await audit.log(req.user.id, 'DELETE', 'promotions', req.params.id, 'deleted');
  return ok(res, null, 'Promotion deleted');
});