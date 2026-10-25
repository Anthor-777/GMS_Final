SET NAMES utf8mb4;
USE gym_management;

-- =============================================================================
-- DETAIL VIEWS
-- =============================================================================

-- 1. vw_subscription_details [JOIN, SUBQUERY, AGGREGATE]
CREATE OR REPLACE VIEW `vw_subscription_details` AS
SELECT
  s.Sub_ID,
  s.Member_ID,
  s.Plan_ID,
  s.Start_Date,
  s.End_Date,
  s.Status,
  m.Name AS Member_Name,
  p.Plan_Name,
  p.Fee AS Plan_Fee,
  COALESCE(paid_summary.Paid, 0) AS Amount_Paid,
  CASE
    WHEN s.Status = 'Active' AND s.Start_Date > CURDATE() THEN DATEDIFF(s.End_Date, s.Start_Date)
    WHEN s.Status = 'Active' AND s.Start_Date <= CURDATE() AND s.End_Date >= CURDATE() THEN DATEDIFF(s.End_Date, CURDATE())
    ELSE 0
  END AS Days_Left,
  CASE
    WHEN s.Status = 'Active' AND s.End_Date < CURDATE() THEN 'Expired'
    WHEN s.Status = 'Active' AND s.Start_Date > CURDATE() THEN 'Upcoming'
    ELSE s.Status
  END AS Display_Status
FROM `Subscription` s
INNER JOIN `Member` m ON m.Member_ID = s.Member_ID
INNER JOIN `Membership_Plan` p ON p.Plan_ID = s.Plan_ID
LEFT JOIN (
  SELECT Sub_ID, SUM(Amount) AS Paid
  FROM `Payment`
  GROUP BY Sub_ID
) paid_summary ON paid_summary.Sub_ID = s.Sub_ID;

-- 2. vw_payment_details [JOIN]
CREATE OR REPLACE VIEW `vw_payment_details` AS
SELECT
  pay.Payment_ID,
  pay.Sub_ID,
  pay.Amount,
  pay.Paid_On,
  pay.Mode,
  m.Name AS Member_Name,
  p.Plan_Name
FROM `Payment` pay
INNER JOIN `Subscription` s ON s.Sub_ID = pay.Sub_ID
INNER JOIN `Member` m ON m.Member_ID = s.Member_ID
INNER JOIN `Membership_Plan` p ON p.Plan_ID = s.Plan_ID;

-- 3. vw_session_details [JOIN]
CREATE OR REPLACE VIEW `vw_session_details` AS
SELECT
  sess.Session_ID,
  sess.Member_ID,
  sess.Trainer_ID,
  sess.Slot_DateTime,
  sess.Focus_Area,
  m.Name AS Member_Name,
  t.Name AS Trainer_Name
FROM `Session` sess
INNER JOIN `Member` m ON m.Member_ID = sess.Member_ID
INNER JOIN `Trainer` t ON t.Trainer_ID = sess.Trainer_ID;

-- 4. vw_attendance_details [JOIN]
CREATE OR REPLACE VIEW `vw_attendance_details` AS
SELECT
  a.Att_ID,
  a.Member_ID,
  a.Visit_Date,
  a.Check_In,
  a.Check_Out,
  m.Name AS Member_Name,
  TIMESTAMP(a.Visit_Date, a.Check_In) AS Check_In_At,
  CASE
    WHEN a.Check_Out IS NULL THEN NULL
    ELSE TIMESTAMP(a.Visit_Date, a.Check_Out)
  END AS Check_Out_At,
  CASE
    WHEN a.Check_Out IS NOT NULL THEN 'Completed'
    WHEN a.Visit_Date = CURDATE() THEN 'In gym'
    ELSE 'No check-out'
  END AS Attendance_State,
  CASE
    WHEN a.Check_Out IS NOT NULL THEN TIMESTAMPDIFF(MINUTE, TIMESTAMP(a.Visit_Date, a.Check_In), TIMESTAMP(a.Visit_Date, a.Check_Out))
    WHEN a.Visit_Date = CURDATE() THEN GREATEST(0, TIMESTAMPDIFF(MINUTE, TIMESTAMP(a.Visit_Date, a.Check_In), NOW()))
    ELSE NULL
  END AS Duration_Minutes
FROM `Attendance` a
INNER JOIN `Member` m ON m.Member_ID = a.Member_ID;

