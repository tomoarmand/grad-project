# 🔒 COMPLETE BACKEND SECURITY IMPLEMENTATION

## 📦 1. INSTALL REQUIRED SECURITY PACKAGES

First, install the security dependencies:

```bash
npm install bcrypt express-rate-limit helmet express-validator jsonwebtoken cookie-parser express-mongo-sanitize xss-clean hpp compression
```

## 🛡️ 2. UPDATED MAIN SERVER FILE (index.js)

```javascript
import express from 'express';
import mongoose from 'mongoose';
import cors from "cors";
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import hpp from 'hpp';
import compression from 'compression';

import userRoutes from './routes/userRoutes.js';
import exerciseRoutes from './routes/exerciseRoutes.js';
import folderRoutes from './routes/folderRoutes.js';
import assignmentRoutes from './routes/assignmentRoutes.js';

dotenv.config();

const app = express();

// 🔒 SECURITY MIDDLEWARE - APPLY FIRST!
// Set security headers
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Rate limiting - Global
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting - Stricter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 auth attempts per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(globalLimiter);

// Data sanitization against NoSQL injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(hpp({
  whitelist: ['studentIds', 'exerciseIds']
}));

// Compression middleware
app.use(compression());

// Body parser with size limits
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      const error = new Error('Invalid JSON');
      error.status = 400;
      throw error;
    }
  }
}));

app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Connect to MongoDB Atlas
const uri = process.env.MONGO_KEY;
console.log("Connecting to DB...");

mongoose.connect(uri, {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  bufferMaxEntries: 0,
  bufferCommands: false,
});

mongoose.connection.on('connected', () => {
  console.log('✅ Database connected successfully');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Database connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('📡 Database disconnected');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('Database connection closed through app termination');
  process.exit(0);
});

// Health check endpoints
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({
    status: 'ok',
    database: dbStatus,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    memory: process.memoryUsage(),
    version: process.version
  });
});

// Routes with security middleware
app.use('/users', authLimiter, userRoutes);
app.use('/exercises', exerciseRoutes);
app.use('/folders', folderRoutes);
app.use('/assignments', assignmentRoutes);

// Global error handling middleware
app.use((error, req, res, next) => {
  console.error('Global error:', error);
  
  if (process.env.NODE_ENV === 'production') {
    res.status(error.status || 500).json({
      error: 'Something went wrong!'
    });
  } else {
    res.status(error.status || 500).json({
      error: error.message,
      stack: error.stack
    });
  }
});

// Handle 404 routes
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔒 Security middleware active`);
});
```

## 🗂️ 3. UPDATED USER MODEL (models/User.js)

```javascript
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
  fullName: { 
    type: String, 
    required: [true, 'Full name is required'],
    trim: true,
    minlength: [2, 'Full name must be at least 2 characters'],
    maxlength: [50, 'Full name cannot exceed 50 characters'],
    match: [/^[a-zA-ZÀ-ÿ\s'-]{2,50}$/, 'Full name contains invalid characters']
  },
  email: { 
    type: String, 
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    maxlength: [100, 'Email cannot exceed 100 characters'],
    match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Please enter a valid email']
  },
  role: { 
    type: String, 
    enum: {
      values: ['teacher', 'student'],
      message: 'Role must be either teacher or student'
    },
    default: 'student'
  },
  // 🔒 SECURE PIN FIELD FOR TEACHERS
  pin: {
    type: String,
    required: function() {
      return this.role === 'teacher';
    },
    validate: {
      validator: function(pin) {
        if (this.role !== 'teacher') return true;
        return pin && pin.length >= 60; // bcrypt hashes are ~60 characters
      },
      message: 'PIN is required for teachers'
    }
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster email lookups
userSchema.index({ email: 1 });

// Virtual for checking if account is locked
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// 🔒 SECURE PIN METHODS
userSchema.methods.hashPin = async function(plainPin) {
  const saltRounds = 12;
  this.pin = await bcrypt.hash(plainPin, saltRounds);
};

userSchema.methods.comparePin = async function(plainPin) {
  if (!this.pin) return false;
  return await bcrypt.compare(plainPin, this.pin);
};

// Account locking methods
userSchema.methods.incLoginAttempts = async function() {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = {
      lockUntil: Date.now() + 2 * 60 * 60 * 1000 // 2 hours
    };
  }
  
  return this.updateOne(updates);
};

userSchema.methods.resetLoginAttempts = async function() {
  return this.updateOne({
    $unset: {
      loginAttempts: 1,
      lockUntil: 1
    }
  });
};

// Remove sensitive data when converting to JSON
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.pin;
  delete userObject.loginAttempts;
  delete userObject.lockUntil;
  return userObject;
};

const User = mongoose.model('User', userSchema);
export default User;
```

## 📝 4. VALIDATION MIDDLEWARE (middleware/validation.js)

```javascript
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
```

## 👤 5. SECURE USER ROUTES (routes/userRoutes.js)

```javascript
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
```

## 🔐 6. UPDATED PACKAGE.JSON

```json
{
  "name": "grad-api",
  "version": "1.0.0",
  "main": "index.js",
  "type": "module",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
    "start": "node index.js",
    "dev": "nodemon index.js",
    "build": "vite build"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "description": "",
  "dependencies": {
    "axios": "^1.11.0",
    "bcrypt": "^5.1.0",
    "cloudinary": "^2.7.0",
    "compression": "^1.7.4",
    "cookie-parser": "^1.4.6",
    "cors": "^2.8.5",
    "express": "^5.1.0",
    "express-mongo-sanitize": "^2.2.0",
    "express-rate-limit": "^7.1.5",
    "express-validator": "^7.0.1",
    "ffmpeg-static": "^5.2.0",
    "fluent-ffmpeg": "^2.1.3",
    "helmet": "^7.1.0",
    "hpp": "^0.2.3",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.15.1",
    "multer": "^2.0.1",
    "xss-clean": "^0.1.4"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
```

## 🔧 7. ENVIRONMENT VARIABLES (.env)

```env
# Database
MONGO_KEY=your_mongodb_connection_string

# Server
PORT=5000
NODE_ENV=production

# Frontend URL for CORS
FRONTEND_URL=http://localhost:3000

# 🔒 SECURITY - TEACHER PIN
TEACHER_PIN=0000

# Optional: JWT Secret for future features
JWT_SECRET=your_super_secret_jwt_key_here
```