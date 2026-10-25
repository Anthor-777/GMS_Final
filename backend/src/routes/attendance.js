import { Router } from 'express';
import { body } from 'express-validator';
import {
  checkoutAttendance,
  createAttendance,
  deleteAttendance,
  getAttendance,
  listAttendance,
  updateAttendance
} from '../controllers/attendance.js';
import { idParam, isDateField, isTimeField, validate } from '../middleware/validate.js';

const router = Router();

const createBody = [
  body('Member_ID').isInt({ min: 1 }).withMessage('Member_ID must be a positive integer'),
  body('Visit_Date').optional({ values: 'falsy' }).custom(isDateField).withMessage('Visit_Date must be YYYY-MM-DD'),
  body('Check_In').optional({ values: 'falsy' }).custom(isTimeField).withMessage('Check_In must be HH:MM:SS'),
  body('Check_Out').optional({ values: 'falsy' }).custom(isTimeField).withMessage('Check_Out must be HH:MM:SS')
];

const updateBody = [
  body('Member_ID').isInt({ min: 1 }).withMessage('Member_ID must be a positive integer'),
  body('Visit_Date').custom(isDateField).withMessage('Visit_Date must be YYYY-MM-DD'),
  body('Check_In').custom(isTimeField).withMessage('Check_In must be HH:MM:SS'),
  body('Check_Out').optional({ values: 'falsy' }).custom(isTimeField).withMessage('Check_Out must be HH:MM:SS')
];

router.get('/', listAttendance);
router.patch('/:id/checkout', idParam, checkoutAttendance);
router.get('/:id', idParam, getAttendance);
router.post('/', createBody, validate, createAttendance);
router.put('/:id', idParam, updateBody, validate, updateAttendance);
router.delete('/:id', idParam, deleteAttendance);

export default router;
