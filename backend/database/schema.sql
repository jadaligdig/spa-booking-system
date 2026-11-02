-- SPA Booking System: 16 tables (group of 6 => minimum is 16)
-- Owner of each table is in the comment. SQLite syntax.
PRAGMA foreign_keys = ON;

-- ===== Member A: Core =====
CREATE TABLE roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE            -- admin, receptionist, therapist, customer
);

CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role_id INTEGER NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (role_id) REFERENCES roles(id)
);

CREATE TABLE customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE,              -- optional: walk-in customers have no login
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  allergies_notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ===== Member B: Master data =====
CREATE TABLE branches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  address TEXT NOT NULL,
  open_time TEXT NOT NULL DEFAULT '09:00',   -- HH:MM
  close_time TEXT NOT NULL DEFAULT '21:00',
  is_active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE service_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,                 -- Massage, Facial, Body Scrub...
  description TEXT
);

CREATE TABLE services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  duration_min INTEGER NOT NULL CHECK (duration_min > 0),
  price REAL NOT NULL CHECK (price >= 0),
  cleanup_min INTEGER NOT NULL DEFAULT 15,   -- room cleaning buffer after the service
  is_active INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (category_id) REFERENCES service_categories(id)
);

-- ===== Member D: Unique feature (resources + rules) =====
CREATE TABLE therapists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE,
  branch_id INTEGER NOT NULL,
  full_name TEXT NOT NULL,
  specialty TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (branch_id) REFERENCES branches(id)
);

CREATE TABLE therapist_schedules (            -- weekly working hours
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  therapist_id INTEGER NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),  -- 0=Sunday
  start_time TEXT NOT NULL,                   -- HH:MM
  end_time TEXT NOT NULL,
  FOREIGN KEY (therapist_id) REFERENCES therapists(id)
);

CREATE TABLE rooms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  branch_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  room_type TEXT NOT NULL DEFAULT 'standard', -- standard, couple, vip
  is_active INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (branch_id) REFERENCES branches(id)
);

-- ===== Member C: Transactions =====
CREATE TABLE bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  service_id INTEGER NOT NULL,
  therapist_id INTEGER NOT NULL,
  room_id INTEGER NOT NULL,
  start_at TEXT NOT NULL,                     -- 'YYYY-MM-DD HH:MM'
  end_at TEXT NOT NULL,                       -- start + duration (set by the system)
  blocked_until TEXT NOT NULL,                -- end + cleanup buffer (used for conflict checks)
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','confirmed','in_service','completed','cancelled','no_show')),
  total_price REAL NOT NULL DEFAULT 0,
  notes TEXT,
  created_by INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (service_id) REFERENCES services(id),
  FOREIGN KEY (therapist_id) REFERENCES therapists(id),
  FOREIGN KEY (room_id) REFERENCES rooms(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER NOT NULL,
  amount REAL NOT NULL CHECK (amount >= 0),
  method TEXT NOT NULL CHECK (method IN ('cash','card','gcash')),
  kind TEXT NOT NULL DEFAULT 'payment' CHECK (kind IN ('deposit','payment','refund','cancel_fee')),
  paid_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (booking_id) REFERENCES bookings(id)
);

-- ===== Member E: Workflow, alerts, audit =====
CREATE TABLE booking_status_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER NOT NULL,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by INTEGER,
  reason TEXT,
  changed_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (booking_id) REFERENCES bookings(id),
  FOREIGN KEY (changed_by) REFERENCES users(id)
);

CREATE TABLE alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER,                         -- NULL = system-wide alert (needed for FULL OUTER JOIN demo)
  type TEXT NOT NULL,                         -- unconfirmed_booking, late_arrival, no_show, double_booking_blocked
  message TEXT NOT NULL,
  is_resolved INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (booking_id) REFERENCES bookings(id)
);

CREATE TABLE audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action TEXT NOT NULL,                       -- CREATE, UPDATE, DELETE, LOGIN
  table_name TEXT NOT NULL,
  record_id INTEGER,
  details TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ===== Member F: Reports side =====
CREATE TABLE reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER NOT NULL UNIQUE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (booking_id) REFERENCES bookings(id)
);

CREATE TABLE promotions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  discount_percent INTEGER NOT NULL CHECK (discount_percent BETWEEN 1 AND 100),
  valid_from TEXT NOT NULL,
  valid_until TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1
);
