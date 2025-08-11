import { body, param, query, validationResult } from 'express-validator';
import mongoose from 'mongoose';

// Custom sanitization function
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '');
};

// Validation error handler
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Custom validator for MongoDB ObjectIds
export const isValidObjectId = (value) => {
  return mongoose.Types.ObjectId.isValid(value);
};

// User validation rules
export const validateUserCreation = [
  body('fullName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Full name must be 2-50 characters')
    .matches(/^[a-zA-ZÀ-ÿ\s'-]+$/)
    .withMessage('Full name contains invalid characters')
    .customSanitizer(sanitizeInput),
  
  body('email')
    .trim()
    .isLength({ max: 100 })
    .withMessage('Email cannot exceed 100 characters')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail()
    .customSanitizer(sanitizeInput),
  
  body('role')
    .optional()
    .isIn(['teacher', 'student'])
    .withMessage('Role must be either teacher or student'),
  
  handleValidationErrors
];

export const validateUserLogin = [
  body('email')
    .trim()
    .isLength({ max: 100 })
    .withMessage('Email cannot exceed 100 characters')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail()
    .customSanitizer(sanitizeInput),
  
  body('pin')
    .optional()
    .isLength({ min: 4, max: 10 })
    .withMessage('PIN must be 4-10 characters')
    .matches(/^[a-zA-Z0-9]+$/)
    .withMessage('PIN can only contain letters and numbers')
    .customSanitizer(sanitizeInput),
  
  handleValidationErrors
];

// Exercise validation rules
export const validateExerciseCreation = [
  body('userId')
    .custom(isValidObjectId)
    .withMessage('Invalid userId'),
  
  body('correctAnswer')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Correct answer cannot exceed 100 characters')
    .customSanitizer(sanitizeInput),
  
  body('audioData')
    .optional()
    .isLength({ max: 50 * 1024 * 1024 })
    .withMessage('Audio data too large'),
  
  body('studentId')
    .optional()
    .custom((value) => !value || isValidObjectId(value))
    .withMessage('Invalid studentId'),
  
  body('folderId')
    .optional()
    .custom((value) => !value || isValidObjectId(value))
    .withMessage('Invalid folderId'),
  
  handleValidationErrors
];

export const validateObjectIdParam = (paramName) => [
  param(paramName)
    .custom(isValidObjectId)
    .withMessage(`Invalid ${paramName}`),
  
  handleValidationErrors
];