import { pool } from '../config/db.js';
import { AppError } from '../middleware/errorHandler.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { likeTerm, parseListParams, quoteIdent, sendList } from '../utils/dateHelpers.js';

const SORT = [
  'Att_ID',
  'Member_ID',
  'Visit_Date',
  'Check_In',
  'Check_Out',
  'Member_Name',
  'Check_In_At',
  'Check_Out_At',
  'Attendance_State',
  'Duration_Minutes'
];

async function findById(id) {
  const [rows] = await pool.query(
    `SELECT * FROM vw_attendance_details WHERE Att_ID = ?`,
    [id]
  );
  return rows[0] || null;
}

export const listAttendance = asyncHandler(async (req, res) => {
  const { page, limit, search, sortBy, order, offset } = parseListParams(req.query, SORT, 'Att_ID');
  const params = [];
  let where = '';
  if (search) {
    where = `WHERE (Member_Name LIKE ? OR CAST(Visit_Date AS CHAR) LIKE ?)`;
    params.push(likeTerm(search), likeTerm(search));
  }
  const [countRows] = await pool.query(`SELECT COUNT(*) AS total FROM vw_attendance_details ${where}`, params);
  const [rows] = await pool.query(
    `SELECT * FROM vw_attendance_details ${where} ORDER BY ${quoteIdent(sortBy)} ${order} LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  sendList(res, rows, countRows[0].total, page, limit);
});

export const getAttendance = asyncHandler(async (req, res) => {
  const row = await findById(req.params.id);
  if (!row) throw new AppError('Attendance record not found.', 404);
  res.json({ success: true, data: row });
});

export const createAttendance = asyncHandler(async (req, res) => {
  const { Member_ID, Visit_Date, Check_In, Check_Out } = req.body;
  const checkOut = Check_Out === undefined || Check_Out === '' ? null : Check_Out;

  const [result] = await pool.query(
    `INSERT INTO Attendance (Member_ID, Visit_Date, Check_In, Check_Out)
     VALUES (?, COALESCE(?, CURDATE()), COALESCE(?, CURTIME()), ?)`,
    [Member_ID, Visit_Date || null, Check_In || null, checkOut]
  );
  const row = await findById(result.insertId);
  res.status(201).json({ success: true, data: row });
});

export const updateAttendance = asyncHandler(async (req, res) => {
  const existing = await findById(req.params.id);
  if (!existing) throw new AppError('Attendance record not found.', 404);
  const { Member_ID, Visit_Date, Check_In } = req.body;
  const Check_Out = req.body.Check_Out === undefined || req.body.Check_Out === '' ? null : req.body.Check_Out;

  await pool.query(
    `UPDATE Attendance SET Member_ID = ?, Visit_Date = ?, Check_In = ?, Check_Out = ? WHERE Att_ID = ?`,
    [Member_ID, Visit_Date, Check_In, Check_Out, req.params.id]
  );
  const row = await findById(req.params.id);
  res.json({ success: true, data: row });
});

export const checkoutAttendance = asyncHandler(async (req, res) => {
  const [result] = await pool.query(
    `UPDATE Attendance SET Check_Out = CURTIME() WHERE Att_ID = ? AND Check_Out IS NULL`,
    [req.params.id]
  );

  if (result.affectedRows === 0) {
    const existing = await findById(req.params.id);
    if (!existing) throw new AppError('Attendance record not found.', 404);
    throw new AppError('This visit is already checked out.', 400);
  }

  const row = await findById(req.params.id);
  res.json({ success: true, data: row });
});

export const deleteAttendance = asyncHandler(async (req, res) => {
  const existing = await findById(req.params.id);
  if (!existing) throw new AppError('Attendance record not found.', 404);
  await pool.query(`DELETE FROM Attendance WHERE Att_ID = ?`, [req.params.id]);
  res.json({ success: true, data: { message: 'Attendance record deleted successfully.' } });
});
