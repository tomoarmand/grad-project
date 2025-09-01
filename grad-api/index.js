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

// Environment check
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// SECURITY HEADERS: Comprehensive protection via Helmet middleware
// WHY: Prevents common web vulnerabilities (XSS, clickjacking, etc.)
// NOTE: CSP allows necessary resources while blocking malicious scripts and styles
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Added for dev tools
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:", "wss:"], // Added wss for websockets
    },
  },
}));

// ENVIRONMENT-AWARE RATE LIMITING: Bypass in dev, enforce in production
// WHY: Prevents abuse while allowing development flexibility
// NOTE: Different limits for auth (stricter) vs data operations (more lenient)
const createRateLimiter = (options) => {
  if (isDevelopment) {
    return (req, res, next) => {
      console.log(`[DEV] Rate limiter bypassed for ${req.method} ${req.path}`);
      next();
    };
  }

  return rateLimit({
    ...options,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.ip,
    onLimitReached: (req, res) => {
      console.warn(`Rate limit reached for IP ${req.ip} on ${req.method} ${req.path}`);
    },
  });
};

// Specific rate limiters
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 100 : 200,
  message: { error: 'Too many authentication attempts, please try again later.', retryAfter: 15 * 60 },
});

const dataLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 3000 : 5000,
  message: { error: 'Too many requests, please try again later.', retryAfter: 15 * 60 },
});

const assignmentLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 500 : 1000,
  message: { error: 'Too many assignment operations, please try again later.', retryAfter: 15 * 60 },
});

// Data sanitization and parsing
app.use(mongoSanitize());
app.use(xss());
app.use(hpp({ whitelist: ['studentIds', 'exerciseIds'] }));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Development logging
if (isDevelopment) {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - IP: ${req.ip}`);
    next();
  });
}

// SECURE CORS: Allow specific origins with trailing slash normalization
// WHY: Prevents unauthorized cross-origin requests while supporting deployment
// NOTE: Handles mobile apps, development servers, and production domains
const allowedOrigins = [
  'https://kentone.vercel.app',
  'http://localhost:5173',
  'http://localhost:4173',
  'http://localhost:3000',
  process.env.FRONTEND_URL
].filter(Boolean).map(origin => origin.replace(/\/$/, '')); // Remove trailing slashes

console.log('CORS allowed origins:', allowedOrigins);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Normalize origin by removing trailing slash
    const normalizedOrigin = origin.replace(/\/$/, '');
    
    if (allowedOrigins.includes(normalizedOrigin)) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// MongoDB connection with better error handling
const uri = process.env.MONGO_KEY;

if (!uri) {
  console.error('MONGO_KEY environment variable is not set');
  process.exit(1);
}

mongoose.set('bufferCommands', false);

mongoose.connect(uri, {
  maxPoolSize: isProduction ? 25 : 10,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  maxIdleTimeMS: 30000,
  family: 4
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
const gracefulShutdown = async (signal) => {
  console.log(`Received ${signal}. Shutting down gracefully...`);
  try {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  } catch (error) {
    console.error('Error during shutdown:', error);
  }
  process.exit(0);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Health check endpoints
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'API is running', 
    timestamp: new Date().toISOString(), 
    uptime: process.uptime(), 
    environment: process.env.NODE_ENV || 'development' 
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
    version: process.version, 
    environment: process.env.NODE_ENV || 'development' 
  });
});

// Apply rate limiters to specific routes
app.use('/users/login', authLimiter);
app.use('/users', authLimiter);
app.use('/exercises', dataLimiter);
app.use('/folders', dataLimiter);
app.use('/assignments', assignmentLimiter);

// Routes
app.use('/users', userRoutes);
app.use('/exercises', exerciseRoutes);
app.use('/folders', folderRoutes);
app.use('/assignments', assignmentRoutes);

// Enhanced error handler
app.use((error, req, res, next) => {
  // Don't log client errors (4xx) as server errors
  if (!(error.status < 500)) {
    console.error('🔥 Server error:', error.message);
  }

  // Handle specific error types
  if (error.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request payload too large' });
  }
  
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid request format' });
  }
  
  if (error.status === 429) {
    return res.status(429).json({ 
      error: 'Too many requests. Please try again later.', 
      retryAfter: error.retryAfter || 900 
    });
  }
  
  if (error.name === 'MongooseError' || error.name === 'MongoError') {
    return res.status(503).json({ error: 'Database temporarily unavailable' });
  }

  // CORS errors
  if (error.message?.includes('CORS')) {
    return res.status(403).json({ error: 'Cross-origin request blocked' });
  }

  // Generic error response
  res.status(error.status || 500).json({
    error: isProduction ? (error.status === 400 ? error.message : 'Something went wrong!') : error.message,
    stack: isDevelopment ? error.stack : undefined,
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.originalUrl });
});

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔒 Security middleware active`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Rate limiting: ${!isDevelopment ? 'ACTIVE' : 'DISABLED (development mode)'}`);
});

// Handle server errors
server.on('error', (error) => {
  console.error('Server error:', error);
});

server.timeout = 60000;