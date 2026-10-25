import { pool } from '../config/db.js';
import { AppError } from '../middleware/errorHandler.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getGymAnalytics = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT * FROM vw_plan_profitability ORDER BY Revenue_Rank ASC`
  );
  const topPlan = rows.find((r) => Number(r.Revenue_Rank) === 1) || rows[0] || null;

  res.json({
    success: true,
    data: {
      planProfitability: rows,
      topPlan
    }
  });
});

export const getVisitLevels = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT * FROM vw_visit_levels ORDER BY Level_Order ASC`
  );
  res.json({
    success: true,
    data: rows
  });
});

export const getMemberAnalytics = asyncHandler(async (req, res) => {
  const memberId = Number(req.params.id);
  const [behaviorRows] = await pool.query(
    `SELECT * FROM vw_member_behavior WHERE Member_ID = ?`,
    [memberId]
  );

  if (!behaviorRows.length) {
    throw new AppError('Member not found.', 404);
  }

  const [planFit] = await pool.query(
    `SELECT * FROM vw_member_plan_fit WHERE Member_ID = ? ORDER BY Duration_Months ASC`,
    [memberId]
  );
  const recommended = planFit.find((r) => Number(r.Is_Recommended) === 1) || null;

  res.json({
    success: true,
    data: {
      behavior: behaviorRows[0],
      planFit,
      recommended
    }
  });
});

export const getNewCustomerAnalytics = asyncHandler(async (req, res) => {
  const age = parseInt(req.query.age, 10);
  const expectedVisits = parseInt(req.query.expectedVisits, 10);

  if (Number.isNaN(age) || age < 10 || age > 100) {
    throw new AppError('Age must be an integer between 10 and 100.', 400);
  }
  if (Number.isNaN(expectedVisits) || expectedVisits < 0 || expectedVisits > 100) {
    throw new AppError('Expected visits must be an integer between 0 and 100.', 400);
  }

  // (a) Level lookup
  const [levelRows] = await pool.query(
    `SELECT Visit_Level, Level_Label, Target_Duration_Months
     FROM vw_visit_levels
     WHERE ? > Min_Exclusive AND ? <= Max_Inclusive`,
    [expectedVisits, expectedVisits]
  );

  if (!levelRows.length) {
    throw new AppError('No matching visit level found for expected visits.', 400);
  }
  const levelRow = levelRows[0];

  // (b) Plan comparison
  const [plans] = await pool.query(
    `SELECT
       m.Plan_ID,
       m.Plan_Name,
       m.Duration_Months,
       m.Fee,
       m.Fee_Per_Month,
       m.Is_Level_Plan AS Is_Recommended,
       ROUND(m.Fee_Per_Month / NULLIF(?, 0), 2) AS Projected_Cost_Per_Visit,
       CASE
         WHEN m.Is_Level_Plan = 1 THEN
           CONCAT('You plan to visit about ', ?, ' times a month (', m.Visit_Level, ' level), so a ', m.Duration_Months, '-month plan fits your routine. It works out to about ', COALESCE(ROUND(m.Fee_Per_Month / NULLIF(?, 0), 2), m.Fee_Per_Month), ' per visit.')
         WHEN m.Duration_Months > m.Target_Duration_Months THEN
           'Longer than your planned visits need. Visit more often to get the most from it.'
         ELSE
           'Flexible, but you would pay more per month than on the recommended plan.'
       END AS Recommendation_Reason
     FROM vw_level_plan_map m
     WHERE m.Visit_Level = ?
     ORDER BY m.Duration_Months ASC`,
    [expectedVisits, expectedVisits, expectedVisits, levelRow.Visit_Level]
  );

  const levelPlan = plans.find((p) => Number(p.Is_Recommended) === 1) || plans[0] || null;

  // Age band computed in SQL with matching collation
  const ageBandExpr = `CASE
    WHEN ? < 25 THEN CAST('Under 25' AS CHAR(20) CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci
    WHEN ? BETWEEN 25 AND 34 THEN CAST('25-34' AS CHAR(20) CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci
    WHEN ? BETWEEN 35 AND 44 THEN CAST('35-44' AS CHAR(20) CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci
    ELSE CAST('45+' AS CHAR(20) CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci
  END`;

  const [[bandResult]] = await pool.query(
    `SELECT (${ageBandExpr}) AS ageBand`,
    [age, age, age]
  );
  const ageBand = bandResult.ageBand;

  // (c) Similar members
  const [rows] = await pool.query(
    `SELECT * FROM vw_similar_member_plans
     WHERE Age_Band = (${ageBandExpr}) AND Visit_Level = ?
     ORDER BY Popularity_Rank ASC`,
    [age, age, age, levelRow.Visit_Level]
  );

  if (rows.length > 0) {
    return res.json({
      success: true,
      data: {
        ageBand,
        expectedVisits,
        visitLevel: levelRow.Visit_Level,
        levelLabel: levelRow.Level_Label,
        levelPlan,
        plans,
        fallback: false,
        recommendations: rows
      }
    });
  }

  // Fallback query on the same view filtered by Visit_Level only, grouped across age bands
  const [fallbackRows] = await pool.query(
    `SELECT
       Plan_ID,
       Plan_Name,
       Fee_Per_Month,
       SUM(Members_Count) AS Members_Count,
       SUM(Subscriptions_Count) AS Subscriptions_Count,
       SUM(Kept_Subscriptions) AS Kept_Subscriptions,
       COALESCE(ROUND(SUM(Kept_Subscriptions) * 100.0 / NULLIF(SUM(Subscriptions_Count), 0), 2), 0.00) AS Completion_Rate_Pct,
       COALESCE(ROUND(AVG(Avg_Visits_Per_Month), 1), 0.0) AS Avg_Visits_Per_Month,
       COALESCE(ROUND(AVG(Avg_Amount_Paid), 2), 0.00) AS Avg_Amount_Paid,
       ROW_NUMBER() OVER (
         ORDER BY
           SUM(Members_Count) DESC,
           COALESCE(ROUND(SUM(Kept_Subscriptions) * 100.0 / NULLIF(SUM(Subscriptions_Count), 0), 2), 0.00) DESC,
           Plan_ID ASC
       ) AS Popularity_Rank
     FROM vw_similar_member_plans
     WHERE Visit_Level = ?
     GROUP BY Plan_ID, Plan_Name, Fee_Per_Month
     ORDER BY Popularity_Rank ASC`,
    [levelRow.Visit_Level]
  );

  res.json({
    success: true,
    data: {
      ageBand,
      expectedVisits,
      visitLevel: levelRow.Visit_Level,
      levelLabel: levelRow.Level_Label,
      levelPlan,
      plans,
      fallback: true,
      recommendations: fallbackRows
    }
  });
});
