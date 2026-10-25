# Gym Management System — ER Diagram Specification

Database: `gym_management`  
Engine: InnoDB  
Charset: utf8mb4  
MySQL: 8.0.16 or newer (CHECK constraints are enforced)

This document is the canonical schema for later backend and frontend parts. Table names, column names, types, and relationships must be used exactly as written here.

## Normalization

The schema is in Third Normal Form (3NF):

- Each table has a single-column surrogate primary key.
- There are no repeating groups.
- Non-key attributes depend on the whole primary key (no partial dependence).
- Non-key attributes do not depend on other non-key attributes (no transitive dependence).
- Related data is not duplicated across tables; relationships are expressed only by foreign keys.

There is **no** users/admin table. Authentication is out of band (a single admin from environment variables in the backend).

---

## Entities (9 tables)

Primary keys are `INT AUTO_INCREMENT`. Foreign key columns have the **same name** as the primary key they reference.

### 1. Membership_Plan

| Column           | Type           | Constraints                                      |
|------------------|----------------|--------------------------------------------------|
| Plan_ID          | INT            | AUTO_INCREMENT PRIMARY KEY                       |
| Plan_Name        | VARCHAR(100)   | NOT NULL UNIQUE                                  |
| Duration_Months  | INT            | NOT NULL, CHECK (Duration_Months > 0)            |
| Fee              | DECIMAL(10,2)  | NOT NULL, CHECK (Fee >= 0)                       |

### 2. Member

| Column    | Type                         | Constraints        |
|-----------|------------------------------|--------------------|
| Member_ID | INT                          | AUTO_INCREMENT PK  |
| Name      | VARCHAR(100)                 | NOT NULL           |
| DOB       | DATE                         | NOT NULL           |
| Gender    | ENUM('Male','Female','Other')| NOT NULL           |
| Phone     | VARCHAR(20)                  | NOT NULL           |
| Email     | VARCHAR(150)                 | NOT NULL UNIQUE    |
| Join_Date | DATE                         | NOT NULL           |

### 3. Subscription

| Column     | Type                                     | Constraints                                      |
|------------|------------------------------------------|--------------------------------------------------|
| Sub_ID     | INT                                      | AUTO_INCREMENT PRIMARY KEY                       |
| Member_ID  | INT                                      | NOT NULL, FK -> Member(Member_ID)  ("takes")      |
| Plan_ID    | INT                                      | NOT NULL, FK -> Membership_Plan(Plan_ID) ("defines") |
| Start_Date | DATE                                     | NOT NULL                                         |
| End_Date   | DATE                                     | NOT NULL, CHECK (End_Date >= Start_Date)         |
| Status     | ENUM('Active','Expired','Cancelled')     | NOT NULL DEFAULT 'Active'                        |

### 4. Payment

| Column     | Type                                     | Constraints                                      |
|------------|------------------------------------------|--------------------------------------------------|
| Payment_ID | INT                                      | AUTO_INCREMENT PRIMARY KEY                       |
| Sub_ID     | INT                                      | NOT NULL, FK -> Subscription(Sub_ID) ("settled_by") |
| Amount     | DECIMAL(10,2)                            | NOT NULL, CHECK (Amount > 0)                     |
| Paid_On    | DATE                                     | NOT NULL                                         |
| Mode       | ENUM('Cash','Card','UPI','Net Banking')  | NOT NULL                                         |

### 5. Trainer

| Column         | Type          | Constraints                         |
|----------------|---------------|-------------------------------------|
| Trainer_ID     | INT           | AUTO_INCREMENT PRIMARY KEY          |
| Name           | VARCHAR(100)  | NOT NULL                            |
| Specialization | VARCHAR(100)  | NOT NULL                            |
| Phone          | VARCHAR(20)   | NOT NULL                            |
| Salary         | DECIMAL(10,2) | NOT NULL, CHECK (Salary >= 0)       |

### 6. Session

| Column        | Type         | Constraints                                              |
|---------------|--------------|----------------------------------------------------------|
| Session_ID    | INT          | AUTO_INCREMENT PRIMARY KEY                               |
| Member_ID     | INT          | NOT NULL, FK -> Member(Member_ID) ("books")               |
| Trainer_ID    | INT          | NOT NULL, FK -> Trainer(Trainer_ID) ("conducts")          |
| Slot_DateTime | DATETIME     | NOT NULL                                                 |
| Focus_Area    | VARCHAR(100) | NOT NULL                                                 |

