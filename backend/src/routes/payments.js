import { Router } from 'express';
import { body } from 'express-validator';
import { createPayment, deletePayment, getPayment, listPayments, updatePayment } from '../controllers/payments.js';
import { idParam, isDateField, validate } from '../middleware/validate.js';

const router = Router();

const paymentBody = [
  body('Sub_ID').isInt({ min: 1 }).withMessage('Sub_ID must be a positive integer'),
  body('Amount').isFloat({ gt: 0 }).withMessage('Amount must be a number > 0'),
  body('Paid_On').custom(isDateField).withMessage('Paid_On must be YYYY-MM-DD'),
  body('Mode').isIn(['Cash', 'Card', 'UPI', 'Net Banking']).withMessage('Mode must be Cash, Card, UPI or Net Banking')
];

router.get('/', listPayments);
router.get('/:id', idParam, getPayment);
router.post('/', paymentBody, validate, createPayment);
router.put('/:id', idParam, paymentBody, validate, updatePayment);
router.delete('/:id', idParam, deletePayment);

export default router;
