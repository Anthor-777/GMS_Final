# Gym Management System

Admin web app for running a gym: members, membership plans, subscriptions, payments, attendance, personal training sessions, trainers, equipment, and maintenance logs, plus a dashboard of key stats, aggregated reports, and database-driven plan analytics and recommendations.

There is **no users table**. A single admin is authenticated from environment variables (`ADMIN_USERNAME` + `ADMIN_PASSWORD_HASH`).

## Tech stack

| Layer | Stack |
| --- | --- |
| Database | MySQL 8.0.16+ (InnoDB, utf8mb4, CHECK constraints, Views, Triggers, Events, Window Functions) |
| Backend | Node.js 18+, Express 5, mysql2, JWT, bcryptjs |
| Frontend | React 18, Vite, React Router v6, Axios, Tailwind CSS 3.4, Framer Motion, Lucide React, Recharts |

## Prerequisites

- **Node.js 18+** and npm
- **MySQL 8.0.16+** (CHECK constraints and modern SQL features including window functions are enforced)
- A MySQL user that can create the `gym_management` database (or create it yourself, then grant access)

## Step-by-step setup

### 1. Create the database

From the project root, run the files in fresh-setup order: **schema -> triggers -> views -> analytics -> seed**. Always specify `--default-character-set=utf8mb4` to ensure UTF-8 encoding integrity without character corruption:

```bash
mysql -u root -p --default-character-set=utf8mb4 < database/schema.sql
mysql -u root -p --default-character-set=utf8mb4 < database/triggers.sql
mysql -u root -p --default-character-set=utf8mb4 < database/views.sql
mysql -u root -p --default-character-set=utf8mb4 < database/analytics.sql
mysql -u root -p --default-character-set=utf8mb4 < database/seed.sql
```

On Windows (PowerShell), if the `mysql` client is on your PATH:

```powershell
Get-Content database\schema.sql | mysql -u root -p --default-character-set=utf8mb4
Get-Content database\triggers.sql | mysql -u root -p --default-character-set=utf8mb4
Get-Content database\views.sql | mysql -u root -p --default-character-set=utf8mb4
Get-Content database\analytics.sql | mysql -u root -p --default-character-set=utf8mb4
Get-Content database\seed.sql | mysql -u root -p --default-character-set=utf8mb4
```

> **Note on Applying to an Existing Database:**
> To update an existing database without dropping existing tables, re-run `analytics.sql` using `--default-character-set=utf8mb4` (which uses `CREATE OR REPLACE VIEW`). To regenerate deterministic 4-tier attendance (5 Low, 5 Medium, 5 High, 5 Very High), re-run `seed.sql` with `--default-character-set=utf8mb4`.

#### Event Scheduler Note
The database includes an event `evt_expire_subscriptions` that marks active subscriptions with past end dates as `Expired` once every hour. MySQL 8.0 enables the event scheduler by default. To check its status:
```sql
SHOW VARIABLES LIKE 'event_scheduler';
```
Ensure `Value` is `ON`. If not, enable it via `SET GLOBAL event_scheduler = ON;` in your MySQL configuration.

### 2. Configure the backend

```bash
cd backend
copy .env.example .env
```

On macOS/Linux use `cp .env.example .env`.

Edit `backend/.env`:

```
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=gym_management
JWT_SECRET=replace_with_a_long_random_string
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=replace_with_output_of_npm_run_hash-password
CLIENT_URL=http://localhost:5173
```

`CLIENT_URL` must match the Vite origin so CORS allows the frontend.

### 3. Generate the admin password hash

```bash
cd backend
npm install
npm run hash-password -- YourPasswordHere
```

Copy the printed bcrypt hash into `ADMIN_PASSWORD_HASH` in `backend/.env`.

### 4. Run the backend

```bash
cd backend
npm install
npm run dev
```

The API listens on **http://localhost:5000**. Health check: `GET http://localhost:5000/api/health`.

### 5. Configure and run the frontend

```bash
cd frontend
copy .env.example .env
```

`frontend/.env.example` is:

```
VITE_API_URL=http://localhost:5000/api
```

Then:

```bash
cd frontend
npm install
npm run dev
```

The UI is at **http://localhost:5173**.

## Default login

Use the username from `ADMIN_USERNAME` (example file: `admin`) and the **plain password** you hashed in step 3 -- not the hash itself.

