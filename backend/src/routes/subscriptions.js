import { Router } from 'express';
import { body } from 'express-validator';
import {
  createSubscription,
  deleteSubscription,
  getSubscription,
  listSubscriptions,
  refreshStatus,
  updateSubscription
} from '../controllers/subscriptions.js';
import { idParam, isDateField, validate } from '../middleware/validate.js';

const router = Router();

const optionalEndDate = body('End_Date')
  .optional({ values: 'falsy' })
  .custom(isDateField)
  .withMessage('End_Date must be YYYY-MM-DD');

const createBody = [
  body('Member_ID').isInt({ min: 1 }).withMessage('Member_ID must be a positive integer'),
  body('Plan_ID').isInt({ min: 1 }).withMessage('Plan_ID must be a positive integer'),
  body('Start_Date').custom(isDateField).withMessage('Start_Date must be YYYY-MM-DD'),
  optionalEndDate,
  body('Status').optional().isIn(['Active', 'Expired', 'Cancelled']).withMessage('Invalid Status')
];

const updateBody = [
  body('Member_ID').isInt({ min: 1 }).withMessage('Member_ID must be a positive integer'),
  body('Plan_ID').isInt({ min: 1 }).withMessage('Plan_ID must be a positive integer'),
  body('Start_Date').custom(isDateField).withMessage('Start_Date must be YYYY-MM-DD'),
  optionalEndDate,
  body('Status').isIn(['Active', 'Expired', 'Cancelled']).withMessage('Status must be Active, Expired or Cancelled')
];

router.post('/refresh-status', refreshStatus);
router.get('/', listSubscriptions);
router.get('/:id', idParam, getSubscription);
router.post('/', createBody, validate, createSubscription);
router.put('/:id', idParam, updateBody, validate, updateSubscription);
router.delete('/:id', idParam, deleteSubscription);

export default router;
