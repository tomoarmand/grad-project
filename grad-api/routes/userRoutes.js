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
  if (!hashInitialized) {
    try {
      TEACHER_PIN_HASH = await bcrypt.hash(TEACHER_PIN, 12);
      hashInitialized = true;
      console.log('✅ Teacher PIN configured successfully');
    } catch (error) {
      console.error('❌ Error hashing teacher PIN:', error);
      throw error;
    }
  }
};

initializePinHash().catch(console.error);

const JWT_SECRET = process.env.JWT_SECRET || process.env.API_SECRET || 'fallback-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const verifyAccessCode = async (code, hash) => {
  try {
    return await bcrypt.compare(code, hash);
  } catch (error) {
    console.error('❌ Error in verifyAccessCode:', error);
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

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';
  return input.trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '');
};

const validateEmail = (email) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email) && email.length <= 100;
const validateFullName = (name) => /^[a-zA-Z\s\-']{2,50}$/.test(name);
const validateAccessCode = (code) => /^[a-zA-Z0-9]{4,10}$/.test(code);

// Get all users (protected route)
router.get('/', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ error: 'Access denied. Teacher role required.' });
    }
    
    const users = await User.find().select('-__v');
    res.json(users);
  } catch (error) {
    console.error('GET /users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create user
router.post('/', async (req, res) => {
  try {
    if (!hashInitialized) {
      await initializePinHash();
    }

    const { fullName, email, role = 'student', accessCode } = req.body;

    const sanitizedFullName = sanitizeInput(fullName);
    const sanitizedEmail = sanitizeInput(email);
    const sanitizedRole = role === 'teacher' ? 'teacher' : 'student';
    const sanitizedAccessCode = accessCode ? sanitizeInput(accessCode) : '';

    if (!validateFullName(sanitizedFullName)) {
      return res.status(400).json({ error: 'Invalid full name' });
    }
    if (!validateEmail(sanitizedEmail)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    if (sanitizedRole === 'teacher') {
      if (!sanitizedAccessCode) {
        return res.status(400).json({ error: 'Teacher access code is required' });
      }
      if (!validateAccessCode(sanitizedAccessCode)) {
        return res.status(400).json({ error: 'Invalid teacher access code format' });
      }
      
      if (!TEACHER_PIN_HASH) {
        return res.status(500).json({ error: 'Server configuration error' });
      }
      
      const isValidCode = await verifyAccessCode(sanitizedAccessCode, TEACHER_PIN_HASH);
      if (!isValidCode) {
        return res.status(400).json({ error: 'Incorrect teacher access code' });
      }
    }

    const existingUser = await User.findOne({ email: sanitizedEmail.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    const user = await User.create({
      fullName: sanitizedFullName,
      email: sanitizedEmail.toLowerCase(),
      role: sanitizedRole
    });

    const token = generateToken(user);

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
    res.status(500).json({ error: 'Server error while creating user' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    if (!hashInitialized) {
      await initializePinHash();
    }

    const { email, accessCode } = req.body;

    const sanitizedEmail = sanitizeInput(email);
    const sanitizedAccessCode = accessCode ? sanitizeInput(accessCode) : '';

    if (!validateEmail(sanitizedEmail)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    const user = await User.findOne({ email: sanitizedEmail.toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role === 'teacher') {
      if (!sanitizedAccessCode) {
        return res.status(401).json({ error: 'Teacher access code is required' });
      }
      if (!validateAccessCode(sanitizedAccessCode)) {
        return res.status(401).json({ error: 'Invalid teacher access code format' });
      }
      
      if (!TEACHER_PIN_HASH) {
        return res.status(500).json({ error: 'Server configuration error' });
      }
      
      const isValidCode = await verifyAccessCode(sanitizedAccessCode, TEACHER_PIN_HASH);
      if (!isValidCode) {
        return res.status(401).json({ error: 'Incorrect teacher access code' });
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
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Token validation endpoint
router.post('/verify-token', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-__v');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });
  } catch (error) {
    console.error('POST /users/verify-token error:', error);
    res.status(500).json({ error: 'Server error during token verification' });
  }
});

// Get single user (protected route)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'teacher' && req.user.userId !== req.params.id) {
      return res.status(403).json({ error: 'Access denied. You can only view your own profile.' });
    }

    const user = await User.findById(req.params.id).select('-__v');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('GET /users/:id error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;