import { pool } from '../config/db.js';
import { AppError } from '../middleware/errorHandler.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { likeTerm, parseListParams, quoteIdent, sendList } from '../utils/dateHelpers.js';

const SORT = ['Member_ID', 'Name', 'DOB', 'Gender', 'Phone', 'Email', 'Join_Date'];

const SELECT = `SELECT Member_ID, Name, DOB, Gender, Phone, Email, Join_Date FROM Member`;

async function findById(id) {
  const [rows] = await pool.query(`${SELECT} WHERE Member_ID = ?`, [id]);
  return rows[0] || null;
}

export const listMembers = asyncHandler(async (req, res) => {
  const { page, limit, search, sortBy, order, offset } = parseListParams(req.query, SORT, 'Member_ID');
  const where = [];
  const params = [];

  if (search) {
    where.push('(Name LIKE ? OR Phone LIKE ? OR Email LIKE ? OR Gender LIKE ?)');
    params.push(likeTerm(search), likeTerm(search), likeTerm(search), likeTerm(search));
  }

  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [countRows] = await pool.query(`SELECT COUNT(*) AS total FROM Member ${clause}`, params);
  const [rows] = await pool.query(
    `${SELECT} ${clause} ORDER BY ${quoteIdent(sortBy)} ${order} LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  sendList(res, rows, countRows[0].total, page, limit);
});

export const getMember = asyncHandler(async (req, res) => {
  const row = await findById(req.params.id);
  if (!row) throw new AppError('Member not found.', 404);
  res.json({ success: true, data: row });
});

export const createMember = asyncHandler(async (req, res) => {
  const { Name, DOB, Gender, Phone, Email, Join_Date } = req.body;
  const [result] = await pool.query(
    `INSERT INTO Member (Name, DOB, Gender, Phone, Email, Join_Date) VALUES (?, ?, ?, ?, ?, ?)`,
    [Name, DOB, Gender, Phone, Email, Join_Date]
  );
  const row = await findById(result.insertId);
  res.status(201).json({ success: true, data: row });
});

export const updateMember = asyncHandler(async (req, res) => {
  const existing = await findById(req.params.id);
  if (!existing) throw new AppError('Member not found.', 404);
  const { Name, DOB, Gender, Phone, Email, Join_Date } = req.body;
  await pool.query(
    `UPDATE Member SET Name = ?, DOB = ?, Gender = ?, Phone = ?, Email = ?, Join_Date = ? WHERE Member_ID = ?`,
    [Name, DOB, Gender, Phone, Email, Join_Date, req.params.id]
  );
  const row = await findById(req.params.id);
  res.json({ success: true, data: row });
});

export const deleteMember = asyncHandler(async (req, res) => {
  const existing = await findById(req.params.id);
  if (!existing) throw new AppError('Member not found.', 404);
  await pool.query(`DELETE FROM Member WHERE Member_ID = ?`, [req.params.id]);
  res.json({ success: true, data: { message: 'Member deleted successfully.' } });
});
