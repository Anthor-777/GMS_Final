import { pool } from '../config/db.js';
import { AppError } from '../middleware/errorHandler.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { likeTerm, parseListParams, quoteIdent, sendList } from '../utils/dateHelpers.js';

const SORT = ['Session_ID', 'Member_ID', 'Trainer_ID', 'Slot_DateTime', 'Focus_Area', 'Member_Name', 'Trainer_Name'];

async function findById(id) {
  const [rows] = await pool.query(
    `SELECT * FROM vw_session_details WHERE Session_ID = ?`,
    [id]
  );
  return rows[0] || null;
}

export const listSessions = asyncHandler(async (req, res) => {
  const { page, limit, search, sortBy, order, offset } = parseListParams(req.query, SORT, 'Session_ID');
  const params = [];
  let where = '';
  if (search) {
    where = `WHERE (Member_Name LIKE ? OR Trainer_Name LIKE ? OR Focus_Area LIKE ?)`;
    params.push(likeTerm(search), likeTerm(search), likeTerm(search));
  }
  const [countRows] = await pool.query(`SELECT COUNT(*) AS total FROM vw_session_details ${where}`, params);
  const [rows] = await pool.query(
    `SELECT * FROM vw_session_details ${where} ORDER BY ${quoteIdent(sortBy)} ${order} LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  sendList(res, rows, countRows[0].total, page, limit);
});

export const getSession = asyncHandler(async (req, res) => {
  const row = await findById(req.params.id);
  if (!row) throw new AppError('Session not found.', 404);
  res.json({ success: true, data: row });
});

export const createSession = asyncHandler(async (req, res) => {
  const { Member_ID, Trainer_ID, Slot_DateTime, Focus_Area } = req.body;
  const [result] = await pool.query(
    `INSERT INTO Session (Member_ID, Trainer_ID, Slot_DateTime, Focus_Area) VALUES (?, ?, ?, ?)`,
    [Member_ID, Trainer_ID, Slot_DateTime, Focus_Area]
  );
  const row = await findById(result.insertId);
  res.status(201).json({ success: true, data: row });
});

export const updateSession = asyncHandler(async (req, res) => {
  const existing = await findById(req.params.id);
  if (!existing) throw new AppError('Session not found.', 404);
  const { Member_ID, Trainer_ID, Slot_DateTime, Focus_Area } = req.body;
  await pool.query(
    `UPDATE Session SET Member_ID = ?, Trainer_ID = ?, Slot_DateTime = ?, Focus_Area = ? WHERE Session_ID = ?`,
    [Member_ID, Trainer_ID, Slot_DateTime, Focus_Area, req.params.id]
  );
  const row = await findById(req.params.id);
  res.json({ success: true, data: row });
});

export const deleteSession = asyncHandler(async (req, res) => {
  const existing = await findById(req.params.id);
  if (!existing) throw new AppError('Session not found.', 404);
  await pool.query(`DELETE FROM Session WHERE Session_ID = ?`, [req.params.id]);
  res.json({ success: true, data: { message: 'Session deleted successfully.' } });
});
