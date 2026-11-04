# Finish the Team Deliverables (about 30 minutes, split between members)

Put these three files from the download into the repo's `docs/` folder: `er-diagram.png`, `list-endpoints.js`, and this file. Commit them on a branch like any other change.

---

## 1. ER diagram (5 minutes, one person)

1. Copy `er-diagram.png` into `docs/`.
2. **Check it against your real MySQL schema.** The diagram was drawn from the 16-table design in the starter. Open the schema file the team actually runs in `backend/database/` and compare table and column names. If a teammate renamed or added a column, tell the group, and edit the diagram.
3. In `README.md`, add under the title:

```
## ER diagram
![ER diagram](docs/er-diagram.png)
```

GitHub can also draw the diagram from text. Paste this block into `README.md` as an alternative, or use both:

```mermaid
erDiagram
    roles ||--o{ users : "role_id"
    users ||--o{ customers : "user_id"
    service_categories ||--o{ services : "category_id"
    users ||--o{ therapists : "user_id"
    branches ||--o{ therapists : "branch_id"
    therapists ||--o{ therapist_schedules : "therapist_id"
    branches ||--o{ rooms : "branch_id"
    customers ||--o{ bookings : "customer_id"
    services ||--o{ bookings : "service_id"
    therapists ||--o{ bookings : "therapist_id"
    rooms ||--o{ bookings : "room_id"
    users ||--o{ bookings : "created_by"
    bookings ||--o{ payments : "booking_id"
    bookings ||--o{ booking_status_history : "booking_id"
    users ||--o{ booking_status_history : "changed_by"
    bookings ||--o{ alerts : "booking_id"
    users ||--o{ audit_logs : "user_id"
    bookings ||--o{ reviews : "booking_id"
    roles {
        INTEGER id PK
        TEXT name
    }
    users {
        INTEGER id PK
        INTEGER role_id FK
        TEXT email
        TEXT password_hash
        TEXT full_name
        INTEGER is_active
        TEXT created_at
    }
    customers {
        INTEGER id PK
        INTEGER user_id FK
        TEXT full_name
        TEXT phone
        TEXT email
        TEXT allergies_notes
        TEXT created_at
    }
    branches {
        INTEGER id PK
        TEXT name
        TEXT address
        TEXT open_time
        TEXT close_time
        INTEGER is_active
    }
    service_categories {
        INTEGER id PK
        TEXT name
        TEXT description
    }
    services {
        INTEGER id PK
        INTEGER category_id FK
        TEXT name
        INTEGER duration_min
        REAL price
        INTEGER cleanup_min
        INTEGER is_active
    }
    therapists {
        INTEGER id PK
        INTEGER user_id FK
        INTEGER branch_id FK
        TEXT full_name
        TEXT specialty
        INTEGER is_active
    }
    therapist_schedules {
        INTEGER id PK
        INTEGER therapist_id FK
        INTEGER day_of_week
        TEXT start_time
        TEXT end_time
    }
    rooms {
        INTEGER id PK
        INTEGER branch_id FK
        TEXT name
        TEXT room_type
        INTEGER is_active
    }
    bookings {
        INTEGER id PK
        INTEGER customer_id FK
        INTEGER service_id FK
        INTEGER therapist_id FK
        INTEGER room_id FK
        TEXT start_at
        TEXT end_at
        TEXT blocked_until
        TEXT status
        REAL total_price
        TEXT notes
        INTEGER created_by FK
        TEXT created_at
    }
    payments {
        INTEGER id PK
        INTEGER booking_id FK
        REAL amount
        TEXT method
        TEXT kind
        TEXT paid_at
    }
    booking_status_history {
        INTEGER id PK
        INTEGER booking_id FK
        TEXT old_status
        TEXT new_status
        INTEGER changed_by FK
        TEXT reason
        TEXT changed_at
    }
    alerts {
        INTEGER id PK
        INTEGER booking_id FK
        TEXT type
        TEXT message
        INTEGER is_resolved
        TEXT created_at
    }
    audit_logs {
        INTEGER id PK
        INTEGER user_id FK
        TEXT action
        TEXT table_name
        INTEGER record_id
        TEXT details
        TEXT created_at
    }
    reviews {
        INTEGER id PK
        INTEGER booking_id FK
        INTEGER rating
        TEXT comment
        TEXT created_at
    }
    promotions {
        INTEGER id PK
        TEXT code
        INTEGER discount_percent
        TEXT valid_from
        TEXT valid_until
        INTEGER is_active
    }
```

