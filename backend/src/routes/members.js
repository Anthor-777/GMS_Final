import { Router } from 'express';
import { body } from 'express-validator';
import { createMember, deleteMember, getMember, listMembers, updateMember } from '../controllers/members.js';
import { idParam, isDateField, validate } from '../middleware/validate.js';

const router = Router();

const memberBody = [
  body('Name').trim().notEmpty().isLength({ max: 100 }).withMessage('Name is required (max 100)'),
  body('DOB').custom(isDateField).withMessage('DOB must be YYYY-MM-DD'),
  body('Gender').isIn(['Male', 'Female', 'Other']).withMessage('Gender must be Male, Female or Other'),
  body('Phone').trim().notEmpty().isLength({ max: 20 }).withMessage('Phone is required (max 20)'),
  body('Email').trim().isEmail().isLength({ max: 150 }).withMessage('Email must be a valid unique email'),
  body('Join_Date').custom(isDateField).withMessage('Join_Date must be YYYY-MM-DD')
];

router.get('/', listMembers);
router.get('/:id', idParam, getMember);
router.post('/', memberBody, validate, createMember);
router.put('/:id', idParam, memberBody, validate, updateMember);
router.delete('/:id', idParam, deleteMember);

export default router;
