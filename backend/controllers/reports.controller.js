const Report = require('../models/reports.model');
const { ok, fail } = require('../utils/respond');

const wrap = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (err) {
    console.error(err);
    return fail(res, 500, 'Server error');
  }
};

exports.servicePopularity = wrap(async (req, res) =>
  ok(res, await Report.servicePopularity()));

exports.dashboard = wrap(async (req, res) =>
  ok(res, await Report.dashboard()));