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

// Security middleware
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

// Rate limiting - Auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 auth attempts per windowMs
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

// Body parser with size limits - FIXED: Removed problematic verify function
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Optional: Add request logging for debugging (remove in production)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`📡 ${req.method} ${req.path} - Content-Type: ${req.get('content-type') || 'none'}`);
    next();
  });
}

// Enhanced CORS configuration for all environments
const allowedOrigins = [
  // Production
  'https://kentone.vercel.app',
  
  // Development
  'http://localhost:5173',  // Vite dev server
  'http://localhost:4173',  // Vite preview server
  'http://localhost:3000',  // Alternative dev port
  
  // Add your production backend URL if different
  process.env.FRONTEND_URL
].filter(Boolean); // Remove any undefined values

console.log('🔒 CORS allowed origins:', allowedOrigins);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('❌ CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Connect to MongoDB
const uri = process.env.MONGO_KEY;

mongoose.connect(uri, {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
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

// Improved global error handling middleware
app.use((error, req, res, next) => {
  // Don't log routine client errors to reduce noise
  const routineErrors = [
    'entity.verify.failed',
    'entity.parse.failed',
    'request.aborted',
    'request.size.invalid'
  ];
  
  if (!routineErrors.includes(error.type)) {
    console.error('🔥 Server error:', {
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      url: req.url,
      method: req.method,
      timestamp: new Date().toISOString()
    });
  }
  
  // Handle specific error types
  if (error.type === 'entity.too.large') {
    return res.status(413).json({
      error: 'Request payload too large'
    });
  }
  
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: 'Invalid request format'
    });
  }
  
  if (process.env.NODE_ENV === 'production') {
    res.status(error.status || 500).json({
      error: error.status === 400 ? error.message : 'Something went wrong!'
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
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});