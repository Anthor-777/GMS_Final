import { pool } from '../config/db.js';
import { AppError } from '../middleware/errorHandler.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { likeTerm, parseListParams, quoteIdent, sendList } from '../utils/dateHelpers.js';

const SORT = [
  'Sub_ID',
  'Member_ID',
  'Plan_ID',
  'Start_Date',
  'End_Date',
  'Status',
  'Member_Name',
  'Plan_Name',
  'Plan_Fee',
  'Amount_Paid',
  'Days_Left',
  'Display_Status'
];

async function findById(id) {
  const [rows] = await pool.query(
    `SELECT * FROM vw_subscription_details WHERE Sub_ID = ?`,
    [id]
  );
  return rows[0] || null;
}

function searchClause(search, params) {
  if (!search) return '';
  params.push(likeTerm(search), likeTerm(search), likeTerm(search), likeTerm(search), likeTerm(search));
  return `WHERE (Member_Name LIKE ? OR Plan_Name LIKE ? OR Status LIKE ? OR Display_Status LIKE ? OR CAST(Sub_ID AS CHAR) LIKE ?)`;
}

export const listSubscriptions = asyncHandler(async (req, res) => {
  const { page, limit, search, sortBy, order, offset } = parseListParams(req.query, SORT, 'Sub_ID');
  const params = [];
  const where = searchClause(search, params);
  const [countRows] = await pool.query(`SELECT COUNT(*) AS total FROM vw_subscription_details ${where}`, params);
  const [rows] = await pool.query(
    `SELECT * FROM vw_subscription_details ${where} ORDER BY ${quoteIdent(sortBy)} ${order} LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  sendList(res, rows, countRows[0].total, page, limit);
});

export const getSubscription = asyncHandler(async (req, res) => {
  const row = await findById(req.params.id);
  if (!row) throw new AppError('Subscription not found.', 404);
  res.json({ success: true, data: row });
});

export const createSubscription = asyncHandler(async (req, res) => {
  const { Member_ID, Plan_ID, Start_Date, End_Date, Status } = req.body;

  const [result] = await pool.query(
    `INSERT INTO Subscription (Member_ID, Plan_ID, Start_Date, End_Date, Status)
     VALUES (
       ?,
       ?,
       ?,
       COALESCE(?, (SELECT DATE_ADD(?, INTERVAL Duration_Months MONTH) FROM Membership_Plan WHERE Plan_ID = ?)),
       ?
     )`,
    [
      Member_ID,
      Plan_ID,
      Start_Date,
      End_Date || null,
      Start_Date,
      Plan_ID,
      Status || 'Active'
    ]
  );

  const row = await findById(result.insertId);
  res.status(201).json({ success: true, data: row });
});

export const updateSubscription = asyncHandler(async (req, res) => {
  const existing = await findById(req.params.id);
  if (!existing) throw new AppError('Subscription not found.', 404);

  const { Member_ID, Plan_ID, Start_Date, End_Date, Status } = req.body;

  await pool.query(
    `UPDATE Subscription
     SET Member_ID = ?,
         Plan_ID = ?,
         Start_Date = ?,
         End_Date = COALESCE(?, (SELECT DATE_ADD(?, INTERVAL Duration_Months MONTH) FROM Membership_Plan WHERE Plan_ID = ?)),
         Status = ?
     WHERE Sub_ID = ?`,
    [
      Member_ID,
      Plan_ID,
      Start_Date,
      End_Date || null,
      Start_Date,
      Plan_ID,
      Status,
      req.params.id
    ]
  );

  const row = await findById(req.params.id);
  res.json({ success: true, data: row });
});

export const deleteSubscription = asyncHandler(async (req, res) => {
  const existing = await findById(req.params.id);
  if (!existing) throw new AppError('Subscription not found.', 404);
  await pool.query(`DELETE FROM Subscription WHERE Sub_ID = ?`, [req.params.id]);
  res.json({ success: true, data: { message: 'Subscription deleted successfully.' } });
});

export const refreshStatus = asyncHandler(async (req, res) => {
  const [result] = await pool.query(
    `UPDATE Subscription SET Status = 'Expired' WHERE Status = 'Active' AND End_Date < CURDATE()`
  );
  res.json({
    success: true,
    data: { updated: result.affectedRows, message: `${result.affectedRows} subscription(s) marked Expired.` }
  });
});