Additional constraint (not a column): `UNIQUE (Trainer_ID, Slot_DateTime)` -- a trainer cannot be double-booked in the same slot.

### 7. Attendance

| Column     | Type | Constraints                                      |
|------------|------|--------------------------------------------------|
| Att_ID     | INT  | AUTO_INCREMENT PRIMARY KEY                       |
| Member_ID  | INT  | NOT NULL, FK -> Member(Member_ID) ("records")     |
| Visit_Date | DATE | NOT NULL                                         |
| Check_In   | TIME | NOT NULL                                         |
| Check_Out  | TIME | NULL until the member checks out                 |

### 8. Equipment

| Column        | Type                                                      | Constraints             |
|---------------|-----------------------------------------------------------|-------------------------|
| Equip_ID      | INT                                                       | AUTO_INCREMENT PK       |
| Name          | VARCHAR(100)                                              | NOT NULL                |
| Category      | VARCHAR(100)                                              | NOT NULL                |
| Purchase_Date | DATE                                                      | NOT NULL                |
| `Condition`   | ENUM('Excellent','Good','Fair','Poor','Out of Order')     | NOT NULL                |

`Condition` is a MySQL reserved word and must be backtick-quoted in SQL.

### 9. Maintenance_Log

| Column       | Type          | Constraints                                      |
|--------------|---------------|--------------------------------------------------|
| Log_ID       | INT           | AUTO_INCREMENT PRIMARY KEY                       |
| Equip_ID     | INT           | NOT NULL, FK -> Equipment(Equip_ID) ("undergoes") |
| Service_Date | DATE          | NOT NULL                                         |
| Cost         | DECIMAL(10,2) | NOT NULL, CHECK (Cost >= 0)                      |
| Technician   | VARCHAR(100)  | NOT NULL                                         |

---

## Relationships (7, all One-to-Many; "one" side listed first)

1. **Membership_Plan 1 --defines--> N Subscription**  
   Implemented by `Subscription.Plan_ID` -> `Membership_Plan.Plan_ID`

2. **Member 1 --takes--> N Subscription**  
   Implemented by `Subscription.Member_ID` -> `Member.Member_ID`

3. **Subscription 1 --settled_by--> N Payment**  
   Implemented by `Payment.Sub_ID` -> `Subscription.Sub_ID`

4. **Member 1 --records--> N Attendance**  
   Implemented by `Attendance.Member_ID` -> `Member.Member_ID`

5. **Member 1 --books--> N Session**  
   Implemented by `Session.Member_ID` -> `Member.Member_ID`

6. **Trainer 1 --conducts--> N Session**  
   Implemented by `Session.Trainer_ID` -> `Trainer.Trainer_ID`

7. **Equipment 1 --undergoes--> N Maintenance_Log**  
   Implemented by `Maintenance_Log.Equip_ID` -> `Equipment.Equip_ID`

All foreign keys use **ON DELETE RESTRICT** and **ON UPDATE CASCADE**.

MySQL InnoDB automatically indexes foreign key columns.

The **only** columns that are not attributes shown as entity fields on the ER diagram are these seven foreign key columns:

- `Subscription.Member_ID`
- `Subscription.Plan_ID`
- `Payment.Sub_ID`
- `Session.Member_ID`
- `Session.Trainer_ID`
- `Attendance.Member_ID`
- `Maintenance_Log.Equip_ID`

No other extra columns, tables, junction tables, auth tables, logs, or settings tables are allowed.

---

## Views, Triggers and Event

To offload application-tier calculations, enforce data integrity, and provide data-driven plan analytics and recommendations at the database layer, the schema is complemented by 21 SQL views, 8 SQL triggers, and 1 recurring MySQL event. No new tables or columns are added.

### 21 Views