JWT tokens expire after 12 hours. The frontend stores the token in memory and `localStorage`, sends `Authorization: Bearer <token>` on every request except login, and redirects to `/login` on HTTP 401.

## Project structure

```
gym-management-system/
├── database/
│   ├── schema.sql
│   ├── triggers.sql
│   ├── views.sql
│   ├── analytics.sql
│   ├── seed.sql
│   └── er-diagram-spec.md
├── backend/
│   ├── package.json
│   ├── .env.example
│   ├── scripts/hash-password.js
│   └── src/
│       ├── server.js
│       ├── app.js
│       ├── config/db.js
│       ├── routes/
│       ├── controllers/
│       ├── middleware/
│       └── utils/
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── .env.example
│   └── src/
│       ├── api/axios.js
│       ├── context/AuthContext.jsx
│       ├── components/
│       └── pages/
├── README.md
└── .gitignore
```

## API endpoints

Base URL: `http://localhost:5000/api`

Success: `{ success: true, data }`. List success also includes `pagination: { total, page, limit, totalPages }`. Error: `{ success: false, message, errors? }`.

All routes except `POST /auth/login` and `GET /health` require `Authorization: Bearer <token>`.

| Method | Path | Description |
| --- | --- | --- |
| GET | `/health` | Liveness probe `{ status: "ok" }` (no auth) |
| POST | `/auth/login` | Body `{ username, password }` -> `{ token, username }` |
| GET | `/members` | List members (`search`, `page`, `limit`, `sortBy`, `order`) |
| GET | `/members/:id` | Get member |
| POST | `/members` | Create member (`Name`, `DOB`, `Gender`, `Phone`, `Email`, `Join_Date`) |
| PUT | `/members/:id` | Update member |
| DELETE | `/members/:id` | Delete member |
| GET | `/plans` | List membership plans (includes SQL-computed `Fee_Per_Month`) |
| GET | `/plans/:id` | Get plan (includes SQL-computed `Fee_Per_Month`) |
| POST | `/plans` | Create plan (`Plan_Name`, `Duration_Months`, `Fee`) -- verified by pricing trigger |
| PUT | `/plans/:id` | Update plan (`Plan_Name`, `Duration_Months`, `Fee`) -- verified by pricing trigger |
| DELETE | `/plans/:id` | Delete plan |
| POST | `/subscriptions/refresh-status` | Mark Active rows with `End_Date < today` as Expired (fallback) |
| GET | `/subscriptions` | List (via `vw_subscription_details` with financial calculations) |
| GET | `/subscriptions/:id` | Get subscription (via `vw_subscription_details`) |
| POST | `/subscriptions` | Create (`Member_ID`, `Plan_ID`, `Start_Date`, optional `End_Date`, optional `Status`) |
| PUT | `/subscriptions/:id` | Update (`Member_ID`, `Plan_ID`, `Start_Date`, optional `End_Date`, `Status`) |
| DELETE | `/subscriptions/:id` | Delete subscription |
| GET | `/payments` | List (via `vw_payment_details`) |
| GET | `/payments/:id` | Get payment (via `vw_payment_details`) |
| POST | `/payments` | Create (`Sub_ID`, `Amount`, `Paid_On`, `Mode`) |
| PUT | `/payments/:id` | Update payment |
| DELETE | `/payments/:id` | Delete payment |
| GET | `/attendance` | List (via `vw_attendance_details` with `Duration_Minutes`) |
| GET | `/attendance/:id` | Get attendance (via `vw_attendance_details`) |
| POST | `/attendance` | Create (`Member_ID`; `Visit_Date` / `Check_In` optional -- defaults in SQL; optional `Check_Out`) |
| PUT | `/attendance/:id` | Update (`Member_ID`, `Visit_Date`, `Check_In`, optional `Check_Out`) |
| PATCH | `/attendance/:id/checkout` | Set `Check_Out` to current time via SQL `CURTIME()` |
| DELETE | `/attendance/:id` | Delete attendance |
| GET | `/sessions` | List (via `vw_session_details`) |
| GET | `/sessions/:id` | Get session (via `vw_session_details`) |
| POST | `/sessions` | Create (`Member_ID`, `Trainer_ID`, `Slot_DateTime`, `Focus_Area`) |
| PUT | `/sessions/:id` | Update session |
| DELETE | `/sessions/:id` | Delete session |
| GET | `/trainers` | List trainers |
| GET | `/trainers/:id` | Get trainer |
| POST | `/trainers` | Create (`Name`, `Specialization`, `Phone`, `Salary`) |
| PUT | `/trainers/:id` | Update trainer |
| DELETE | `/trainers/:id` | Delete trainer |
| GET | `/equipment` | List equipment |
| GET | `/equipment/:id` | Get equipment |
| POST | `/equipment` | Create (`Name`, `Category`, `Purchase_Date`, `Condition`) |
| PUT | `/equipment/:id` | Update equipment |
| DELETE | `/equipment/:id` | Delete equipment |
| GET | `/maintenance` | List (via `vw_maintenance_details`) |
| GET | `/maintenance/:id` | Get log (via `vw_maintenance_details`) |
| POST | `/maintenance` | Create (`Equip_ID`, `Service_Date`, `Cost`, `Technician`) |
| PUT | `/maintenance/:id` | Update log |
| DELETE | `/maintenance/:id` | Delete log |
| GET | `/dashboard` | Aggregates and alerts queried entirely from database views |
| GET | `/reports` | Multi-view reporting payload `{ planStatistics, trainerWorkload, memberSummary, equipmentMaintenance }` |
| GET | `/analytics/gym` | Plan profitability and insights from `vw_plan_profitability` |
| GET | `/analytics/levels` | Visit level thresholds and target durations from `vw_visit_levels` (single source of truth) |
| GET | `/analytics/member/:id` | Behavioral profile and plan fit evaluation from `vw_member_behavior` & `vw_member_plan_fit` (plans ordered short to long) |
| GET | `/analytics/new-customer` | Prospect plan evaluation via query params `age` (10-100) and `expectedVisits` (0-100), with suggested plan, full comparison, and cohort recommendations |

