import express from 'express';
import User from '../models/User.js';
import {
  validateUserCreation,
  validateUserLogin,
  validateObjectIdParam,
  sanitizeInput
} from '../middleware/validation.js';

const router = express.Router();

// 🔒 Fixed teacher PIN from environment (default "0000")
const TEACHER_PIN = process.env.TEACHER_PIN || "0000";

// Get all users (hide sensitive fields)
router.get('/', async (req, res) => {
  try {
    const users = await User.find()
      .select('-pin -loginAttempts -lockUntil') // pin no longer saved but kept for safety
      .limit(100);
    res.json(users);
  } catch (error) {
    console.error('GET /users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// CREATE USER
router.post('/', validateUserCreation, async (req, res) => {
  try {
    const { fullName, email, role = 'student', pin } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // For teachers, verify the fixed PIN matches
    if (role === 'teacher') {
      if (!pin || pin !== TEACHER_PIN) {
        return res.status(401).json({ error: 'Invalid teacher PIN' });
      }
    }

    // Sanitize inputs
    const userData = {
      fullName: sanitizeInput(fullName),
      email: email.toLowerCase(),
      role
    };

    const user = new User(userData);

    await user.save();

    console.log(`✅ User created: ${user.email} (${user.role})`);
    res.status(201).json(user);

  } catch (error) {
    console.error('POST /users error:', error);

    if (error.code === 11000) {
      return res.status(400).json({ error: 'User already exists with this email' });
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

// LOGIN USER
router.post('/users/login', validateUserLogin, async (req, res) => {
  try {
    const { email, pin } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.isLocked) {
      return res.status(423).json({
        error: 'Account temporarily locked due to too many failed login attempts. Please try again later.'
      });
    }

    // Fixed PIN check for teachers
    if (user.role === 'teacher') {
      if (!pin) {
        await user.incLoginAttempts();
        return res.status(400).json({ error: 'PIN is required for teachers' });
      }

      if (pin !== TEACHER_PIN) {
        await user.incLoginAttempts();
        return res.status(401).json({ error: 'Incorrect PIN' });
      }
    }

    if (user.role === 'student' && pin) {
      return res.status(400).json({ error: 'Students should not provide a PIN' });
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

// GET USER BY ID
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