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

// Initialize PIN hash on startup
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

// Enhanced authentication middleware
const authenticateToken = (req, res, next) => {
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

// ===== NON-PARAMETERIZED ROUTES (defined first) =====

// Get all users (protected route - teacher only)
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

// Create user - using validation middleware
router.post('/', validateUserCreation, async (req, res) => {
  try {
    // Ensure PIN hash is initialized
    if (!hashInitialized) {
      await initializePinHash();
    }

    const { fullName, email, role = 'student', accessCode, password } = req.body;

    // Teacher role requires access code verification
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

    // Check if user already exists - case insensitive check
    const normalizedEmail = email.toLowerCase().trim();
    const escapedEmail = normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const existingUser = await User.findOne({ 
      email: { $regex: new RegExp(`^${escapedEmail}$`, 'i') }
    });
    
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Prepare user data
    const userData = {
      fullName,
      email: normalizedEmail,
      role
    };

    // Handle password for students
    if (role === 'student') {
      if (password) {
        // Password provided during registration
        if (password.length < 6) {
          return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }
        userData.password = await bcrypt.hash(password, 12);
        userData.needsPasswordSetup = false;
      } else {
        // No password provided - flag for setup on next login
        userData.needsPasswordSetup = true;
      }
    }

    // Create new user with normalized email
    const user = await User.create(userData);

    // Generate token
    const token = generateToken(user);

    // Return user data with token
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
    
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: 'Validation error', details: messages });
    }
    
    res.status(500).json({ error: 'Server error while creating user' });
  }
});

// Login route - UPDATED TO REQUIRE PASSWORD FOR STUDENTS WITH PASSWORDS
router.post('/login', validateUserLogin, async (req, res) => {
  try {
    // Ensure PIN hash is initialized
    if (!hashInitialized) {
      await initializePinHash();
    }

    const { email, accessCode, password } = req.body;

    // Case-insensitive email search to handle mixed-case emails in database
    const normalizedEmail = email.toLowerCase().trim();
    const escapedEmail = normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const user = await User.findOne({ 
      email: { $regex: new RegExp(`^${escapedEmail}$`, 'i') }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Teacher login requires access code verification
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

    // Student authentication logic
    if (user.role === 'student') {
      // Check if student needs password setup (no password set yet)
      if (!user.password) {
        // Allow login but flag for password setup
        const token = generateToken(user);
        return res.json({
          _id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          token,
          needsPasswordSetup: true
        });
      }

      // Student has a password - verify it
      if (!password) {
        return res.status(401).json({ error: 'Password is required' });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Incorrect password' });
      }
    }

    // Generate token
    const token = generateToken(user);

    // Return user data with token
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

// Password setup route for existing users
router.post('/setup-password', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Find user by email
    const normalizedEmail = email.toLowerCase().trim();
    const escapedEmail = normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const user = await User.findOne({ 
      email: { $regex: new RegExp(`^${escapedEmail}$`, 'i') }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update user with password
    user.password = hashedPassword;
    user.needsPasswordSetup = false;
    await user.save();

    // Generate new token
    const token = generateToken(user);

    res.json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      token,
      message: 'Password set up successfully'
    });

  } catch (error) {
    console.error('Password setup error:', error);
    res.status(500).json({ error: 'Server error during password setup' });
  }
});

// Enhanced token verification endpoint
router.post('/verify-token', (req, res) => {
  console.log('🔍 Backend: verify-token endpoint called');
  console.log('🔍 Backend: Headers received:', req.headers.authorization ? 'Token present' : 'No token');
  
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log('🔍 Backend: No token provided');
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, async (err, decodedUser) => {
    if (err) {
      console.log('🔍 Backend: Token verification failed:', err.message);
      
      const errorResponses = {
        'TokenExpiredError': { status: 401, error: 'Token expired' },
        'JsonWebTokenError': { status: 401, error: 'Invalid token' },
        'NotBeforeError': { status: 401, error: 'Token not active' }
      };
      
      const response = errorResponses[err.name] || { status: 401, error: 'Token verification failed' };
      return res.status(response.status).json({ error: response.error });
    }

    try {
      console.log('🔍 Backend: Token valid, fetching user data for ID:', decodedUser.userId);
      const user = await User.findById(decodedUser.userId).select('-__v');
      
      if (!user) {
        console.log('🔍 Backend: User not found in database');
        return res.status(404).json({ error: 'User not found' });
      }

      console.log('🔍 Backend: User found, returning data for:', user.email);
      res.json({
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      });
    } catch (error) {
      console.error('🔍 Backend: Database error during token verification:', error);
      res.status(500).json({ error: 'Server error during token verification' });
    }
  });
});

// ===== PARAMETERIZED ROUTES (defined after non-parameterized routes) =====

// Get single user (protected route)
router.get('/:id', validateObjectIdParam('id'), authenticateToken, async (req, res) => {
  try {
    // Users can only view their own profile, teachers can view any profile
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

// Update user (protected route)
router.put('/:id', validateObjectIdParam('id'), authenticateToken, async (req, res) => {
  try {
    // Users can only update their own profile, teachers can update any profile
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

// Delete user (protected route - teacher only)
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