List query parameters (all list endpoints): `search`, `page` (default 1), `limit` (default 10, max 1000), `sortBy` (whitelisted column), `order` (`asc` or `desc`). Use `limit=1000` to fill dropdowns.

Dates are plain strings: `YYYY-MM-DD`, `HH:MM:SS`, `YYYY-MM-DD HH:MM:SS`. The MySQL pool uses `dateStrings: true` and `charset: 'utf8mb4'`.

HTTP **409** is returned for:
- Unique key violations (`ER_DUP_ENTRY` / errno 1062)
- Foreign-key deletes (`ER_ROW_IS_REFERENCED_2` / errno 1451)
- Custom business rule violations raised by database triggers (`ER_SIGNAL_EXCEPTION` / errno 1644, including subscription overlaps, cancelled payments, check-out time errors, and plan pricing inversion)

The frontend surfaces the backend `message` in toasts for all 409 responses.

---

## Plan Recommendation Architecture

The system uses a single source of truth in the database for visit frequency thresholds and plan duration mapping:

| Visit Level | Order | Frequency Range | Target Duration | Plan Rule |
| --- | --- | --- | --- | --- |
| **Low** | 1 | Under 5 visits / month (`x <= 4.9`) | 1 month | Largest duration <= 1 mo (Monthly) |
| **Medium** | 2 | 5 to 12 visits / month (`4.9 < x <= 12.0`) | 3 months | Largest duration <= 3 mo (Quarterly) |
| **High** | 3 | 13 to 20 visits / month (`12.0 < x <= 20.0`) | 6 months | Largest duration <= 6 mo (Half-Yearly) |
| **Very High** | 4 | More than 20 visits / month (`x > 20.0`) | 12 months | Largest duration <= 12 mo (Annual) |

Both existing members (analyzed via `vw_member_behavior` & `vw_member_plan_fit`) and prospects exploring memberships (queried via `/api/analytics/new-customer`) share these identical thresholds defined inside `vw_visit_levels`. No threshold numbers are duplicated in backend code or frontend components.

---

## Schema verification checklist

Matches `database/er-diagram-spec.md` and `database/schema.sql`.

