import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

const TEACHER_PIN = process.env.TEACHER_PIN;

let TEACHER_PIN_HASH = null;
let hashInitialized = false;

const initializePinHash = async () => {
  if (!hashInitialized && TEACHER_PIN) {
    try {
      TEACHER_PIN_HASH = await bcrypt.hash(TEACHER_PIN, 12);
      hashInitialized = true;
      console.log('Teacher PIN configured successfully');
    } catch (error) {
      console.error('Error hashing teacher PIN:', error);
      throw error;
    }
  }
};

initializePinHash().catch(console.error);

const JWT_SECRET = process.env.JWT_SECRET || process.env.API_SECRET || 'fallback-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Enhanced JWT secret validation
if (JWT_SECRET === 'fallback-secret-key') {
  console.warn('WARNING: Using fallback JWT secret. Set JWT_SECRET environment variable in production.');
}

const verifyAccessCode = async (code, hash) => {
  try {
    if (!hash) {
      console.error('No teacher PIN hash available');
      return false;
    }
    return await bcrypt.compare(code, hash);
  } catch (error) {
    console.error('Error in verifyAccessCode:', error);
    return false;
  }
};

const generateToken = (user) => {
  return jwt.sign(
    { 
      userId: user._id, 
      email: user.email, 
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// Enhanced authentication middleware with better error handling
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, async (err, decodedUser) => {
    if (err) {
      console.log('Token verification failed:', err.message);
      
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          error: 'Token expired',
          code: 'TOKEN_EXPIRED'
        });
      } else if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          error: 'Invalid token',
          code: 'INVALID_TOKEN'
        });
      } else {
        return res.status(403).json({ 
          error: 'Token verification failed',
          code: 'TOKEN_VERIFICATION_FAILED'
        });
      }
    }

    // Additional validation - check if user still exists
    try {
      const user = await User.findById(decodedUser.userId).select('-__v');
      if (!user) {
        return res.status(401).json({ 
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }
      
      req.user = decodedUser;
      req.userDoc = user; // Also provide full user document
      next();
    } catch (dbError) {
      console.error('Database error during token verification:', dbError);
      return res.status(500).json({ 
        error: 'Server error during authentication',
        code: 'DB_ERROR'
      });
    }
  });
};

// Enhanced input sanitization
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';
  return input.trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '');
};

// Enhanced validation functions
const validateEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email) && email.length <= 100;
};

const validateFullName = (name) => {
  const nameRegex = /^[a-zA-ZÀ-ÿ\s\-']{2,50}$/;
  return nameRegex.test(name);
};

const validateAccessCode = (code) => {
  const codeRegex = /^[a-zA-Z0-9]{4,10}$/;
  return codeRegex.test(code);
};

// Get all users (protected route)
router.get('/', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ 
        error: 'Access denied. Teacher role required.',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }
    
    const users = await User.find().select('-__v').lean();
    res.json(users);
  } catch (error) {
    console.error('GET /users error:', error);
    res.status(500).json({ 
      error: 'Server error',
      code: 'SERVER_ERROR'
    });
  }
});

// Create user with enhanced error handling
router.post('/', async (req, res) => {
  try {
    // Initialize PIN hash if needed
    if (!hashInitialized) {
      await initializePinHash();
    }

    const { fullName, email, role = 'student', accessCode } = req.body;

    // Enhanced input validation
    if (!fullName || !email) {
      return res.status(400).json({ 
        error: 'Full name and email are required',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    const sanitizedFullName = sanitizeInput(fullName);
    const sanitizedEmail = sanitizeInput(email);
    const sanitizedRole = role === 'teacher' ? 'teacher' : 'student';
    const sanitizedAccessCode = accessCode ? sanitizeInput(accessCode) : '';

    // Validation
    if (!validateFullName(sanitizedFullName)) {
      return res.status(400).json({ 
        error: 'Invalid full name. Must be 2-50 characters and contain only letters, spaces, hyphens, and apostrophes.',
        code: 'INVALID_FULL_NAME'
      });
    }
    
    if (!validateEmail(sanitizedEmail)) {
      return res.status(400).json({ 
        error: 'Invalid email address format',
        code: 'INVALID_EMAIL'
      });
    }

    // Teacher-specific validation
    if (sanitizedRole === 'teacher') {
      if (!sanitizedAccessCode) {
        return res.status(400).json({ 
          error: 'Teacher access code is required',
          code: 'MISSING_ACCESS_CODE'
        });
      }
      
      if (!validateAccessCode(sanitizedAccessCode)) {
        return res.status(400).json({ 
          error: 'Invalid teacher access code format. Must be 4-10 alphanumeric characters.',
          code: 'INVALID_ACCESS_CODE_FORMAT'
        });
      }
      
      if (!TEACHER_PIN_HASH) {
        return res.status(500).json({ 
          error: 'Server configuration error. Teacher PIN not configured.',
          code: 'SERVER_CONFIG_ERROR'
        });
      }
      
      const isValidCode = await verifyAccessCode(sanitizedAccessCode, TEACHER_PIN_HASH);
      if (!isValidCode) {
        return res.status(400).json({ 
          error: 'Incorrect teacher access code',
          code: 'INCORRECT_ACCESS_CODE'
        });
      }
    }

    // Check for existing user
    const existingUser = await User.findOne({ 
      email: sanitizedEmail.toLowerCase() 
    }).lean();
    
    if (existingUser) {
      return res.status(400).json({ 
        error: 'User already exists with this email address',
        code: 'USER_ALREADY_EXISTS'
      });
    }

    // Create user
    const user = await User.create({
      fullName: sanitizedFullName,
      email: sanitizedEmail.toLowerCase(),
      role: sanitizedRole
    });

    const token = generateToken(user);

    // Return user data without sensitive information
    res.status(201).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      token: token
    });

  } catch (error) {
    console.error('POST /users error:', error);
    
    // Handle specific MongoDB errors
    if (error.code === 11000) {
      return res.status(400).json({ 
        error: 'User already exists with this email address',
        code: 'DUPLICATE_EMAIL'
      });
    }
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        error: 'Invalid user data',
        details: Object.values(error.errors).map(e => e.message),
        code: 'VALIDATION_ERROR'
      });
    }
    
    res.status(500).json({ 
      error: 'Server error while creating user',
      code: 'SERVER_ERROR'
    });
  }
});

