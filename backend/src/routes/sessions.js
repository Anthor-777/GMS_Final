import { Router } from 'express';
import { body } from 'express-validator';
import { createSession, deleteSession, getSession, listSessions, updateSession } from '../controllers/sessions.js';
import { idParam, isDateTimeField, validate } from '../middleware/validate.js';

const router = Router();

const sessionBody = [
  body('Member_ID').isInt({ min: 1 }).withMessage('Member_ID must be a positive integer'),
  body('Trainer_ID').isInt({ min: 1 }).withMessage('Trainer_ID must be a positive integer'),
  body('Slot_DateTime').custom(isDateTimeField).withMessage('Slot_DateTime must be YYYY-MM-DD HH:MM:SS'),
  body('Focus_Area').trim().notEmpty().isLength({ max: 100 }).withMessage('Focus_Area is required (max 100)')
];

router.get('/', listSessions);
router.get('/:id', idParam, getSession);
router.post('/', sessionBody, validate, createSession);
router.put('/:id', idParam, sessionBody, validate, updateSession);
router.delete('/:id', idParam, deleteSession);

export default router;