#### Detail Views (`database/views.sql`)
1. **`vw_subscription_details`**: Joins `Subscription`, `Member`, `Membership_Plan`, and a derived aggregate of `Payment` (grouped by `Sub_ID`). Exposes all subscription attributes plus `Member_Name`, `Plan_Name`, `Plan_Fee`, `Amount_Paid` (`COALESCE 0`), `Days_Left` (duration for upcoming, remaining days for active, 0 for expired/cancelled), and `Display_Status`.
2. **`vw_payment_details`**: Joins `Payment`, `Subscription`, `Member`, and `Membership_Plan`. Includes all payment columns plus `Member_Name` and `Plan_Name`.
3. **`vw_session_details`**: Joins `Session`, `Member`, and `Trainer`. Includes all session columns plus `Member_Name` and `Trainer_Name`.
4. **`vw_attendance_details`**: Joins `Attendance` and `Member`. Includes all attendance columns plus `Member_Name`, full timestamp columns `Check_In_At` and `Check_Out_At`, `Attendance_State` (`'Completed'`, `'In gym'`, `'No check-out'`), and `Duration_Minutes` (computed via `TIMESTAMPDIFF` from full timestamps; time elapsed so far for in-gym visits, `NULL` for unclosed past visits).
5. **`vw_maintenance_details`**: Joins `Maintenance_Log` and `Equipment`. Includes all log columns plus `Equip_Name`.

#### Due & Alert Views (`database/views.sql`)
6. **`vw_expiring_subscriptions`**: Active subscriptions ending within 7 days (`End_Date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)`).
7. **`vw_upcoming_sessions`**: Sessions scheduled from now onward (`Slot_DateTime >= NOW()`).
8. **`vw_equipment_alerts`**: Equipment in `'Poor'` or `'Out of Order'` condition.
9. **`vw_todays_attendance`**: Attendance records checked in today (`Visit_Date = CURDATE()`).

#### Statistics Views (`database/views.sql`)
10. **`vw_revenue_last_6_months`**: Derived table of month offsets (0 to 5) left-joined with `Payment` grouped by month (`YYYY-MM`). Empty months report `0` revenue.
11. **`vw_plan_statistics`**: Groups subscriptions by plan, reporting `Total_Subscriptions` (`COUNT`), `Running_Subscriptions` (`SUM` of `CASE`), `Avg_Duration_Days` (`AVG` of `DATEDIFF`), and `Total_Revenue` via correlated scalar subquery.
12. **`vw_trainer_workload`**: Groups sessions by trainer, reporting `Total_Sessions`, `Upcoming_Sessions`, `Distinct_Members` (`COUNT DISTINCT`), `First_Session` (`MIN`), and `Last_Session` (`MAX`).
13. **`vw_member_summary`**: One row per member using scalar correlated subqueries and `EXISTS` to compute `Total_Subscriptions`, `Total_Paid`, `Visit_Count`, `Last_Visit`, and `Has_Running_Subscription` (1/0).
14. **`vw_equipment_maintenance_summary`**: Joins `Equipment` and `Maintenance_Log`, grouped by `Equip_ID` with `HAVING COUNT(*) >= 2`. Computes `Log_Count`, `Total_Cost`, `Avg_Cost`, `Max_Cost`, `First_Service`, and `Last_Service`.
15. **`vw_dashboard_summary`**: Exactly one row containing scalar subqueries for `Total_Members`, `Running_Subscriptions`, `Revenue_This_Month`, `Todays_Attendance`, and `Maintenance_Cost_This_Year`.

#### Analytics & Recommendation Views (`database/analytics.sql`)
16. **`vw_plan_profitability`**: Joins `Membership_Plan`, `Subscription`, and a derived payment table. Employs window ranking (`RANK() OVER (ORDER BY Total_Revenue DESC)`), calculating `Fee_Per_Month`, `Total_Subscriptions`, `Distinct_Members`, `Cancellation_Rate_Pct`, `Total_Revenue`, `Revenue_Per_Subscription`, `Revenue_Share_Pct`, `Revenue_Rank`, and `Gym_Insight`.
17. **`vw_visit_levels`**: Single source of truth for visit frequency thresholds and duration mapping:
    - Low: `x > -1.0 AND x <= 4.9` -> 1-month target ('Under 5 visits a month')
    - Medium: `x > 4.9 AND x <= 12.0` -> 3-month target ('5 to 12 visits a month')
    - High: `x > 12.0 AND x <= 20.0` -> 6-month target ('13 to 20 visits a month')
    - Very High: `x > 20.0 AND x <= 9999.0` -> 12-month target ('More than 20 visits a month')
    Shared identically by existing members and prospective customers.
