-- SPA Booking System: 16 tables (group of 6 => minimum is 16)
CREATE DATABASE IF NOT EXISTS spa_booking;
USE spa_booking;

-- ===== Member A: Core =====
CREATE TABLE roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE            -- admin, receptionist, therapist, customer
);

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  role_id INT NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  is_active INT NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id)
);

CREATE TABLE customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNIQUE,              -- optional: walk-in customers have no login
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  allergies_notes VARCHAR(255),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ===== Member B: Master data =====
CREATE TABLE branches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  address VARCHAR(255) NOT NULL,
  open_time VARCHAR(255) NOT NULL DEFAULT '09:00',   -- HH:MM
  close_time VARCHAR(255) NOT NULL DEFAULT '21:00',
  is_active INT NOT NULL DEFAULT 1
);

CREATE TABLE service_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,                 -- Massage, Facial, Body Scrub...
  description VARCHAR(255)
);

CREATE TABLE services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  duration_min INT NOT NULL CHECK (duration_min > 0),
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  cleanup_min INT NOT NULL DEFAULT 15,   -- room cleaning buffer after the service
  is_active INT NOT NULL DEFAULT 1,
  FOREIGN KEY (category_id) REFERENCES service_categories(id)
);

-- ===== Member D: Unique feature (resources + rules) =====
CREATE TABLE therapists (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNIQUE,
  branch_id INT NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  specialty VARCHAR(255),
  is_active INT NOT NULL DEFAULT 1,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (branch_id) REFERENCES branches(id)
);

CREATE TABLE therapist_schedules (            -- weekly working hours
  id INT AUTO_INCREMENT PRIMARY KEY,
  therapist_id INT NOT NULL,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),  -- 0=Sunday
  start_time VARCHAR(255) NOT NULL,                   -- HH:MM
  end_time VARCHAR(255) NOT NULL,
  FOREIGN KEY (therapist_id) REFERENCES therapists(id)
);

CREATE TABLE rooms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  branch_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  room_type VARCHAR(255) NOT NULL DEFAULT 'standard', -- standard, couple, vip
  is_active INT NOT NULL DEFAULT 1,
  FOREIGN KEY (branch_id) REFERENCES branches(id)
);

-- ===== Member C: Transactions =====
CREATE TABLE bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  service_id INT NOT NULL,
  therapist_id INT NOT NULL,
  room_id INT NOT NULL,
  start_at VARCHAR(255) NOT NULL,                     -- 'YYYY-MM-DD HH:MM'
  end_at VARCHAR(255) NOT NULL,                       -- start + duration (set by the system)
  blocked_until VARCHAR(255) NOT NULL,                -- end + cleanup buffer (used for conflict checks)
  status VARCHAR(255) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','confirmed','in_service','completed','cancelled','no_show')),
  total_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  notes VARCHAR(255),
  created_by INT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (service_id) REFERENCES services(id),
  FOREIGN KEY (therapist_id) REFERENCES therapists(id),
  FOREIGN KEY (room_id) REFERENCES rooms(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  method VARCHAR(255) NOT NULL CHECK (method IN ('cash','card','gcash')),
  kind VARCHAR(255) NOT NULL DEFAULT 'payment' CHECK (kind IN ('deposit','payment','refund','cancel_fee')),
  paid_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id)
);

-- ===== Member E: Workflow, alerts, audit =====
CREATE TABLE booking_status_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  old_status VARCHAR(255),
  new_status VARCHAR(255) NOT NULL,
  changed_by INT,
  reason VARCHAR(255),
  changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id),
  FOREIGN KEY (changed_by) REFERENCES users(id)
);

CREATE TABLE alerts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT,                         -- NULL = system-wide alert (needed for FULL OUTER JOIN demo)
  type VARCHAR(255) NOT NULL,                         -- unconfirmed_booking, late_arrival, no_show, double_booking_blocked
  message VARCHAR(255) NOT NULL,
  is_resolved INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id)
);

CREATE TABLE audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  action VARCHAR(255) NOT NULL,                       -- CREATE, UPDATE, DELETE, LOGIN
  table_name VARCHAR(255) NOT NULL,
  record_id INT,
  details VARCHAR(255),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ===== Member F: Reports side =====
CREATE TABLE reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL UNIQUE,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment VARCHAR(255),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id)
);

CREATE TABLE promotions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(255) NOT NULL UNIQUE,
  discount_percent INT NOT NULL CHECK (discount_percent BETWEEN 1 AND 100),
  valid_from VARCHAR(255) NOT NULL,
  valid_until VARCHAR(255) NOT NULL,
  is_active INT NOT NULL DEFAULT 1
);