-- 5. vw_maintenance_details [JOIN]
CREATE OR REPLACE VIEW `vw_maintenance_details` AS
SELECT
  ml.Log_ID,
  ml.Equip_ID,
  ml.Service_Date,
  ml.Cost,
  ml.Technician,
  e.Name AS Equip_Name
FROM `Maintenance_Log` ml
INNER JOIN `Equipment` e ON e.Equip_ID = ml.Equip_ID;

-- =============================================================================
-- DUE / ALERT VIEWS
-- =============================================================================

-- 6. vw_expiring_subscriptions [JOIN]
CREATE OR REPLACE VIEW `vw_expiring_subscriptions` AS
SELECT
  s.Sub_ID,
  s.Member_ID,
  m.Name AS Member_Name,
  p.Plan_Name,
  s.Start_Date,
  s.End_Date,
  DATEDIFF(s.End_Date, CURDATE()) AS Days_Left
FROM `Subscription` s
INNER JOIN `Member` m ON m.Member_ID = s.Member_ID
INNER JOIN `Membership_Plan` p ON p.Plan_ID = s.Plan_ID
WHERE s.Status = 'Active'
  AND s.End_Date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY);

-- 7. vw_upcoming_sessions [JOIN]
CREATE OR REPLACE VIEW `vw_upcoming_sessions` AS
SELECT
  sess.Session_ID,
  m.Name AS Member_Name,
  t.Name AS Trainer_Name,
  sess.Slot_DateTime,
  sess.Focus_Area
FROM `Session` sess
INNER JOIN `Member` m ON m.Member_ID = sess.Member_ID
INNER JOIN `Trainer` t ON t.Trainer_ID = sess.Trainer_ID
WHERE sess.Slot_DateTime >= NOW();

-- 8. vw_equipment_alerts
CREATE OR REPLACE VIEW `vw_equipment_alerts` AS
SELECT
  Equip_ID,
  Name,
  Category,
  `Condition`
FROM `Equipment`
WHERE `Condition` IN ('Poor', 'Out of Order');

-- 9. vw_todays_attendance [JOIN]
CREATE OR REPLACE VIEW `vw_todays_attendance` AS
SELECT
  a.Att_ID,
  m.Name AS Member_Name,
  a.Check_In,
  a.Check_Out
FROM `Attendance` a
INNER JOIN `Member` m ON m.Member_ID = a.Member_ID
WHERE a.Visit_Date = CURDATE();

-- =============================================================================
-- STATISTICS & REPORT VIEWS
-- =============================================================================

-- 10. vw_revenue_last_6_months [AGGREGATE, SUBQUERY, JOIN]
CREATE OR REPLACE VIEW `vw_revenue_last_6_months` AS
SELECT
  DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL offsets.n MONTH), '%Y-%m') AS `Month`,
  COALESCE(SUM(p.Amount), 0) AS `Revenue`
FROM (
  SELECT 0 AS n UNION ALL
  SELECT 1 UNION ALL
  SELECT 2 UNION ALL
  SELECT 3 UNION ALL
  SELECT 4 UNION ALL
  SELECT 5
) AS offsets
LEFT JOIN `Payment` p
  ON DATE_FORMAT(p.Paid_On, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL offsets.n MONTH), '%Y-%m')
GROUP BY DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL offsets.n MONTH), '%Y-%m');

-- 11. vw_plan_statistics [AGGREGATE, JOIN, CORRELATED SUBQUERY]
CREATE OR REPLACE VIEW `vw_plan_statistics` AS
SELECT
  p.Plan_ID,
  p.Plan_Name,
  p.Fee,
  COUNT(s.Sub_ID) AS Total_Subscriptions,
  COALESCE(SUM(CASE WHEN s.Status = 'Active' AND s.Start_Date <= CURDATE() AND s.End_Date >= CURDATE() THEN 1 ELSE 0 END), 0) AS Running_Subscriptions,
  COALESCE(ROUND(AVG(DATEDIFF(s.End_Date, s.Start_Date)), 1), 0) AS Avg_Duration_Days,
  COALESCE((
    SELECT SUM(pay.Amount)
    FROM `Payment` pay
    INNER JOIN `Subscription` sub ON sub.Sub_ID = pay.Sub_ID
    WHERE sub.Plan_ID = p.Plan_ID
  ), 0) AS Total_Revenue
