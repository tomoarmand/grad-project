import { body, param, query, validationResult } from 'express-validator';
import mongoose from 'mongoose';

// Environment check for error detail visibility
const isDevelopment = process.env.NODE_ENV === 'development';

// Enhanced sanitization function
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .replace(/data:/gi, '') // Remove data: URLs except for audio
    .replace(/vbscript:/gi, '');
};

// Enhanced validation error handler
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const response = {
      error: 'Validation failed',
    };
    
    // Only include detailed errors in development
    if (isDevelopment) {
      response.details = errors.array();
    } else {
      // In production, just return the first error message for security
      response.message = errors.array()[0]?.msg || 'Invalid input provided';
    }
    
    return res.status(400).json(response);
  }
  next();
};

// Custom validator for MongoDB ObjectIds
export const isValidObjectId = (value) => {
  return mongoose.Types.ObjectId.isValid(value);
};

// Enhanced user validation rules
export const validateUserCreation = [
  body('fullName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Full name must be between 2 and 50 characters')
    .matches(/^[a-zA-ZÀ-ÿ\s'-]+$/)
    .withMessage('Full name can only contain letters, spaces, hyphens, and apostrophes')
    .customSanitizer(sanitizeInput),
  
  body('email')
    .trim()
    .isLength({ max: 100 })
    .withMessage('Email cannot exceed 100 characters')
    .isEmail()
    .withMessage('Please enter a valid email address')
    // REMOVED .normalizeEmail() - this was corrupting emails with dots
    .customSanitizer(sanitizeInput),
  
  body('role')
    .optional()
    .isIn(['teacher', 'student'])
    .withMessage('Role must be either teacher or student')
    .customSanitizer(sanitizeInput),

  // Changed from 'pin' to 'accessCode' to match your route files
  body('accessCode')
    .optional()
    .isLength({ min: 4, max: 10 })
    .withMessage('Access code must be between 4 and 10 characters')
    .matches(/^[a-zA-Z0-9]+$/)
    .withMessage('Access code can only contain letters and numbers')
    .customSanitizer(sanitizeInput),
  
  handleValidationErrors
];

export const validateUserLogin = [
  body('email')
    .trim()
    .isLength({ max: 100 })
    .withMessage('Email cannot exceed 100 characters')
    .isEmail()
    .withMessage('Please enter a valid email address')
    // REMOVED .normalizeEmail() - this was corrupting emails with dots
    .customSanitizer(sanitizeInput),
  
  // Changed from 'pin' to 'accessCode' to match your route files
  body('accessCode')
    .optional()
    .isLength({ min: 4, max: 10 })
    .withMessage('Access code must be between 4 and 10 characters')
    .matches(/^[a-zA-Z0-9]+$/)
    .withMessage('Access code can only contain letters and numbers')
    .customSanitizer(sanitizeInput),
  
  handleValidationErrors
];

// Enhanced exercise validation rules
export const validateExerciseCreation = [
  body('userId')
    .custom(isValidObjectId)
    .withMessage('Invalid user ID format'),
  
  body('correctAnswer')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Correct answer cannot exceed 1000 characters')
    .customSanitizer(sanitizeInput),
  
  body('audioData')
    .optional()
    .custom((value) => {
      if (!value) return true;
      
      // Check if it's a valid base64 data URL for audio
      const base64Pattern = /^data:audio\/[a-z0-9]+;base64,/i;
      if (!base64Pattern.test(value)) {
        throw new Error('Audio data must be a valid base64 encoded audio file');
      }
      
      // Estimate size (base64 is ~4/3 the size of original)
      const base64Data = value.split(',')[1];
      if (!base64Data) {
        throw new Error('Invalid base64 audio data format');
      }
      
      const sizeInBytes = (base64Data.length * 3) / 4;
      const maxSize = 10 * 1024 * 1024; // 10MB limit
      
      if (sizeInBytes > maxSize) {
        throw new Error('Audio file too large (max 10MB)');
      }
      
      return true;
    }),
  
  body('studentId')
    .optional()
    .custom((value) => !value || isValidObjectId(value))
    .withMessage('Invalid student ID format'),
  
  body('folderId')
    .optional()
    .custom((value) => !value || isValidObjectId(value))
    .withMessage('Invalid folder ID format'),
  
  body('title')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Title cannot exceed 200 characters')
    .customSanitizer(sanitizeInput),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters')
    .customSanitizer(sanitizeInput),
  
  handleValidationErrors
];

// Assignment validation rules
export const validateAssignmentCreation = [
  body('exerciseIds')
    .isArray({ min: 1 })
    .withMessage('At least one exercise must be selected')
    .custom((exercises) => {
      return exercises.every(id => isValidObjectId(id));
    })
    .withMessage('All exercise IDs must be valid'),

  body('studentIds')
    .isArray({ min: 1 })
    .withMessage('At least one student must be selected')
    .custom((students) => {
      return students.every(id => isValidObjectId(id));
    })
    .withMessage('All student IDs must be valid'),

  body('title')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Title cannot exceed 200 characters')
    .customSanitizer(sanitizeInput),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters')
    .customSanitizer(sanitizeInput),

  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid date'),

  handleValidationErrors
];

// Folder validation rules
export const validateFolderCreation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Folder name must be between 1 and 100 characters')
    .customSanitizer(sanitizeInput),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters')
    .customSanitizer(sanitizeInput),

  body('parentId')
    .optional()
    .custom((value) => !value || isValidObjectId(value))
    .withMessage('Invalid parent folder ID'),

  handleValidationErrors
];

// Generic ObjectId parameter validator
export const validateObjectIdParam = (paramName) => [
  param(paramName)
    .custom(isValidObjectId)
    .withMessage(`Invalid ${paramName} format`),
  
  handleValidationErrors
];

// Query parameter validators
export const validatePaginationQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('sort')
    .optional()
    .isIn(['createdAt', '-createdAt', 'name', '-name', 'updatedAt', '-updatedAt'])
    .withMessage('Invalid sort parameter'),

  handleValidationErrors
];

// Search query validator
export const validateSearchQuery = [
  query('q')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters')
    .customSanitizer(sanitizeInput),

  handleValidationErrors
];

// Generic text input validator for updates
export const validateTextUpdate = (fieldName, maxLength = 1000) => [
  body(fieldName)
    .trim()
    .isLength({ max: maxLength })
    .withMessage(`${fieldName} cannot exceed ${maxLength} characters`)
    .customSanitizer(sanitizeInput),

  handleValidationErrors
];