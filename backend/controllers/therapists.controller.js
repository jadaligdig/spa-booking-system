const Therapist = require('../models/therapists.model');
const audit = require('../utils/audit');
const { ok, created, fail } = require('../utils/respond');

const clean = (t = {}) => ({
  user_id: t.user_id || null,
  branch_id: Number(t.branch_id),
  full_name: String(t.full_name ?? '').trim(),
  specialty: String(t.specialty ?? '').trim()
});

const wrap = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (err) {
    console.error(err);
    return fail(res, 500, 'Server error');
  }
};

// GET all therapists
exports.list = wrap(async (req, res) =>
  ok(res, await Therapist.findAll())
);

// GET one therapist
exports.get = wrap(async (req, res) => {
  const row = await Therapist.findById(req.params.id);
  if (!row) return fail(res, 404, 'Therapist not found');
  return ok(res, row);
});

// CREATE therapist
exports.create = wrap(async (req, res) => {
  const data = clean(req.body);
  const errors = Therapist.validate(data);

  if (errors.length) {
    return fail(res, 400, 'Validation failed', errors);
  }

  const row = await Therapist.create(data);
  await audit.log(req.user.id, 'CREATE', 'therapists', row.id, data.full_name);

  return created(res, row, 'Therapist created');
});

// UPDATE therapist
exports.update = wrap(async (req, res) => {
  if (!(await Therapist.findById(req.params.id))) {
    return fail(res, 404, 'Therapist not found');
  }

  const data = clean(req.body);
  const errors = Therapist.validate(data);

  if (errors.length) {
    return fail(res, 400, 'Validation failed', errors);
  }

  const row = await Therapist.update(req.params.id, data);
  await audit.log(req.user.id, 'UPDATE', 'therapists', row.id, data.full_name);

  return ok(res, row, 'Therapist updated');
});

// DELETE therapist (soft delete)
exports.remove = wrap(async (req, res) => {
  if (!(await Therapist.remove(req.params.id))) {
    return fail(res, 404, 'Therapist not found');
  }

  await audit.log(req.user.id, 'DELETE', 'therapists', req.params.id, 'soft delete');

  return ok(res, null, 'Therapist deleted');
});

exports.utilizationReport = async (req, res) => {
  try {
    const { date } = req.query;

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return fail(res, 400, 'A valid date is required (YYYY-MM-DD)');
    }

    const db = require('../config/db');

    const [rows] = await db.query(
      `SELECT
         t.id,
         t.full_name,
         COUNT(b.id) AS booking_count
       FROM therapists t
       LEFT JOIN bookings b
         ON b.therapist_id = t.id
         AND DATE(b.start_at) = ?
         AND b.status NOT IN ('cancelled', 'no_show')
       GROUP BY t.id, t.full_name
       ORDER BY t.full_name`,
      [date]
    );

    return ok(res, rows);
  } catch (err) {
    console.error(err);
    return fail(res, 500, 'Server error');
  }
};