---

## 2. Endpoint list (5 minutes, after everyone has merged their routes)

1. Everyone pulls `main` first, so every `*.routes.js` file is on your computer.
2. In the terminal, at the project root (the folder containing `backend`, not inside it):

```
node docs/list-endpoints.js
```

3. It prints a table (Method, URL, who can use it, handler). Copy it and paste it into `README.md` under a heading `## Endpoints`, replacing the planned table.
4. Add the join reports by hand in a short list (which endpoint, which join type, which member):

| Join | Endpoint | Member |
|---|---|---|
| INNER | `GET /api/users/report/with-roles` | A |
| LEFT | `GET /api/services/report/by-category` | B |
| INNER | `GET /api/bookings/report/details` | C |
| LEFT | `GET /api/therapists/report/utilization` | D |
| FULL OUTER | `GET /api/alerts/report/booking-alerts` | E |
| RIGHT | `GET /api/reports/service-popularity` | F |

Edit the URLs to match what each member really built. The script only reads route files, so a route that isn't merged yet won't appear.

---

## 3. How to run it with MySQL (paste into README.md)

Everything below assumes the team database is MySQL. **Check two things before you paste it:** the database name your team uses, and the variable names in `backend/.env.example`. Replace the placeholders.

```markdown
## How to run (MySQL)

### One-time setup
1. Install Node.js 24 LTS and MySQL (XAMPP is fine: start **MySQL** in the XAMPP Control Panel).
2. Clone the repo and open a terminal in the `backend` folder:
   ```
   npm install
   copy .env.example .env
   ```
3. Open `.env` and fill in the values shown in `.env.example` (database name, user, password).
   With XAMPP the user is usually `root` and the password is empty.
4. Create the database and load the tables and sample data. Use **one** of these:
   - **phpMyAdmin** (http://localhost/phpmyadmin): New → database name `spa_booking` → Create → Import → choose
     `backend/database/schema.sql` → Go, then the same for `backend/database/seed.sql`.
   - **Command line** (XAMPP: `C:\xampp\mysql\bin`):
     ```
     mysql -u root -p -e "CREATE DATABASE spa_booking"
     mysql -u root -p spa_booking < database/schema.sql
     mysql -u root -p spa_booking < database/seed.sql
     ```
5. Create the demo users if the project has a script for it (for example `npm run setup`). Otherwise use the login created by the seed data.

### Every day
```
cd backend
npm run dev
```
Open http://localhost:3000 and log in with the demo account listed in the README.
```

If a teammate still has the old SQLite file (`spa.db`), they can delete it. It is not used anymore.

---

## 4. FULL OUTER JOIN in MySQL (Member E)

MySQL has no `FULL OUTER JOIN` keyword. The standard replacement is a `LEFT JOIN` joined by `UNION` to a `RIGHT JOIN`. This shape was tested (SQLite accepts the same syntax) and returns a booking with no alert, an alert with no booking, and matched pairs:

```sql
SELECT b.id AS booking_id, b.status, a.id AS alert_id, a.type
FROM bookings b LEFT JOIN alerts a ON a.booking_id = b.id
UNION
SELECT b.id, b.status, a.id, a.type
FROM bookings b RIGHT JOIN alerts a ON a.booking_id = b.id
```

`UNION` (not `UNION ALL`) removes the duplicate rows for bookings that do have alerts. Be ready to explain this at the defense: "MySQL doesn't support FULL OUTER JOIN, so I combined a LEFT and a RIGHT JOIN."

---

## 5. Final checklist before the deadline

- [ ] README: roster and ownership matrix (done), how to run (MySQL), ER diagram, endpoint list, join report list
- [ ] SQL script(s) in `backend/database/` (schema and seed), plus `.env.example` committed, no `.env`
- [ ] Every member: at least one merged pull request and at least one review given
- [ ] `git shortlog -sne --no-merges --all` shows all 6 members, with matching GitHub emails
- [ ] Everything merged into `main`, and `main` runs on a fresh clone (try it on one other laptop)
- [ ] Each member has rehearsed their defense: one file explained line by line, plus one live change