// Enhanced login endpoint
router.post('/login', async (req, res) => {
  try {
    if (!hashInitialized) {
      await initializePinHash();
    }

    const { email, accessCode } = req.body;

    if (!email) {
      return res.status(400).json({ 
        error: 'Email is required',
        code: 'MISSING_EMAIL'
      });
    }

    const sanitizedEmail = sanitizeInput(email);
    const sanitizedAccessCode = accessCode ? sanitizeInput(accessCode) : '';

    if (!validateEmail(sanitizedEmail)) {
      return res.status(400).json({ 
        error: 'Invalid email address format',
        code: 'INVALID_EMAIL'
      });
    }

    const user = await User.findOne({ 
      email: sanitizedEmail.toLowerCase() 
    }).lean();
    
    if (!user) {
      return res.status(404).json({ 
        error: 'No account found with this email address',
        code: 'USER_NOT_FOUND'
      });
    }

    // Teacher authentication
    if (user.role === 'teacher') {
      if (!sanitizedAccessCode) {
        return res.status(401).json({ 
          error: 'Teacher access code is required',
          code: 'MISSING_ACCESS_CODE'
        });
      }
      
      if (!validateAccessCode(sanitizedAccessCode)) {
        return res.status(401).json({ 
          error: 'Invalid teacher access code format',
          code: 'INVALID_ACCESS_CODE_FORMAT'
        });
      }
      
      if (!TEACHER_PIN_HASH) {
        return res.status(500).json({ 
          error: 'Server configuration error',
          code: 'SERVER_CONFIG_ERROR'
        });
      }
      
      const isValidCode = await verifyAccessCode(sanitizedAccessCode, TEACHER_PIN_HASH);
      if (!isValidCode) {
        return res.status(401).json({ 
          error: 'Incorrect teacher access code',
          code: 'INCORRECT_ACCESS_CODE'
        });
      }
    }

    const token = generateToken(user);

    res.json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      token: token
    });

  } catch (error) {
    console.error('POST /users/login error:', error);
    
    if (error.name === 'MongooseError' || error.name === 'MongoError') {
      return res.status(503).json({ 
        error: 'Database temporarily unavailable',
        code: 'DB_ERROR'
      });
    }
    
    res.status(500).json({ 
      error: 'Server error during login',
      code: 'SERVER_ERROR'
    });
  }
});

// Enhanced token verification endpoint
router.post('/verify-token', (req, res) => {
  console.log('Token verification endpoint called');
  
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log('No token provided for verification');
    return res.status(401).json({ 
      error: 'Access token required',
      code: 'MISSING_TOKEN'
    });
  }

  jwt.verify(token, JWT_SECRET, async (err, decodedUser) => {
    if (err) {
      console.log('Token verification failed:', err.message);
      
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          error: 'Token expired',
          code: 'TOKEN_EXPIRED'
        });
      } else if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          error: 'Invalid token',
          code: 'INVALID_TOKEN'
        });
      } else {
        return res.status(401).json({ 
          error: 'Token verification failed',
          code: 'TOKEN_VERIFICATION_FAILED'
        });
      }
    }

    try {
      console.log('Token valid, fetching user data for ID:', decodedUser.userId);
      const user = await User.findById(decodedUser.userId).select('-__v').lean();
      
      if (!user) {
        console.log('User not found in database');
        return res.status(404).json({ 
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      console.log('User found, returning data for:', user.email);
      res.json({
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      });
    } catch (error) {
      console.error('Database error during token verification:', error);
      res.status(500).json({ 
        error: 'Server error during token verification',
        code: 'DB_ERROR'
      });
    }
  });
});

// Get single user (protected route)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    // Authorization check
    if (req.user.role !== 'teacher' && req.user.userId !== req.params.id) {
      return res.status(403).json({ 
        error: 'Access denied. You can only view your own profile.',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    // Validate ObjectId format
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        error: 'Invalid user ID format',
        code: 'INVALID_ID_FORMAT'
      });
    }

    const user = await User.findById(req.params.id).select('-__v').lean();
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }
    
    res.json(user);
  } catch (error) {
    console.error('GET /users/:id error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        error: 'Invalid user ID format',
        code: 'INVALID_ID_FORMAT'
      });
    }
    
    res.status(500).json({ 
      error: 'Server error',
      code: 'SERVER_ERROR'
    });
  }
});

// Logout endpoint (optional - mainly for logging purposes)
router.post('/logout', authenticateToken, (req, res) => {
  console.log(`User ${req.user.email} logged out`);
  res.json({ message: 'Logged out successfully' });
});

export default router;