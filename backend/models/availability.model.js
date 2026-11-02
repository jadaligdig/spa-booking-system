// CONTRACT between Member C (bookings) and Member D (unique feature).
// Member D: replace this stub with the real conflict detection (see docs/SLICE_CARDS.md, card D).
// Member C: call it before saving any booking.
//
//   checkConflicts({ therapist_id, room_id, start_at, blocked_until, ignore_booking_id })
//   returns an array of problems, e.g. ['Therapist already booked 10:00-11:15']
//   an EMPTY array means the slot is free.
exports.checkConflicts = () => [];
