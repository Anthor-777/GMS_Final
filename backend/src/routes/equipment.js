import { Router } from 'express';
import { body } from 'express-validator';
import {
  createEquipment,
  deleteEquipment,
  getEquipment,
  listEquipment,
  updateEquipment
} from '../controllers/equipment.js';
import { idParam, isDateField, validate } from '../middleware/validate.js';

const router = Router();

const conditions = ['Excellent', 'Good', 'Fair', 'Poor', 'Out of Order'];

const equipmentBody = [
  body('Name').trim().notEmpty().isLength({ max: 100 }).withMessage('Name is required (max 100)'),
  body('Category').trim().notEmpty().isLength({ max: 100 }).withMessage('Category is required (max 100)'),
  body('Purchase_Date').custom(isDateField).withMessage('Purchase_Date must be YYYY-MM-DD'),
  body('Condition').isIn(conditions).withMessage(`Condition must be one of: ${conditions.join(', ')}`)
];

router.get('/', listEquipment);
router.get('/:id', idParam, getEquipment);
router.post('/', equipmentBody, validate, createEquipment);
router.put('/:id', idParam, equipmentBody, validate, updateEquipment);
router.delete('/:id', idParam, deleteEquipment);

export default router;
