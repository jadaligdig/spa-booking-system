const db = require('../config/db');

// Check whether a requested booking conflicts with spa rules.
exports.checkConflicts = async ({
  therapist_id,
  room_id,
  start_at,
  end_at,
  blocked_until,
  ignore_booking_id
}) => {
  const problems = [];

  // Check required booking information.
  if (!therapist_id || !room_id || !start_at || !end_at || !blocked_until) {
    return ['Missing required booking information'];
  }

  // Check date and time format: YYYY-MM-DD HH:MM
  const dateTimePattern = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/;

  if (
    !dateTimePattern.test(start_at) ||
    !dateTimePattern.test(end_at) ||
    !dateTimePattern.test(blocked_until)
  ) {
    return ['Invalid date or time format'];
  }

  if (start_at >= end_at || end_at > blocked_until) {
    return ['Invalid booking time range'];
  }

  const bookingDate = start_at.slice(0, 10);
  const startTime = start_at.slice(11, 16);
  const endTime = end_at.slice(11, 16);

  // Find therapist, room, and branch information.
  const [resources] = await db.query(
    `SELECT
       t.id AS therapist_id,
       t.branch_id AS therapist_branch,
       t.is_active AS therapist_active,
       r.id AS room_id,
       r.branch_id AS room_branch,
       r.is_active AS room_active,
       b.open_time,
       b.close_time,
       b.is_active AS branch_active
     FROM therapists t
     JOIN branches b ON b.id = t.branch_id
     JOIN rooms r ON r.id = ?
     WHERE t.id = ?`,
    [room_id, therapist_id]
  );

  if (!resources.length) {
    return ['Therapist or room not found'];
  }

  const resource = resources[0];

  if (!resource.therapist_active) {
    problems.push('Therapist is inactive');
  }

  if (!resource.room_active) {
    problems.push('Room is inactive');
  }

  if (!resource.branch_active) {
    problems.push('Branch is inactive');
  }

  if (resource.therapist_branch !== resource.room_branch) {
    problems.push('Therapist and room must belong to the same branch');
  }

  // Rule 1: Booking must be inside branch opening hours.
  const openTime = String(resource.open_time).slice(0, 5);
const closeTime = String(resource.close_time).slice(0, 5);
if (startTime < openTime || endTime > closeTime) {
    problems.push('Booking is outside branch opening hours');
  }

  // Determine weekday: 0 = Sunday, 6 = Saturday.
  const [year, month, day] = bookingDate.split('-').map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();

  // Rule 2: Booking must fit the therapist's work schedule.
  const [schedules] = await db.query(
    `SELECT start_time, end_time
     FROM therapist_schedules
     WHERE therapist_id = ? AND day_of_week = ?`,
    [therapist_id, weekday]
  );

  const fitsSchedule = schedules.some(
    (schedule) =>
      startTime >= schedule.start_time &&
      endTime <= schedule.end_time
  );

  if (!fitsSchedule) {
    problems.push('Booking is outside therapist working hours');
  }

  // Rule 3: Therapist must not have another overlapping booking.
  let therapistSql = `
    SELECT id, start_at, end_at
    FROM bookings
    WHERE therapist_id = ?
      AND status NOT IN ('cancelled', 'no_show')
      AND start_at < ?
      AND ? < end_at
  `;

  const therapistParams = [therapist_id, end_at, start_at];

  if (ignore_booking_id) {
    therapistSql += ' AND id != ?';
    therapistParams.push(ignore_booking_id);
  }

  const [therapistBookings] = await db.query(
    therapistSql,
    therapistParams
  );

  if (therapistBookings.length) {
    problems.push('Therapist already has an overlapping booking');
  }

  // Rule 4: Room must be free, including cleaning time.
  let roomSql = `
    SELECT id, start_at, blocked_until
    FROM bookings
    WHERE room_id = ?
      AND status NOT IN ('cancelled', 'no_show')
      AND start_at < ?
      AND ? < blocked_until
  `;

  const roomParams = [room_id, blocked_until, start_at];

  if (ignore_booking_id) {
    roomSql += ' AND id != ?';
    roomParams.push(ignore_booking_id);
  }

  const [roomBookings] = await db.query(roomSql, roomParams);

  if (roomBookings.length) {
    problems.push('Room is occupied or still within cleaning time');
  }

  return problems;
};