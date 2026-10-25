import { Router } from 'express';
import { body } from 'express-validator';
import { createPlan, deletePlan, getPlan, listPlans, updatePlan } from '../controllers/plans.js';
import { idParam, validate } from '../middleware/validate.js';

const router = Router();

const planBody = [
  body('Plan_Name').trim().notEmpty().isLength({ max: 100 }).withMessage('Plan_Name is required (max 100)'),
  body('Duration_Months').isInt({ gt: 0 }).withMessage('Duration_Months must be an integer > 0'),
  body('Fee').isFloat({ min: 0 }).withMessage('Fee must be a number >= 0')
];

router.get('/', listPlans);
router.get('/:id', idParam, getPlan);
router.post('/', planBody, validate, createPlan);
router.put('/:id', idParam, planBody, validate, updatePlan);
router.delete('/:id', idParam, deletePlan);

export default router;
