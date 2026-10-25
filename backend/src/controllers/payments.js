import { pool } from '../config/db.js';
import { AppError } from '../middleware/errorHandler.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { likeTerm, parseListParams, quoteIdent, sendList } from '../utils/dateHelpers.js';

const SORT = ['Payment_ID', 'Sub_ID', 'Amount', 'Paid_On', 'Mode', 'Member_Name', 'Plan_Name'];

async function findById(id) {
  const [rows] = await pool.query(
    `SELECT * FROM vw_payment_details WHERE Payment_ID = ?`,
    [id]
  );
  return rows[0] || null;
}

export const listPayments = asyncHandler(async (req, res) => {
  const { page, limit, search, sortBy, order, offset } = parseListParams(req.query, SORT, 'Payment_ID');
  const params = [];
  let where = '';
  if (search) {
    where = `WHERE (Member_Name LIKE ? OR Plan_Name LIKE ? OR Mode LIKE ?)`;
    params.push(likeTerm(search), likeTerm(search), likeTerm(search));
  }
  const [countRows] = await pool.query(`SELECT COUNT(*) AS total FROM vw_payment_details ${where}`, params);
  const [rows] = await pool.query(
    `SELECT * FROM vw_payment_details ${where} ORDER BY ${quoteIdent(sortBy)} ${order} LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  sendList(res, rows, countRows[0].total, page, limit);
});

export const getPayment = asyncHandler(async (req, res) => {
  const row = await findById(req.params.id);
  if (!row) throw new AppError('Payment not found.', 404);
  res.json({ success: true, data: row });
});

export const createPayment = asyncHandler(async (req, res) => {
  const { Sub_ID, Amount, Paid_On, Mode } = req.body;
  const [result] = await pool.query(
    `INSERT INTO Payment (Sub_ID, Amount, Paid_On, Mode) VALUES (?, ?, ?, ?)`,
    [Sub_ID, Amount, Paid_On, Mode]
  );
  const row = await findById(result.insertId);
  res.status(201).json({ success: true, data: row });
});

export const updatePayment = asyncHandler(async (req, res) => {
  const existing = await findById(req.params.id);
  if (!existing) throw new AppError('Payment not found.', 404);
  const { Sub_ID, Amount, Paid_On, Mode } = req.body;
  await pool.query(
    `UPDATE Payment SET Sub_ID = ?, Amount = ?, Paid_On = ?, Mode = ? WHERE Payment_ID = ?`,
    [Sub_ID, Amount, Paid_On, Mode, req.params.id]
  );
  const row = await findById(req.params.id);
  res.json({ success: true, data: row });
});

export const deletePayment = asyncHandler(async (req, res) => {
  const existing = await findById(req.params.id);
  if (!existing) throw new AppError('Payment not found.', 404);
  await pool.query(`DELETE FROM Payment WHERE Payment_ID = ?`, [req.params.id]);
  res.json({ success: true, data: { message: 'Payment deleted successfully.' } });
});
