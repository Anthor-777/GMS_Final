import { param, validationResult } from 'express-validator';
import { isDateString, isDateTimeString, isTimeString } from '../utils/dateHelpers.js';

export function validate(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors: result.array().map((err) => ({
      field: err.path,
      message: err.msg
    }))
  });
}

export const idParam = [
  param('id').isInt({ min: 1 }).withMessage('id must be a positive integer'),
  validate
];

export const isDateField = (value) => isDateString(value);
export const isTimeField = (value) => isTimeString(value);
export const isDateTimeField = (value) => isDateTimeString(value);
