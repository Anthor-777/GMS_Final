import { Router } from 'express';
import { body } from 'express-validator';
import { login } from '../controllers/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.post(
  '/login',
  [
    body('username').trim().notEmpty().withMessage('username is required'),
    body('password').notEmpty().withMessage('password is required')
  ],
  validate,
  login
);

export default router;
