import { pool } from '../config/db.js';
import { AppError } from '../middleware/errorHandler.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { likeTerm, parseListParams, quoteIdent, sendList } from '../utils/dateHelpers.js';

const SORT = ['Log_ID', 'Equip_ID', 'Service_Date', 'Cost', 'Technician', 'Equip_Name'];

async function findById(id) {
  const [rows] = await pool.query(
    `SELECT * FROM vw_maintenance_details WHERE Log_ID = ?`,
    [id]
  );
  return rows[0] || null;
}

export const listMaintenance = asyncHandler(async (req, res) => {
  const { page, limit, search, sortBy, order, offset } = parseListParams(req.query, SORT, 'Log_ID');
  const params = [];
  let where = '';
  if (search) {
    where = `WHERE (Equip_Name LIKE ? OR Technician LIKE ?)`;
    params.push(likeTerm(search), likeTerm(search));
  }
  const [countRows] = await pool.query(`SELECT COUNT(*) AS total FROM vw_maintenance_details ${where}`, params);
  const [rows] = await pool.query(
    `SELECT * FROM vw_maintenance_details ${where} ORDER BY ${quoteIdent(sortBy)} ${order} LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  sendList(res, rows, countRows[0].total, page, limit);
});

export const getMaintenance = asyncHandler(async (req, res) => {
  const row = await findById(req.params.id);
  if (!row) throw new AppError('Maintenance log not found.', 404);
  res.json({ success: true, data: row });
});

export const createMaintenance = asyncHandler(async (req, res) => {
  const { Equip_ID, Service_Date, Cost, Technician } = req.body;
  const [result] = await pool.query(
    `INSERT INTO Maintenance_Log (Equip_ID, Service_Date, Cost, Technician) VALUES (?, ?, ?, ?)`,
    [Equip_ID, Service_Date, Cost, Technician]
  );
  const row = await findById(result.insertId);
  res.status(201).json({ success: true, data: row });
});

export const updateMaintenance = asyncHandler(async (req, res) => {
  const existing = await findById(req.params.id);
  if (!existing) throw new AppError('Maintenance log not found.', 404);
  const { Equip_ID, Service_Date, Cost, Technician } = req.body;
  await pool.query(
    `UPDATE Maintenance_Log SET Equip_ID = ?, Service_Date = ?, Cost = ?, Technician = ? WHERE Log_ID = ?`,
    [Equip_ID, Service_Date, Cost, Technician, req.params.id]
  );
  const row = await findById(req.params.id);
  res.json({ success: true, data: row });
});

export const deleteMaintenance = asyncHandler(async (req, res) => {
  const existing = await findById(req.params.id);
  if (!existing) throw new AppError('Maintenance log not found.', 404);
  await pool.query(`DELETE FROM Maintenance_Log WHERE Log_ID = ?`, [req.params.id]);
  res.json({ success: true, data: { message: 'Maintenance log deleted successfully.' } });
});
