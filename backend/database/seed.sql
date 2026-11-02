-- Sample data. Users are added by setup.js because passwords must be hashed.
-- Some rows are on purpose "unmatched" so the LEFT / RIGHT / FULL OUTER join demos show something.
USE spa_booking;
INSERT INTO roles (name) VALUES ('admin'),('receptionist'),('therapist'),('customer');

INSERT INTO branches (name, address, open_time, close_time) VALUES
 ('Siquijor Main','Poblacion, Siquijor','09:00','21:00'),
 ('Larena Branch','Larena, Siquijor','10:00','20:00'),
 ('San Juan Branch','San Juan, Siquijor','10:00','18:00');   -- no rooms/therapists yet

INSERT INTO service_categories (name, description) VALUES
 ('Massage','Relaxing and therapeutic massages'),
 ('Facial','Skin care treatments'),
 ('Body Scrub','Exfoliation treatments'),
 ('Hair Spa','Hair and scalp treatments');   -- no services yet (LEFT JOIN demo)

INSERT INTO services (category_id,name,duration_min,price,cleanup_min) VALUES
 (1,'Swedish Massage 60',60,600,15),
 (1,'Deep Tissue 90',90,900,15),
 (2,'Classic Facial 45',45,500,10),
 (3,'Salt Scrub 60',60,700,20),
 (2,'Gold Facial 60',60,1200,10);          -- never booked (RIGHT JOIN demo)

INSERT INTO rooms (branch_id,name,room_type) VALUES
 (1,'Room 1','standard'),(1,'Room 2','standard'),(1,'VIP Suite','vip'),(2,'Room A','standard');

INSERT INTO therapists (branch_id,full_name,specialty) VALUES
 (1,'Ana Reyes','Massage'),(1,'Ben Cruz','Facial'),(2,'Cathy Lim','Massage'),(1,'Dan Ortiz','Body Scrub');

-- Mon-Fri 09:00-18:00 for therapists 1-3 (Dan has no schedule yet)
INSERT INTO therapist_schedules (therapist_id,day_of_week,start_time,end_time)
SELECT t.id, d.day, '09:00', '18:00'
FROM (SELECT 1 AS id UNION SELECT 2 UNION SELECT 3) t,
     (SELECT 1 AS day UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5) d;

INSERT INTO customers (full_name,phone,email) VALUES
 ('Maria Santos','09171234567','maria@mail.com'),
 ('John Dela Cruz','09181234567','john@mail.com'),
 ('Lea Tan','09191234567',NULL);

INSERT INTO promotions (code,discount_percent,valid_from,valid_until) VALUES
 ('WELCOME10',10,'2026-01-01','2026-12-31');

-- Two sample bookings (2026-11-04 is a Wednesday)
INSERT INTO bookings (customer_id,service_id,therapist_id,room_id,start_at,end_at,blocked_until,status,total_price) VALUES
 (1,1,1,1,'2026-11-04 10:00','2026-11-04 11:00','2026-11-04 11:15','confirmed',600),
 (2,3,2,2,'2026-11-04 10:30','2026-11-04 11:15','2026-11-04 11:25','pending',500);

INSERT INTO booking_status_history (booking_id,old_status,new_status,reason) VALUES
 (1,NULL,'pending','created'),(1,'pending','confirmed','deposit received'),(2,NULL,'pending','created');

-- booking_id NULL = system alert with no booking (FULL OUTER JOIN demo); booking 1 has none
INSERT INTO alerts (booking_id,type,message) VALUES
 (2,'unconfirmed_booking','Booking #2 is still pending'),
 (NULL,'system','Daily schedule check ran');
