SET NAMES utf8mb4;
USE gym_management;

-- =============================================================================
-- ANALYTICS VIEWS
-- =============================================================================

-- 1. vw_plan_profitability [JOIN, AGGREGATE, SUBQUERY, WINDOW]
-- (Unchanged - Gym Insights analytics)
CREATE OR REPLACE VIEW `vw_plan_profitability` AS
WITH plan_metrics AS (
  SELECT
    p.Plan_ID,
    p.Plan_Name,
    p.Duration_Months,
    p.Fee,
    ROUND(p.Fee / p.Duration_Months, 2) AS Fee_Per_Month,
    COUNT(s.Sub_ID) AS Total_Subscriptions,
    COUNT(DISTINCT s.Member_ID) AS Distinct_Members,
    COALESCE(SUM(CASE WHEN s.Status = 'Cancelled' THEN 1 ELSE 0 END), 0) AS Cancelled_Subscriptions,
    COALESCE(ROUND(SUM(CASE WHEN s.Status = 'Cancelled' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(s.Sub_ID), 0), 2), 0.00) AS Cancellation_Rate_Pct,
    COALESCE(SUM(paid_summary.Paid), 0.00) AS Total_Revenue,
    COALESCE(ROUND(SUM(paid_summary.Paid) / NULLIF(COUNT(s.Sub_ID), 0), 2), 0.00) AS Revenue_Per_Subscription,
    COALESCE(ROUND(SUM(paid_summary.Paid) * 100.0 / NULLIF((SELECT SUM(Amount) FROM Payment), 0), 2), 0.00) AS Revenue_Share_Pct,
    RANK() OVER (ORDER BY COALESCE(SUM(paid_summary.Paid), 0.00) DESC) AS Revenue_Rank
  FROM `Membership_Plan` p
  LEFT JOIN `Subscription` s ON s.Plan_ID = p.Plan_ID
  LEFT JOIN (
    SELECT Sub_ID, SUM(Amount) AS Paid
    FROM `Payment`
    GROUP BY Sub_ID
  ) paid_summary ON paid_summary.Sub_ID = s.Sub_ID
  GROUP BY p.Plan_ID, p.Plan_Name, p.Duration_Months, p.Fee
)
SELECT
  Plan_ID,
  Plan_Name,
  Duration_Months,
  Fee,
  Fee_Per_Month,
  Total_Subscriptions,
  Distinct_Members,
  Cancelled_Subscriptions,
  Cancellation_Rate_Pct,
  Total_Revenue,
  Revenue_Per_Subscription,
  Revenue_Share_Pct,
  Revenue_Rank,
  CASE
    WHEN Revenue_Rank = 1 THEN CONCAT('Top earning plan: ', Plan_Name, ' brings ', Revenue_Share_Pct, '% of all revenue.')
    WHEN Cancellation_Rate_Pct > 25.00 THEN 'High cancellation rate, review this plan.'
    ELSE 'Performing normally.'
  END AS Gym_Insight
FROM plan_metrics;

