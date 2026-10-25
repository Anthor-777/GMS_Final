import { Router } from 'express';
import { body } from 'express-validator';
import {
  createMaintenance,
  deleteMaintenance,
  getMaintenance,
  listMaintenance,
  updateMaintenance
} from '../controllers/maintenance.js';
import { idParam, isDateField, validate } from '../middleware/validate.js';

const router = Router();

const logBody = [
  body('Equip_ID').isInt({ min: 1 }).withMessage('Equip_ID must be a positive integer'),
  body('Service_Date').custom(isDateField).withMessage('Service_Date must be YYYY-MM-DD'),
  body('Cost').isFloat({ min: 0 }).withMessage('Cost must be a number >= 0'),
  body('Technician').trim().notEmpty().isLength({ max: 100 }).withMessage('Technician is required (max 100)')
];

router.get('/', listMaintenance);
router.get('/:id', idParam, getMaintenance);
router.post('/', logBody, validate, createMaintenance);
router.put('/:id', idParam, logBody, validate, updateMaintenance);
router.delete('/:id', idParam, deleteMaintenance);

export default router;
