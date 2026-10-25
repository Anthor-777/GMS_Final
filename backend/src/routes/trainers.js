import { Router } from 'express';
import { body } from 'express-validator';
import { createTrainer, deleteTrainer, getTrainer, listTrainers, updateTrainer } from '../controllers/trainers.js';
import { idParam, validate } from '../middleware/validate.js';

const router = Router();

const trainerBody = [
  body('Name').trim().notEmpty().isLength({ max: 100 }).withMessage('Name is required (max 100)'),
  body('Specialization').trim().notEmpty().isLength({ max: 100 }).withMessage('Specialization is required (max 100)'),
  body('Phone').trim().notEmpty().isLength({ max: 20 }).withMessage('Phone is required (max 20)'),
  body('Salary').isFloat({ min: 0 }).withMessage('Salary must be a number >= 0')
];

router.get('/', listTrainers);
router.get('/:id', idParam, getTrainer);
router.post('/', trainerBody, validate, createTrainer);
router.put('/:id', idParam, trainerBody, validate, updateTrainer);
router.delete('/:id', idParam, deleteTrainer);

export default router;