| Table | Columns | Match |
| --- | --- | --- |
| Membership_Plan | Plan_ID INT PK AI, Plan_Name VARCHAR(100) NOT NULL UNIQUE, Duration_Months INT NOT NULL CHECK > 0, Fee DECIMAL(10,2) NOT NULL CHECK >= 0 | Yes |
| Member | Member_ID INT PK AI, Name VARCHAR(100) NOT NULL, DOB DATE NOT NULL, Gender ENUM(Male,Female,Other) NOT NULL, Phone VARCHAR(20) NOT NULL, Email VARCHAR(150) NOT NULL UNIQUE, Join_Date DATE NOT NULL | Yes |
| Subscription | Sub_ID INT PK AI, Member_ID INT NOT NULL FK, Plan_ID INT NOT NULL FK, Start_Date DATE NOT NULL, End_Date DATE NOT NULL CHECK >= Start_Date, Status ENUM(Active,Expired,Cancelled) NOT NULL DEFAULT Active | Yes |
| Payment | Payment_ID INT PK AI, Sub_ID INT NOT NULL FK, Amount DECIMAL(10,2) NOT NULL CHECK > 0, Paid_On DATE NOT NULL, Mode ENUM(Cash,Card,UPI,Net Banking) NOT NULL | Yes |
| Trainer | Trainer_ID INT PK AI, Name VARCHAR(100) NOT NULL, Specialization VARCHAR(100) NOT NULL, Phone VARCHAR(20) NOT NULL, Salary DECIMAL(10,2) NOT NULL CHECK >= 0 | Yes |
| Session | Session_ID INT PK AI, Member_ID INT NOT NULL FK, Trainer_ID INT NOT NULL FK, Slot_DateTime DATETIME NOT NULL, Focus_Area VARCHAR(100) NOT NULL; UNIQUE (Trainer_ID, Slot_DateTime) | Yes |
| Attendance | Att_ID INT PK AI, Member_ID INT NOT NULL FK, Visit_Date DATE NOT NULL, Check_In TIME NOT NULL, Check_Out TIME NULL | Yes |
| Equipment | Equip_ID INT PK AI, Name VARCHAR(100) NOT NULL, Category VARCHAR(100) NOT NULL, Purchase_Date DATE NOT NULL, Condition ENUM(Excellent,Good,Fair,Poor,Out of Order) NOT NULL | Yes |
| Maintenance_Log | Log_ID INT PK AI, Equip_ID INT NOT NULL FK, Service_Date DATE NOT NULL, Cost DECIMAL(10,2) NOT NULL CHECK >= 0, Technician VARCHAR(100) NOT NULL | Yes |

Relationships (all 1:N, ON DELETE RESTRICT, ON UPDATE CASCADE):

1. Membership_Plan defines Subscription (`Subscription.Plan_ID`)
2. Member takes Subscription (`Subscription.Member_ID`)
3. Subscription settled_by Payment (`Payment.Sub_ID`)
4. Member records Attendance (`Attendance.Member_ID`)
5. Member books Session (`Session.Member_ID`)
6. Trainer conducts Session (`Session.Trainer_ID`)
7. Equipment undergoes Maintenance_Log (`Maintenance_Log.Equip_ID`)

The only columns that are not entity attributes on the ER diagram are those seven foreign keys. There are exactly 9 tables; no auth/users/junction extras.

---

## Views, Triggers and Event checklist

### 21 Views

