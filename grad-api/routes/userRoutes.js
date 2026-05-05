import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import User from '../models/User.js';
import dotenv from 'dotenv';
import { 
  validateUserCreation, 
  validateUserLogin,
  validateObjectIdParam 
} from '../middleware/validation.js';

dotenv.config();

const router = express.Router();

const TEACHER_PIN = process.env.TEACHER_PIN;

let TEACHER_PIN_HASH = null;
let hashInitialized = false;

const initializePinHash = async () => {
  if (!hashInitialized) {
    try {
      if (!TEACHER_PIN) {
        throw new Error('TEACHER_PIN environment variable is not set');
      }
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

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.log('🔍 Token verification failed:', err.message);
      
      const errorResponses = {
        'TokenExpiredError': { status: 401, error: 'Token expired' },
        'JsonWebTokenError': { status: 401, error: 'Invalid token' },
        'NotBeforeError': { status: 401, error: 'Token not active' }
      };
      
      const response = errorResponses[err.name] || { status: 403, error: 'Token verification failed' };
      return res.status(response.status).json({ error: response.error });
    }
    
    req.user = user;
    next();
  });
};

// ===== NON-PARAMETERIZED ROUTES =====

router.get('/', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ error: 'Access denied. Teacher role required.' });
    }
    
    const users = await User.find().select('-__v').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('GET /users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', validateUserCreation, async (req, res) => {
  try {
    if (!hashInitialized) {
      await initializePinHash();
    }

    const { fullName, email, role = 'student', accessCode, password } = req.body;

    if (role === 'teacher') {
      if (!accessCode) {
        return res.status(400).json({ error: 'Teacher access code is required' });
      }
      
      if (!TEACHER_PIN_HASH) {
        return res.status(500).json({ error: 'Server configuration error' });
      }
      
      const isValidCode = await verifyAccessCode(accessCode, TEACHER_PIN_HASH);
      if (!isValidCode) {
        return res.status(400).json({ error: 'Incorrect teacher access code' });
      }
    }

    const normalizedEmail = email.toLowerCase().trim();
    const escapedEmail = normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const existingUser = await User.findOne({ 
      email: { $regex: new RegExp(`^${escapedEmail}$`, 'i') }
    });
    
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    const userData = {
      fullName,
      email: normalizedEmail,
      role
    };

    if (role === 'student' && password) {
      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }
      userData.password = await bcrypt.hash(password, 12);
    }

    const user = await User.create(userData);
    const token = generateToken(user);

    res.status(201).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      token
    });

  } catch (error) {
    console.error('POST /users error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: 'Validation error', details: messages });
    }
    
    res.status(500).json({ error: 'Server error while creating user' });
  }
});

router.post('/login', validateUserLogin, async (req, res) => {
  try {
    if (!hashInitialized) {
      await initializePinHash();
    }

    const { email, accessCode, password } = req.body;

    const normalizedEmail = email.toLowerCase().trim();
    const escapedEmail = normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const user = await User.findOne({ 
      email: { $regex: new RegExp(`^${escapedEmail}$`, 'i') }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role === 'teacher') {
      if (!accessCode) {
        return res.status(401).json({ error: 'Teacher access code is required' });
      }
      
      if (!TEACHER_PIN_HASH) {
        return res.status(500).json({ error: 'Server configuration error' });
      }
      
      const isValidCode = await verifyAccessCode(accessCode, TEACHER_PIN_HASH);
      if (!isValidCode) {
        return res.status(401).json({ error: 'Incorrect teacher access code' });
      }
    }

    if (user.role === 'student') {
      if (!user.password) {
        return res.status(200).json({ 
          _id: user._id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          needsPasswordSetup: true 
        });
      }

      if (!password) {
        return res.status(401).json({ error: 'Password is required' });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Incorrect password' });
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
      token
    });

  } catch (error) {
    console.error('POST /users/login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

router.post('/setup-password', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const escapedEmail = normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const user = await User.findOne({ 
      email: { $regex: new RegExp(`^${escapedEmail}$`, 'i') }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role !== 'student') {
      return res.status(400).json({ error: 'Password setup is only for students' });
    }

    user.password = await bcrypt.hash(password, 12);
    await user.save();

    const token = generateToken(user);

    res.json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      token
    });

  } catch (error) {
    console.error('POST /users/setup-password error:', error);
    res.status(500).json({ error: 'Server error during password setup' });
  }
});

router.post('/teacher-reset-password', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ error: 'Access denied. Teacher role required.' });
    }

    const { studentId, newPassword } = req.body;

    if (!studentId || !newPassword) {
      return res.status(400).json({ error: 'Student ID and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const student = await User.findById(studentId);

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    if (student.role !== 'student') {
      return res.status(400).json({ error: 'Can only reset passwords for students' });
    }

    student.password = await bcrypt.hash(newPassword, 12);
    await student.save();

    res.json({
      message: 'Password reset successfully',
      studentName: student.fullName,
      studentEmail: student.email
    });

  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Server error during password reset' });
  }
});

router.post('/verify-token', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, async (err, decodedUser) => {
    if (err) {
      const errorResponses = {
        'TokenExpiredError': { status: 401, error: 'Token expired' },
        'JsonWebTokenError': { status: 401, error: 'Invalid token' },
        'NotBeforeError': { status: 401, error: 'Token not active' }
      };
      
      const response = errorResponses[err.name] || { status: 401, error: 'Token verification failed' };
      return res.status(response.status).json({ error: response.error });
    }

    try {
      const user = await User.findById(decodedUser.userId).select('-__v');
      
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
      console.error('Database error during token verification:', error);
      res.status(500).json({ error: 'Server error during token verification' });
    }
  });
});

// ===== PARAMETERIZED ROUTES =====

router.get('/:id', validateObjectIdParam('id'), authenticateToken, async (req, res) => {
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

router.put('/:id', validateObjectIdParam('id'), authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'teacher' && req.user.userId !== req.params.id) {
      return res.status(403).json({ error: 'Access denied. You can only update your own profile.' });
    }

    const { fullName } = req.body;
    
    if (!fullName || fullName.trim().length < 2) {
      return res.status(400).json({ error: 'Full name is required and must be at least 2 characters' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { fullName: fullName.trim() },
      { new: true, runValidators: true }
    ).select('-__v');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('PUT /users/:id error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: 'Validation error', details: messages });
    }
    
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', validateObjectIdParam('id'), authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ error: 'Access denied. Teacher role required.' });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully', deletedUser: user._id });
  } catch (error) {
    console.error('DELETE /users/:id error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;