FROM `Membership_Plan` p
LEFT JOIN `Subscription` s ON s.Plan_ID = p.Plan_ID
GROUP BY p.Plan_ID, p.Plan_Name, p.Fee;

-- 12. vw_trainer_workload [AGGREGATE, JOIN]
CREATE OR REPLACE VIEW `vw_trainer_workload` AS
SELECT
  t.Trainer_ID,
  t.Name,
  t.Specialization,
  COUNT(sess.Session_ID) AS Total_Sessions,
  COALESCE(SUM(CASE WHEN sess.Slot_DateTime >= NOW() THEN 1 ELSE 0 END), 0) AS Upcoming_Sessions,
  COUNT(DISTINCT sess.Member_ID) AS Distinct_Members,
  MIN(sess.Slot_DateTime) AS First_Session,
  MAX(sess.Slot_DateTime) AS Last_Session
FROM `Trainer` t
LEFT JOIN `Session` sess ON sess.Trainer_ID = t.Trainer_ID
GROUP BY t.Trainer_ID, t.Name, t.Specialization;

-- 13. vw_member_summary [CORRELATED SUBQUERIES, EXISTS, AGGREGATE]
CREATE OR REPLACE VIEW `vw_member_summary` AS
SELECT
  m.Member_ID,
  m.Name,
  (SELECT COUNT(*) FROM `Subscription` s WHERE s.Member_ID = m.Member_ID) AS Total_Subscriptions,
  COALESCE((
    SELECT SUM(p.Amount)
    FROM `Payment` p
    INNER JOIN `Subscription` s ON s.Sub_ID = p.Sub_ID
    WHERE s.Member_ID = m.Member_ID
  ), 0) AS Total_Paid,
  (SELECT COUNT(*) FROM `Attendance` a WHERE a.Member_ID = m.Member_ID) AS Visit_Count,
  (SELECT MAX(a.Visit_Date) FROM `Attendance` a WHERE a.Member_ID = m.Member_ID) AS Last_Visit,
  CASE
    WHEN EXISTS(
      SELECT 1
      FROM `Subscription` s
      WHERE s.Member_ID = m.Member_ID
        AND s.Status = 'Active'
        AND s.Start_Date <= CURDATE()
        AND s.End_Date >= CURDATE()
    ) THEN 1
    ELSE 0
  END AS Has_Running_Subscription
FROM `Member` m;

-- 14. vw_equipment_maintenance_summary [AGGREGATE, HAVING, JOIN]
CREATE OR REPLACE VIEW `vw_equipment_maintenance_summary` AS
SELECT
  e.Equip_ID,
  e.Name,
  e.`Condition`,
  COUNT(ml.Log_ID) AS Log_Count,
  SUM(ml.Cost) AS Total_Cost,
  ROUND(AVG(ml.Cost), 2) AS Avg_Cost,
  MAX(ml.Cost) AS Max_Cost,
  MIN(ml.Service_Date) AS First_Service,
  MAX(ml.Service_Date) AS Last_Service
FROM `Equipment` e
INNER JOIN `Maintenance_Log` ml ON ml.Equip_ID = e.Equip_ID
GROUP BY e.Equip_ID, e.Name, e.`Condition`
HAVING COUNT(*) >= 2;

-- 15. vw_dashboard_summary [SUBQUERIES, AGGREGATE]
CREATE OR REPLACE VIEW `vw_dashboard_summary` AS
SELECT
  (SELECT COUNT(*) FROM `Member`) AS Total_Members,
  (SELECT COUNT(*) FROM `Subscription` WHERE `Status` = 'Active' AND `Start_Date` <= CURDATE() AND `End_Date` >= CURDATE()) AS Running_Subscriptions,
  (SELECT COALESCE(SUM(`Amount`), 0) FROM `Payment` WHERE YEAR(`Paid_On`) = YEAR(CURDATE()) AND MONTH(`Paid_On`) = MONTH(CURDATE())) AS Revenue_This_Month,
  (SELECT COUNT(*) FROM `Attendance` WHERE `Visit_Date` = CURDATE()) AS Todays_Attendance,
  (SELECT COALESCE(SUM(`Cost`), 0) FROM `Maintenance_Log` WHERE YEAR(`Service_Date`) = YEAR(CURDATE())) AS Maintenance_Cost_This_Year;
