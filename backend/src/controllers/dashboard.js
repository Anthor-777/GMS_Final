import { pool } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getDashboard = asyncHandler(async (req, res) => {
  const [[summary]] = await pool.query(`SELECT * FROM vw_dashboard_summary`);

  const [revenueLast6Months] = await pool.query(
    `SELECT Month AS month, Revenue AS revenue FROM vw_revenue_last_6_months ORDER BY Month ASC`
  );

  const [expiringSubscriptions] = await pool.query(
    `SELECT * FROM vw_expiring_subscriptions ORDER BY End_Date ASC`
  );

  const [upcomingSessions] = await pool.query(
    `SELECT * FROM vw_upcoming_sessions ORDER BY Slot_DateTime ASC LIMIT 5`
  );

  const [equipmentAlerts] = await pool.query(
    `SELECT * FROM vw_equipment_alerts ORDER BY Equip_ID ASC`
  );

  res.json({
    success: true,
    data: {
      totalMembers: Number(summary.Total_Members),
      activeSubscriptions: Number(summary.Running_Subscriptions),
      revenueThisMonth: Number(summary.Revenue_This_Month),
      revenueLast6Months: revenueLast6Months.map((r) => ({
        month: r.month,
        revenue: Number(r.revenue)
      })),
      expiringSubscriptions,
      todaysAttendance: Number(summary.Todays_Attendance),
      upcomingSessions,
      equipmentAlerts,
      maintenanceCostThisYear: Number(summary.Maintenance_Cost_This_Year)
    }
  });
});