18. **`vw_member_behavior`**: Correlated subqueries and aggregate functions per member analyzing demographics (`Age`, `Age_Band`), attendance patterns (`Total_Visits`, `Visits_Last_90_Days`, `Observed_Days` = `GREATEST(30, LEAST(90, DATEDIFF(CURDATE(), Join_Date) + 1))`, `Avg_Visits_Per_Month` = `ROUND(Visits_Last_90_Days / (Observed_Days / 30.0), 1)`), joining `vw_visit_levels` to assign `Visit_Level` and `Target_Duration_Months`, personal training activity (`Total_Sessions`), lifetime spend (`Total_Paid`), and current subscription plan (`Current_Plan_ID`, `Current_Plan_Name`, `Current_Fee_Per_Month`).
19. **`vw_level_plan_map`**: Cross joins `vw_visit_levels` with `Membership_Plan`, dynamically matching the plan with the largest `Duration_Months <= Target_Duration_Months` (or shortest plan if none is that short) via window ranking (`Level_Rank = 1 -> Is_Level_Plan = 1`).
20. **`vw_member_plan_fit`**: Joins `vw_member_behavior` with `vw_level_plan_map` on `Visit_Level`. Computes `Projected_Cost_Per_Visit`, `Monthly_Saving_Vs_Current`, `Fit_Rank` (= `Level_Rank`), `Is_Recommended` (= `Is_Level_Plan`), and dynamic `Recommendation_Reason` formatted without raw currency characters.
21. **`vw_similar_member_plans`**: Segments historical plan performance by `(Age_Band, Visit_Level)` cohort using the 4 levels from `vw_member_behavior`, calculating cohort adoption (`Members_Count`, `Subscriptions_Count`), `Completion_Rate_Pct`, average visits, average spend, and `Popularity_Rank` via window functions.

### 8 Triggers (`database/triggers.sql`)
1. **`trg_subscription_bi`** (BEFORE INSERT ON `Subscription`): Auto-expires subscriptions if `End_Date < CURDATE()`. Rejects overlapping `Active` subscriptions for the same member via `SIGNAL SQLSTATE '45000'`.
2. **`trg_subscription_bu`** (BEFORE UPDATE ON `Subscription`): Auto-expires subscriptions if `End_Date < CURDATE()`. Rejects overlapping `Active` subscriptions for the same member via `SIGNAL SQLSTATE '45000'`.
3. **`trg_payment_bi`** (BEFORE INSERT ON `Payment`): Subquery check; signals `45000` if payment is attempted for a `Cancelled` subscription.
4. **`trg_attendance_bi`** (BEFORE INSERT ON `Attendance`): Signals `45000` if `Check_Out` is not null and `Check_Out <= Check_In`.
5. **`trg_attendance_bu`** (BEFORE UPDATE ON `Attendance`): Signals `45000` if `Check_Out` is not null and `Check_Out <= Check_In`.
6. **`trg_maintenance_ai`** (AFTER INSERT ON `Maintenance_Log`): Aggregate subquery check; if an equipment item incurs >= 3 maintenance logs in 90 days, automatically updates `Equipment.Condition` to `'Out of Order'`.
7. **`trg_plan_bi`** (BEFORE INSERT ON `Membership_Plan`): Enforces that longer duration plans must cost strictly less per month than shorter plans via `SIGNAL SQLSTATE '45000'`.
8. **`trg_plan_bu`** (BEFORE UPDATE ON `Membership_Plan`): Enforces that longer duration plans must cost strictly less per month than shorter plans via `SIGNAL SQLSTATE '45000'`.

### 1 Event (`database/triggers.sql`)
- **`evt_expire_subscriptions`**: Runs `EVERY 1 HOUR STARTS CURRENT_TIMESTAMP`. Executes:
  ```sql
  UPDATE Subscription SET Status = 'Expired' WHERE Status = 'Active' AND End_Date < CURDATE();
  ```
