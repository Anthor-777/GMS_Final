import { pool } from '../config/db.js';
import { AppError } from '../middleware/errorHandler.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { likeTerm, parseListParams, quoteIdent, sendList } from '../utils/dateHelpers.js';

const SORT = ['Trainer_ID', 'Name', 'Specialization', 'Phone', 'Salary'];
const SELECT = `SELECT Trainer_ID, Name, Specialization, Phone, Salary FROM Trainer`;

async function findById(id) {
  const [rows] = await pool.query(`${SELECT} WHERE Trainer_ID = ?`, [id]);
  return rows[0] || null;
}

export const listTrainers = asyncHandler(async (req, res) => {
  const { page, limit, search, sortBy, order, offset } = parseListParams(req.query, SORT, 'Trainer_ID');
  const params = [];
  let where = '';
  if (search) {
    where = `WHERE (Name LIKE ? OR Specialization LIKE ? OR Phone LIKE ?)`;
    params.push(likeTerm(search), likeTerm(search), likeTerm(search));
  }
  const [countRows] = await pool.query(`SELECT COUNT(*) AS total FROM Trainer ${where}`, params);
  const [rows] = await pool.query(
    `${SELECT} ${where} ORDER BY ${quoteIdent(sortBy)} ${order} LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  sendList(res, rows, countRows[0].total, page, limit);
});

export const getTrainer = asyncHandler(async (req, res) => {
  const row = await findById(req.params.id);
  if (!row) throw new AppError('Trainer not found.', 404);
  res.json({ success: true, data: row });
});

export const createTrainer = asyncHandler(async (req, res) => {
  const { Name, Specialization, Phone, Salary } = req.body;
  const [result] = await pool.query(
    `INSERT INTO Trainer (Name, Specialization, Phone, Salary) VALUES (?, ?, ?, ?)`,
    [Name, Specialization, Phone, Salary]
  );
  const row = await findById(result.insertId);
  res.status(201).json({ success: true, data: row });
});

export const updateTrainer = asyncHandler(async (req, res) => {
  const existing = await findById(req.params.id);
  if (!existing) throw new AppError('Trainer not found.', 404);
  const { Name, Specialization, Phone, Salary } = req.body;
  await pool.query(
    `UPDATE Trainer SET Name = ?, Specialization = ?, Phone = ?, Salary = ? WHERE Trainer_ID = ?`,
    [Name, Specialization, Phone, Salary, req.params.id]
  );
  const row = await findById(req.params.id);
  res.json({ success: true, data: row });
});

export const deleteTrainer = asyncHandler(async (req, res) => {
  const existing = await findById(req.params.id);
  if (!existing) throw new AppError('Trainer not found.', 404);
  await pool.query(`DELETE FROM Trainer WHERE Trainer_ID = ?`, [req.params.id]);
  res.json({ success: true, data: { message: 'Trainer deleted successfully.' } });
});
