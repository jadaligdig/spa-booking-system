const Room = require('../models/rooms.model');
const audit = require('../utils/audit');
const { ok, created, fail } = require('../utils/respond');

const clean = (r = {}) => ({
  branch_id: Number(r.branch_id),
  name: String(r.name ?? '').trim(),
  room_type: String(r.room_type ?? 'standard').trim()
});

const wrap = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (err) {
    console.error(err);
    return fail(res, 500, 'Server error');
  }
};

// GET all active rooms
exports.list = wrap(async (req, res) =>
  ok(res, await Room.findAll())
);

// CREATE a room
exports.create = wrap(async (req, res) => {
  const data = clean(req.body);
  const errors = Room.validate(data);

  if (errors.length) {
    return fail(res, 400, 'Validation failed', errors);
  }

  const row = await Room.create(data);
  await audit.log(req.user.id, 'CREATE', 'rooms', row.id, data.name);

  return created(res, row, 'Room created');
});