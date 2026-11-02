# Slice Cards: who builds what

Each member owns **one slice end to end**: tables → Model → Controller → Route → frontend screen → one join report.
**Only edit your own files.** That is how we avoid Git conflicts.

File naming (the route loader depends on it):

| Layer | File name pattern | Example |
|---|---|---|
| Model | `backend/models/<name>.model.js` | `services.model.js` |
| Controller | `backend/controllers/<name>.controller.js` | `services.controller.js` |
| Route | `backend/routes/<name>.routes.js` (URL becomes `/api/<name>`) | `services.routes.js` → `/api/services` |
| Screen | `frontend/<name>.html` | `services.html` |

**Your pattern to follow:** open the `branches` files (model → controller → route → `branches.html`) and read them in that order. Every slice is the same idea with different tables.

Every member must also be able to answer: *what is a Model / Controller / Route, which status code do I return and why, and why did I pick my join type.*

---

## A: Core (Users, roles, customers)
**Tables:** `roles`, `users`, `customers`
**Join type you explain:** `INNER JOIN`

| Build | Details |
|---|---|
| Complete resource: **customers** | `GET /api/customers`, `GET /:id`, `POST`, `PUT /:id`, `DELETE /:id`. Validate: name required, phone 10–11 digits. |
| Join report | `GET /api/users/report/with-roles` → users **INNER JOIN** roles (name, email, role, active). Admin only. |
| Finish users model | `create` (hash password with `bcrypt.hashSync`), `findAll`. Login already works. |
| Screen | `customers.html` (list + add/edit form + delete). Login page already exists. |

Done when: you can add a customer from the screen, edit it, delete it, and the wrong role gets **403**.

## B: Master data (Branches, categories, services)
**Tables:** `branches`, `service_categories`, `services`
**Join type you explain:** `LEFT JOIN`

| Build | Details |
|---|---|
| `branches` | **Already provided as the reference example.** You must be able to explain it line by line. |
| Complete resource: **services** | Full CRUD. Validate: `duration_min` > 0, `price` ≥ 0, category must exist (return 400, not 500). |
| Categories | `GET /api/categories` (needed for the dropdown), `POST`. |
| Join report | `GET /api/services/report/by-category` → service_categories **LEFT JOIN** services, count per category. Must show "Hair Spa: 0" (a category with no services). |
| Screen | `services.html` (copy the idea of `branches.html`, add a category dropdown). |

## C: Transactions (Bookings, payments)
**Tables:** `bookings`, `payments`
**Join type you explain:** `INNER JOIN` (multi-table)

| Build | Details |
|---|---|
| Complete resource: **bookings** | `GET` list/by id, `POST` create, `PUT` reschedule, `DELETE` = soft cancel. |
| On create | Look up the service → compute `end_at = start + duration`, `blocked_until = end_at + cleanup_min`, `total_price`. Call `Availability.checkConflicts(...)` (Member D). If the array is not empty → **409** with the reasons. |
| Payments | `POST /api/payments` (deposit/payment), `GET /api/payments?booking_id=`. |
| Join report | `GET /api/bookings/report/details` → bookings **INNER JOIN** customers, services, therapists, rooms. |
| Screen | `bookings.html`: pick customer, service, therapist, room, date/time; shows the 409 reasons nicely. |

Until D finishes, `checkConflicts` returns `[]` (stub), so you are never blocked.

## D: Unique feature, part 1 (Scheduling rules + conflict detection)
**Tables:** `therapists`, `therapist_schedules`, `rooms`
**Join type you explain:** `LEFT JOIN`

This is the **major feature**: *automatic conflict detection across several resources (therapist + room + working hours + cleaning buffer).*

| Build | Details |
|---|---|
| Complete resource: **therapists** | Full CRUD. Rooms: `GET /api/rooms`, `POST`. |
| Replace the stub `availability.model.js` | `checkConflicts({ therapist_id, room_id, start_at, blocked_until, ignore_booking_id })`. Return an array of readable problems; empty = free. |
| The 4 rules | 1) slot is inside the branch open/close time. 2) slot is inside the therapist's schedule for that weekday. 3) therapist has no overlapping booking. 4) room has no overlapping booking **including the cleaning buffer**. Ignore bookings that are `cancelled` or `no_show`. |
| Overlap formula | Two bookings overlap when `existing.start < new.end AND new.start < existing.end`. Therapists compare against `end_at`; rooms compare against `blocked_until`. |
| **Tricky edge case to demo** | Back-to-back: therapist booked 10:00–11:00, new booking at 11:00 → **allowed** for the therapist, but the room is blocked until 11:15 → **rejected** for the room. |
| Endpoint | `GET /api/availability?date=2026-11-04&service_id=1&branch_id=1` → list of free therapist/room options. |
| Join report | `GET /api/therapists/report/utilization?date=` → therapists **LEFT JOIN** bookings (therapists with 0 bookings must still appear). |
| Screen | `availability.html`: choose date + service → see free slots. |

## E: Unique feature, part 2 (Workflow, alerts, audit)
**Tables:** `booking_status_history`, `alerts`, `audit_logs`
**Join type you explain:** `FULL OUTER JOIN`

| Build | Details |
|---|---|
| Status workflow | `PATCH /api/workflow/bookings/:id/status`. Allowed moves only: pending→confirmed/cancelled, confirmed→in_service/cancelled/no_show, in_service→completed. Anything else → **400**. Every change writes a row in `booking_status_history`. |
| Automatic rules | `POST /api/workflow/run-checks` (also run it on a timer): pending booking older than 30 min → alert; confirmed booking 15 min late → alert; 30 min late → auto `no_show`. Cancelling less than 2 hours before start → add a `cancel_fee` payment row (50% of price). |
| Complete resource: **alerts** | `GET` list, `POST` manual alert, `PATCH /:id/resolve`, `DELETE`. |
| Audit | `GET /api/audit` (admin only) shows `audit_logs`. The helper `utils/audit.js` already exists. |
| Join report | `GET /api/alerts/report/booking-alerts` → bookings **FULL OUTER JOIN** alerts (shows bookings with no alerts AND alerts with no booking). |
| Screen | `alerts.html`: alert list with a Resolve button + audit table. |

D and E share the major feature: **both must be able to explain the whole feature at a high level.**

## F: Reports (Reviews, promotions, dashboard)
**Tables:** `reviews`, `promotions`
**Join type you explain:** `RIGHT JOIN`

| Build | Details |
|---|---|
| Complete resource: **promotions** | Full CRUD. Validate: code unique, discount 1–100, `valid_from` before `valid_until`. |
| Reviews | `POST /api/reviews` (only for `completed` bookings, one per booking), `GET /api/reviews`. |
| Join report | `GET /api/reports/service-popularity` → bookings **RIGHT JOIN** services (services never booked must still show, with 0). |
| Dashboard | `GET /api/reports/dashboard`: bookings today, revenue, average rating. |
| Screen | `reports.html`: dashboard numbers + popularity table + promotions form. |

---

## Join coverage check (required by the guideline)

| Join | Who | Report |
|---|---|---|
| INNER | A, C | users + roles; booking details |
| LEFT | B, D | categories + services; therapists + bookings |
| RIGHT | F | services popularity |
| FULL OUTER | E | bookings + alerts |

All four request types (GET, POST, PUT/PATCH, DELETE) must be used by the **frontend**, not only Postman. `branches.html` already uses GET/POST/PUT/DELETE; E's resolve button covers PATCH.
