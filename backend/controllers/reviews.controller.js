const Review = require('../models/reviews.model');
const audit = require('../utils/audit');
const { ok, created, fail } = require('../utils/respond');

const clean = (r = {}) => ({
  booking_id: Number(r.booking_id),
  rating: Number(r.rating),
  comment: String(r.comment ?? '').trim(),
});

// 409 = a second review for the same booking, 400 = booking id does not exist
const wrap = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return fail(res, 409, 'This booking already has a review');
    if (err.code === 'ER_NO_REFERENCED_ROW_2') return fail(res, 400, 'Booking does not exist');
    console.error(err);
    return fail(res, 500, 'Server error');
  }
};

exports.list = wrap(async (req, res) => ok(res, await Review.findAll()));

exports.get = wrap(async (req, res) => {
  const row = await Review.findById(req.params.id);
  if (!row) return fail(res, 404, 'Review not found');
  return ok(res, row);
});

exports.create = wrap(async (req, res) => {
  const data = clean(req.body);
  const errors = Review.validate(data);
  if (errors.length) return fail(res, 400, 'Validation failed', errors);

  const booking = await Review.findBooking(data.booking_id);
  if (!booking) return fail(res, 404, 'Booking not found');
  if (booking.status !== 'completed') {
    return fail(res, 400, 'Only completed bookings can be reviewed');
  }

  const row = await Review.create(data);
  await audit.log(req.user.id, 'CREATE', 'reviews', row.id, `booking ${data.booking_id}`);
  return created(res, row, 'Review created');
});

exports.update = wrap(async (req, res) => {
  const existing = await Review.findById(req.params.id);
  if (!existing) return fail(res, 404, 'Review not found');
  const data = clean({ ...req.body, booking_id: existing.booking_id });
  const errors = Review.validate(data);
  if (errors.length) return fail(res, 400, 'Validation failed', errors);
  await Review.update(req.params.id, data);
  const row = await Review.findById(req.params.id);
  await audit.log(req.user.id, 'UPDATE', 'reviews', row.id, `booking ${row.booking_id}`);
  return ok(res, row, 'Review updated');
});

exports.remove = wrap(async (req, res) => {
  if (!(await Review.remove(req.params.id))) return fail(res, 404, 'Review not found');
  await audit.log(req.user.id, 'DELETE', 'reviews', req.params.id, 'deleted');
  return ok(res, null, 'Review deleted');
});