| # | View Name | File | SQL Concepts | Purpose |
|---|---|---|---|---|
| 1 | `vw_subscription_details` | `views.sql` | JOIN, SUBQUERY, AGGREGATE | Subscription details with `Member_Name`, `Plan_Name`, `Plan_Fee`, `Amount_Paid`, `Days_Left`, `Display_Status` |
| 2 | `vw_payment_details` | `views.sql` | JOIN | Payment details with `Member_Name`, `Plan_Name` |
| 3 | `vw_session_details` | `views.sql` | JOIN | Personal training sessions with `Member_Name`, `Trainer_Name` |
| 4 | `vw_attendance_details` | `views.sql` | JOIN | Attendance records with `Member_Name`, `Check_In_At`, `Check_Out_At`, `Attendance_State`, `Duration_Minutes` |
| 5 | `vw_maintenance_details` | `views.sql` | JOIN | Maintenance logs with `Equip_Name` |
| 6 | `vw_expiring_subscriptions` | `views.sql` | JOIN | Active subscriptions ending within 7 days |
| 7 | `vw_upcoming_sessions` | `views.sql` | JOIN | Sessions from current time onward (`Slot_DateTime >= NOW()`) |
| 8 | `vw_equipment_alerts` | `views.sql` | FILTER | Equipment in `'Poor'` or `'Out of Order'` condition |
| 9 | `vw_todays_attendance` | `views.sql` | JOIN | Check-ins for `CURDATE()` |
| 10 | `vw_revenue_last_6_months` | `views.sql` | AGGREGATE, SUBQUERY, JOIN | Revenue grouped across the last 6 months (zero-filled for empty months) |
| 11 | `vw_plan_statistics` | `views.sql` | AGGREGATE, JOIN, CORRELATED SUBQUERY | Plan performance: total subs, running subs, average duration, and total revenue |
| 12 | `vw_trainer_workload` | `views.sql` | AGGREGATE, JOIN | Trainer metrics: total sessions, upcoming sessions, distinct members, first/last sessions |
| 13 | `vw_member_summary` | `views.sql` | CORRELATED SUBQUERIES, EXISTS, AGGREGATE | Per-member summary: total subs, total paid, visit count, last visit, running sub status |
| 14 | `vw_equipment_maintenance_summary` | `views.sql` | AGGREGATE, HAVING, JOIN | Equipment with `>= 2` maintenance logs: total cost, avg cost, max cost, service date range |
| 15 | `vw_dashboard_summary` | `views.sql` | SUBQUERIES, AGGREGATE | Single row summary: total members, running subscriptions, revenue this month, today's attendance, yearly maintenance |
| 16 | `vw_plan_profitability` | `analytics.sql` | JOIN, AGGREGATE, SUBQUERY, WINDOW | Plan profitability with `Fee_Per_Month`, `Cancellation_Rate_Pct`, `Total_Revenue`, `Revenue_Share_Pct`, `Revenue_Rank`, `Gym_Insight` |
| 17 | `vw_visit_levels` | `analytics.sql` | DERIVED TABLE, UNION ALL | Single source of truth for visit frequency thresholds and target durations (Low, Medium, High, Very High) |
| 18 | `vw_member_behavior` | `analytics.sql` | CORRELATED SUBQUERIES, AGGREGATE, JOIN | Behavioral profile per member: demographics (`Age_Band`), attendance patterns (`Observed_Days`, `Avg_Visits_Per_Month`), joined with `vw_visit_levels` |
| 19 | `vw_level_plan_map` | `analytics.sql` | JOIN, CROSS JOIN, WINDOW | Maps each visit level to candidate plans, dynamically selecting the largest duration <= target duration via `ROW_NUMBER()` |
| 20 | `vw_member_plan_fit` | `analytics.sql` | JOIN, WINDOW, CASE | Detailed plan fit evaluation per member joining `vw_level_plan_map`, with `Fit_Rank`, `Is_Recommended`, and clean text reasons |
| 21 | `vw_similar_member_plans` | `analytics.sql` | JOIN, AGGREGATE, WINDOW | Popularity and retention rankings of plans partitioned by `(Age_Band, Visit_Level)` cohort |

### 8 Triggers (`database/triggers.sql`)

| # | Trigger Name | Timing / Event / Table | SQLSTATE | Purpose |
|---|---|---|---|---|
| 1 | `trg_subscription_bi` | BEFORE INSERT ON Subscription | 45000 | Auto-expires subscriptions if `End_Date < CURDATE()`; rejects overlapping `Active` subscriptions per member |
| 2 | `trg_subscription_bu` | BEFORE UPDATE ON Subscription | 45000 | Auto-expires subscriptions if `End_Date < CURDATE()`; rejects overlapping `Active` subscriptions per member |
| 3 | `trg_payment_bi` | BEFORE INSERT ON Payment | 45000 | Rejects payment entries against `Cancelled` subscriptions |
| 4 | `trg_attendance_bi` | BEFORE INSERT ON Attendance | 45000 | Rejects check-in / check-out pairs where `Check_Out <= Check_In` |
| 5 | `trg_attendance_bu` | BEFORE UPDATE ON Attendance | 45000 | Rejects check-in / check-out pairs where `Check_Out <= Check_In` |
| 6 | `trg_maintenance_ai` | AFTER INSERT ON Maintenance_Log | -- | Automatically flags equipment as `'Out of Order'` upon 3rd log within 90 days |
| 7 | `trg_plan_bi` | BEFORE INSERT ON Membership_Plan | 45000 | Enforces that longer duration plans must cost strictly less per month than shorter plans |
| 8 | `trg_plan_bu` | BEFORE UPDATE ON Membership_Plan | 45000 | Enforces that longer duration plans must cost strictly less per month than shorter plans |

### 1 Event (`database/triggers.sql`)

| Event Name | Schedule | Purpose |
|---|---|---|
| `evt_expire_subscriptions` | `EVERY 1 HOUR STARTS CURRENT_TIMESTAMP` | Sets `Status = 'Expired'` for subscriptions where `Status = 'Active'` and `End_Date < CURDATE()` |