-- 2. vw_visit_levels [DERIVED TABLE]
-- Single source of truth for visit frequency thresholds across the system.
-- Boundaries:
-- Low:       x > -1.0 AND x <= 4.9   (Under 5 visits a month -> target 1 month)
-- Medium:    x > 4.9  AND x <= 12.0  (5 to 12 visits a month, 12 included -> target 3 months)
-- High:      x > 12.0 AND x <= 20.0  (13 to 20 visits a month, 20 included -> target 6 months)
-- Very High: x > 20.0 AND x <= 9999  (More than 20 visits a month -> target 12 months)
CREATE OR REPLACE VIEW `vw_visit_levels` AS
SELECT
  CAST('Low' AS CHAR(20) CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci AS Visit_Level,
  1 AS Level_Order,
  -1.0 AS Min_Exclusive,
  4.9 AS Max_Inclusive,
  1 AS Target_Duration_Months,
  CAST('Under 5 visits a month' AS CHAR(50) CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci AS Level_Label
UNION ALL
SELECT
  CAST('Medium' AS CHAR(20) CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci,
  2,
  4.9,
  12.0,
  3,
  CAST('5 to 12 visits a month' AS CHAR(50) CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci
UNION ALL
SELECT
  CAST('High' AS CHAR(20) CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci,
  3,
  12.0,
  20.0,
  6,
  CAST('13 to 20 visits a month' AS CHAR(50) CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci
UNION ALL
SELECT
  CAST('Very High' AS CHAR(20) CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci,
  4,
  20.0,
  9999.0,
  12,
  CAST('More than 20 visits a month' AS CHAR(50) CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci;

-- 3. vw_member_behavior [CORRELATED SUBQUERIES, AGGREGATE, JOIN]
CREATE OR REPLACE VIEW `vw_member_behavior` AS
WITH member_base AS (
  SELECT
    m.Member_ID,
    m.Name AS Member_Name,
    m.Gender,
    TIMESTAMPDIFF(YEAR, m.DOB, CURDATE()) AS Age,
    CASE
      WHEN TIMESTAMPDIFF(YEAR, m.DOB, CURDATE()) < 25 THEN CAST('Under 25' AS CHAR(20) CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci
      WHEN TIMESTAMPDIFF(YEAR, m.DOB, CURDATE()) BETWEEN 25 AND 34 THEN CAST('25-34' AS CHAR(20) CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci
      WHEN TIMESTAMPDIFF(YEAR, m.DOB, CURDATE()) BETWEEN 35 AND 44 THEN CAST('35-44' AS CHAR(20) CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci
      ELSE CAST('45+' AS CHAR(20) CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci
    END AS Age_Band,
    (SELECT COUNT(*) FROM `Attendance` a WHERE a.Member_ID = m.Member_ID) AS Total_Visits,
    (SELECT COUNT(*) FROM `Attendance` a WHERE a.Member_ID = m.Member_ID AND a.Visit_Date >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)) AS Visits_Last_90_Days,
    GREATEST(30, LEAST(90, DATEDIFF(CURDATE(), m.Join_Date) + 1)) AS Observed_Days,
    (SELECT COUNT(*) FROM `Session` sess WHERE sess.Member_ID = m.Member_ID) AS Total_Sessions,
    COALESCE((
      SELECT SUM(p.Amount)
      FROM `Payment` p
      INNER JOIN `Subscription` s ON s.Sub_ID = p.Sub_ID
      WHERE s.Member_ID = m.Member_ID
    ), 0.00) AS Total_Paid,
    (
      SELECT s.Plan_ID
      FROM `Subscription` s
      WHERE s.Member_ID = m.Member_ID
      ORDER BY s.Start_Date DESC, s.Sub_ID DESC
      LIMIT 1
    ) AS Current_Plan_ID,
    (
      SELECT p.Plan_Name
      FROM `Subscription` s
      INNER JOIN `Membership_Plan` p ON p.Plan_ID = s.Plan_ID
      WHERE s.Member_ID = m.Member_ID
      ORDER BY s.Start_Date DESC, s.Sub_ID DESC
      LIMIT 1
    ) AS Current_Plan_Name,
    (
      SELECT ROUND(p.Fee / p.Duration_Months, 2)
      FROM `Subscription` s
      INNER JOIN `Membership_Plan` p ON p.Plan_ID = s.Plan_ID
      WHERE s.Member_ID = m.Member_ID
      ORDER BY s.Start_Date DESC, s.Sub_ID DESC
      LIMIT 1
    ) AS Current_Fee_Per_Month
  FROM `Member` m
),
member_visits AS (
  SELECT
    mb.*,
    ROUND(mb.Visits_Last_90_Days / (mb.Observed_Days / 30.0), 1) AS Avg_Visits_Per_Month
  FROM member_base mb
)
SELECT
  mv.Member_ID,
  mv.Member_Name,
  mv.Gender,
  mv.Age,
  mv.Age_Band,
  mv.Total_Visits,
  mv.Visits_Last_90_Days,
  mv.Observed_Days,
  mv.Avg_Visits_Per_Month,
  vl.Visit_Level,
  vl.Target_Duration_Months,
  mv.Total_Sessions,
  mv.Total_Paid,
  mv.Current_Plan_ID,
  mv.Current_Plan_Name,
  mv.Current_Fee_Per_Month
FROM member_visits mv
INNER JOIN `vw_visit_levels` vl
  ON mv.Avg_Visits_Per_Month > vl.Min_Exclusive
 AND mv.Avg_Visits_Per_Month <= vl.Max_Inclusive;

-- 4. NEW vw_level_plan_map [JOIN, CROSS JOIN, WINDOW]
CREATE OR REPLACE VIEW `vw_level_plan_map` AS
WITH mapped AS (
  SELECT
    vl.Visit_Level,
    vl.Level_Order,
    vl.Level_Label,
    vl.Min_Exclusive,
    vl.Max_Inclusive,
    vl.Target_Duration_Months,
    p.Plan_ID,
    p.Plan_Name,
    p.Duration_Months,
    p.Fee,
    ROUND(p.Fee / p.Duration_Months, 2) AS Fee_Per_Month,
    ROW_NUMBER() OVER (
      PARTITION BY vl.Visit_Level
      ORDER BY
        (p.Duration_Months <= vl.Target_Duration_Months) DESC,
        CASE WHEN p.Duration_Months <= vl.Target_Duration_Months THEN p.Duration_Months END DESC,
        p.Duration_Months ASC
    ) AS Level_Rank
  FROM `vw_visit_levels` vl
  CROSS JOIN `Membership_Plan` p
)
SELECT
  Visit_Level,
  Level_Order,
  Level_Label,
  Min_Exclusive,
  Max_Inclusive,
  Target_Duration_Months,
  Plan_ID,
  Plan_Name,
  Duration_Months,
  Fee,
  Fee_Per_Month,
  Level_Rank,
  CASE WHEN Level_Rank = 1 THEN 1 ELSE 0 END AS Is_Level_Plan
FROM mapped;

-- 5. vw_member_plan_fit [JOIN, WINDOW, CASE]
CREATE OR REPLACE VIEW `vw_member_plan_fit` AS
SELECT
  mb.Member_ID,
  mb.Member_Name,
  mb.Visit_Level,
  mb.Avg_Visits_Per_Month,
  lpm.Target_Duration_Months,
  lpm.Plan_ID,
  lpm.Plan_Name,
  lpm.Duration_Months,
  lpm.Fee,
  lpm.Fee_Per_Month,
  ROUND(lpm.Fee_Per_Month / NULLIF(mb.Avg_Visits_Per_Month, 0), 2) AS Projected_Cost_Per_Visit,
  CASE
    WHEN mb.Current_Fee_Per_Month IS NOT NULL
    THEN ROUND(mb.Current_Fee_Per_Month - lpm.Fee_Per_Month, 2)
    ELSE NULL
  END AS Monthly_Saving_Vs_Current,
  lpm.Level_Rank AS Fit_Rank,
  lpm.Is_Level_Plan AS Is_Recommended,
  CASE
    WHEN lpm.Level_Rank = 1 THEN
      CONCAT('You visit about ', mb.Avg_Visits_Per_Month, ' times a month (', mb.Visit_Level, ' level), so a ', lpm.Duration_Months, '-month plan fits your routine. It works out to about ', COALESCE(ROUND(lpm.Fee_Per_Month / NULLIF(mb.Avg_Visits_Per_Month, 0), 2), lpm.Fee_Per_Month), ' per visit.')
    WHEN lpm.Duration_Months > lpm.Target_Duration_Months THEN
      'Longer than your current visit pattern needs. Visit more often to get the most from it.'
    ELSE
      'Flexible, but you would pay more per month than on the recommended plan.'
  END AS Recommendation_Reason
FROM `vw_member_behavior` mb
INNER JOIN `vw_level_plan_map` lpm ON lpm.Visit_Level = mb.Visit_Level;

-- 6. vw_similar_member_plans [JOIN, AGGREGATE, WINDOW]
CREATE OR REPLACE VIEW `vw_similar_member_plans` AS
SELECT
  mb.Age_Band,
  mb.Visit_Level,
  p.Plan_ID,
  p.Plan_Name,
  ROUND(p.Fee / p.Duration_Months, 2) AS Fee_Per_Month,
  COUNT(DISTINCT s.Member_ID) AS Members_Count,
  COUNT(s.Sub_ID) AS Subscriptions_Count,
  COALESCE(SUM(CASE WHEN s.Status <> 'Cancelled' THEN 1 ELSE 0 END), 0) AS Kept_Subscriptions,
  COALESCE(ROUND(SUM(CASE WHEN s.Status <> 'Cancelled' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(s.Sub_ID), 0), 2), 0.00) AS Completion_Rate_Pct,
  COALESCE(ROUND(AVG(mb.Avg_Visits_Per_Month), 1), 0.0) AS Avg_Visits_Per_Month,
  COALESCE(ROUND(AVG(paid_summary.Paid), 2), 0.00) AS Avg_Amount_Paid,
  ROW_NUMBER() OVER (
    PARTITION BY mb.Age_Band, mb.Visit_Level
    ORDER BY
      COUNT(DISTINCT s.Member_ID) DESC,
      COALESCE(ROUND(SUM(CASE WHEN s.Status <> 'Cancelled' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(s.Sub_ID), 0), 2), 0.00) DESC,
      p.Plan_ID ASC
  ) AS Popularity_Rank
FROM `Subscription` s
INNER JOIN `vw_member_behavior` mb ON mb.Member_ID = s.Member_ID
INNER JOIN `Membership_Plan` p ON p.Plan_ID = s.Plan_ID
LEFT JOIN (
  SELECT Sub_ID, SUM(Amount) AS Paid
  FROM `Payment`
  GROUP BY Sub_ID
) paid_summary ON paid_summary.Sub_ID = s.Sub_ID
GROUP BY mb.Age_Band, mb.Visit_Level, p.Plan_ID, p.Plan_Name, p.Duration_Months, p.Fee;
