import { pool } from '../config/db.js';
import { AppError } from '../middleware/errorHandler.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { likeTerm, parseListParams, quoteIdent, sendList } from '../utils/dateHelpers.js';

const SORT = ['Plan_ID', 'Plan_Name', 'Duration_Months', 'Fee', 'Fee_Per_Month'];
const SELECT = `SELECT Plan_ID, Plan_Name, Duration_Months, Fee, ROUND(Fee / Duration_Months, 2) AS Fee_Per_Month FROM Membership_Plan`;

async function findById(id) {
  const [rows] = await pool.query(`${SELECT} WHERE Plan_ID = ?`, [id]);
  return rows[0] || null;
}

export const listPlans = asyncHandler(async (req, res) => {
  const { page, limit, search, sortBy, order, offset } = parseListParams(req.query, SORT, 'Plan_ID');
  const where = [];
  const params = [];
  if (search) {
    where.push('(Plan_Name LIKE ?)');
    params.push(likeTerm(search));
  }
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [countRows] = await pool.query(`SELECT COUNT(*) AS total FROM Membership_Plan ${clause}`, params);
  const [rows] = await pool.query(
    `${SELECT} ${clause} ORDER BY ${quoteIdent(sortBy)} ${order} LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  sendList(res, rows, countRows[0].total, page, limit);
});

export const getPlan = asyncHandler(async (req, res) => {
  const row = await findById(req.params.id);
  if (!row) throw new AppError('Membership plan not found.', 404);
  res.json({ success: true, data: row });
});

export const createPlan = asyncHandler(async (req, res) => {
  const { Plan_Name, Duration_Months, Fee } = req.body;
  const [result] = await pool.query(
    `INSERT INTO Membership_Plan (Plan_Name, Duration_Months, Fee) VALUES (?, ?, ?)`,
    [Plan_Name, Duration_Months, Fee]
  );
  const row = await findById(result.insertId);
  res.status(201).json({ success: true, data: row });
});

export const updatePlan = asyncHandler(async (req, res) => {
  const existing = await findById(req.params.id);
  if (!existing) throw new AppError('Membership plan not found.', 404);
  const { Plan_Name, Duration_Months, Fee } = req.body;
  await pool.query(
    `UPDATE Membership_Plan SET Plan_Name = ?, Duration_Months = ?, Fee = ? WHERE Plan_ID = ?`,
    [Plan_Name, Duration_Months, Fee, req.params.id]
  );
  const row = await findById(req.params.id);
  res.json({ success: true, data: row });
});

export const deletePlan = asyncHandler(async (req, res) => {
  const existing = await findById(req.params.id);
  if (!existing) throw new AppError('Membership plan not found.', 404);
  await pool.query(`DELETE FROM Membership_Plan WHERE Plan_ID = ?`, [req.params.id]);
  res.json({ success: true, data: { message: 'Membership plan deleted successfully.' } });
});
