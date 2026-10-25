import { pool } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getReports = asyncHandler(async (req, res) => {
  const [planStatistics] = await pool.query(`SELECT * FROM vw_plan_statistics`);
  const [trainerWorkload] = await pool.query(`SELECT * FROM vw_trainer_workload`);
  const [memberSummary] = await pool.query(`SELECT * FROM vw_member_summary`);
  const [equipmentMaintenance] = await pool.query(`SELECT * FROM vw_equipment_maintenance_summary`);

  res.json({
    success: true,
    data: {
      planStatistics,
      trainerWorkload,
      memberSummary,
      equipmentMaintenance
    }
  });
});
