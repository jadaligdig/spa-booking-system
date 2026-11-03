const db = require('../config/db');
const Availability = require('../models/availability.model');
const { ok, fail } = require('../utils/respond');

exports.list = async (req, res) => {
  try {
    const { date, service_id, branch_id } = req.query;

    if (!date || !service_id || !branch_id) {
      return fail(res, 400, 'date, service_id, and branch_id are required');
    }

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      !Number.isInteger(Number(service_id)) ||
      !Number.isInteger(Number(branch_id))
    ) {
      return fail(res, 400, 'Invalid date, service_id, or branch_id');
    }

    const [services] = await db.query(
      'SELECT * FROM services WHERE id = ? AND is_active = 1',
      [service_id]
    );

    if (!services.length) {
      return fail(res, 404, 'Service not found');
    }

    const [branches] = await db.query(
      'SELECT * FROM branches WHERE id = ? AND is_active = 1',
      [branch_id]
    );

    if (!branches.length) {
      return fail(res, 404, 'Branch not found');
    }

    const service = services[0];
    const branch = branches[0];

    const [therapists] = await db.query(
      'SELECT * FROM therapists WHERE branch_id = ? AND is_active = 1',
      [branch_id]
    );

    const [rooms] = await db.query(
      'SELECT * FROM rooms WHERE branch_id = ? AND is_active = 1',
      [branch_id]
    );

    const weekday = new Date(date + 'T00:00:00Z').getUTCDay();
    const available = [];

    for (const therapist of therapists) {
      const [schedules] = await db.query(
        `SELECT * FROM therapist_schedules
         WHERE therapist_id = ? AND day_of_week = ?`,
        [therapist.id, weekday]
      );

      for (const schedule of schedules) {
        let minutes =
          Number(schedule.start_time.slice(0, 2)) * 60 +
          Number(schedule.start_time.slice(3, 5));

        const scheduleEnd =
          Number(schedule.end_time.slice(0, 2)) * 60 +
          Number(schedule.end_time.slice(3, 5));

        while (minutes + service.duration_min <= scheduleEnd) {
          const startHour = String(Math.floor(minutes / 60)).padStart(2, '0');
          const startMinute = String(minutes % 60).padStart(2, '0');
          const start_at = date + ' ' + startHour + ':' + startMinute;

          const endMinutes = minutes + service.duration_min;
          const endHour = String(Math.floor(endMinutes / 60)).padStart(2, '0');
          const endMinute = String(endMinutes % 60).padStart(2, '0');
          const end_at = date + ' ' + endHour + ':' + endMinute;

          const blockedMinutes = endMinutes + service.cleanup_min;
          const blockedHour = String(Math.floor(blockedMinutes / 60)).padStart(2, '0');
          const blockedMinute = String(blockedMinutes % 60).padStart(2, '0');
          const blocked_until = date + ' ' + blockedHour + ':' + blockedMinute;

          if (
            start_at.slice(11, 16) >= branch.open_time &&
            end_at.slice(11, 16) <= branch.close_time &&
            blockedMinutes <= 24 * 60
          ) {
            for (const room of rooms) {
              const problems = await Availability.checkConflicts({
                therapist_id: therapist.id,
                room_id: room.id,
                start_at,
                end_at,
                blocked_until
              });

              if (problems.length === 0) {
                available.push({
                  therapist,
                  room,
                  start_at,
                  end_at,
                  blocked_until
                });
              }
            }
          }

          minutes += 30;
        }
      }
    }

    return ok(res, available);
  } catch (err) {
    console.error(err);
    return fail(res, 500, 'Server error');
  }
};

// Get active services for the availability page.
exports.services = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, name, duration_min, price, cleanup_min FROM services WHERE is_active = 1 ORDER BY name'
    );

    return ok(res, rows);
  } catch (err) {
    console.error(err);
    return fail(res, 500, 'Server error');
  }
};