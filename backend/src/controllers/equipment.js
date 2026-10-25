import { pool } from '../config/db.js';
import { AppError } from '../middleware/errorHandler.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { likeTerm, parseListParams, quoteIdent, sendList } from '../utils/dateHelpers.js';

const SORT = ['Equip_ID', 'Name', 'Category', 'Purchase_Date', 'Condition'];

const SELECT = `SELECT Equip_ID, Name, Category, Purchase_Date, \`Condition\` FROM Equipment`;

async function findById(id) {
  const [rows] = await pool.query(`${SELECT} WHERE Equip_ID = ?`, [id]);
  return rows[0] || null;
}

export const listEquipment = asyncHandler(async (req, res) => {
  const { page, limit, search, sortBy, order, offset } = parseListParams(req.query, SORT, 'Equip_ID');
  const params = [];
  let where = '';
  if (search) {
    where = `WHERE (Name LIKE ? OR Category LIKE ? OR \`Condition\` LIKE ?)`;
    params.push(likeTerm(search), likeTerm(search), likeTerm(search));
  }
  const [countRows] = await pool.query(`SELECT COUNT(*) AS total FROM Equipment ${where}`, params);
  const [rows] = await pool.query(
    `${SELECT} ${where} ORDER BY ${quoteIdent(sortBy)} ${order} LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  sendList(res, rows, countRows[0].total, page, limit);
});

export const getEquipment = asyncHandler(async (req, res) => {
  const row = await findById(req.params.id);
  if (!row) throw new AppError('Equipment not found.', 404);
  res.json({ success: true, data: row });
});

export const createEquipment = asyncHandler(async (req, res) => {
  const { Name, Category, Purchase_Date } = req.body;
  const condition = req.body.Condition;
  const [result] = await pool.query(
    `INSERT INTO Equipment (Name, Category, Purchase_Date, \`Condition\`) VALUES (?, ?, ?, ?)`,
    [Name, Category, Purchase_Date, condition]
  );
  const row = await findById(result.insertId);
  res.status(201).json({ success: true, data: row });
});

export const updateEquipment = asyncHandler(async (req, res) => {
  const existing = await findById(req.params.id);
  if (!existing) throw new AppError('Equipment not found.', 404);
  const { Name, Category, Purchase_Date } = req.body;
  const condition = req.body.Condition;
  await pool.query(
    `UPDATE Equipment SET Name = ?, Category = ?, Purchase_Date = ?, \`Condition\` = ? WHERE Equip_ID = ?`,
    [Name, Category, Purchase_Date, condition, req.params.id]
  );
  const row = await findById(req.params.id);
  res.json({ success: true, data: row });
});

export const deleteEquipment = asyncHandler(async (req, res) => {
  const existing = await findById(req.params.id);
  if (!existing) throw new AppError('Equipment not found.', 404);
  await pool.query(`DELETE FROM Equipment WHERE Equip_ID = ?`, [req.params.id]);
  res.json({ success: true, data: { message: 'Equipment deleted successfully.' } });
});
