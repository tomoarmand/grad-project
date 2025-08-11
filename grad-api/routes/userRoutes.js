import express from 'express';
import User from '../models/User.js';
import {
  validateUserCreation,
  validateUserLogin,
  validateObjectIdParam,
  sanitizeInput
} from '../middleware/validation.js';

const router = express.Router();

// 🔒 TEACHER PIN FROM ENVIRONMENT
const TEACHER_PIN = process.env.TEACHER_PIN || "0000";

// Get all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find()
      .select('-pin -loginAttempts -lockUntil')
      .limit(100);
    res.json(users);
  } catch (error) {
    console.error('GET /users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 🔒 SECURE USER CREATION WITH PIN HASHING
router.post('/', validateUserCreation, async (req, res) => {
  try {
    const { fullName, email, role = 'student' } = req.body;

    const existingUser = await User.findOne({ 
      email: email.toLowerCase() 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        error: 'User already exists with this email' 
      });
    }

    const userData = {
      fullName: sanitizeInput(fullName),
      email: email.toLowerCase(),
      role
    };

    const user = new User(userData);

    // 🔒 HASH PIN FOR TEACHERS
    if (role === 'teacher') {
      await user.hashPin(TEACHER_PIN);
    }

    await user.save();
    
    console.log(`✅ User created: ${user.email} (${user.role})`);
    res.status(201).json(user);

  } catch (error) {
    console.error('POST /users error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        error: 'User already exists with this email' 
      });
    }
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: Object.values(error.errors).map(e => e.message)
      });
    }
    
    res.status(500).json({ error: 'Server error creating user' });
  }
});

// 🔒 SECURE LOGIN WITH PIN VERIFICATION
router.post('/login', validateUserLogin, async (req, res) => {
  try {
    const { email, pin } = req.body;

    const user = await User.findOne({ 
      email: email.toLowerCase() 
    });

    if (!user) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }

    if (user.isLocked) {
      return res.status(423).json({ 
        error: 'Account temporarily locked due to too many failed login attempts. Please try again later.' 
      });
    }

    // 🔒 PIN VERIFICATION FOR TEACHERS
    if (user.role === 'teacher') {
      if (!pin) {
        await user.incLoginAttempts();
        return res.status(400).json({ 
          error: 'PIN is required for teachers' 
        });
      }

      const isPinValid = await user.comparePin(pin);
      if (!isPinValid) {
        await user.incLoginAttempts();
        return res.status(401).json({ 
          error: 'Incorrect PIN' 
        });
      }
    }

    if (user.role === 'student' && pin) {
      return res.status(400).json({ 
        error: 'Students should not provide a PIN' 
      });
    }

    if (user.loginAttempts > 0) {
      await user.resetLoginAttempts();
    }

    console.log(`✅ Login successful: ${user.email} (${user.role})`);
    res.json(user);

  } catch (error) {
    console.error('POST /users/login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Get user by ID
router.get('/:id', validateObjectIdParam('id'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
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