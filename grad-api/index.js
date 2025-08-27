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

// Enhanced security middleware
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

// Environment-aware rate limiter factory
const createRateLimiter = (options) => {
  // Skip rate limiting in development
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
    keyGenerator: (req) => {
      // Use IP address for all rate limiting
      return req.ip;
    },
    // Enhanced logging for production debugging
    onLimitReached: (req, res) => {
      console.warn(`Rate limit reached for IP ${req.ip} on ${req.method} ${req.path}`);
    },
  });
};

// Specific rate limiters with more reasonable limits
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProduction ? 100 : 200, // More generous limits
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: 15 * 60, // seconds
  },
});

const dataLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProduction ? 3000 : 5000, // Very generous for data operations
  message: {
    error: 'Too many requests, please try again later.',
    retryAfter: 15 * 60,
  },
});

const assignmentLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProduction ? 500 : 1000, // Generous for assignment operations
  message: {
    error: 'Too many assignment operations, please try again later.',
    retryAfter: 15 * 60,
  },
});

// Remove global rate limiter - apply selectively instead

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
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging for debugging (environment-aware)
if (isDevelopment) {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - IP: ${req.ip} - User-Agent: ${req.get('User-Agent')?.substring(0, 50)}...`);
    next();
  });
} else if (isProduction) {
  // Minimal logging for production
  app.use((req, res, next) => {
    if (req.path.startsWith('/users') || req.path.includes('error')) {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - IP: ${req.ip}`);
    }
    next();
  });
}

// Enhanced CORS configuration
const allowedOrigins = [
  // Production
  'https://kentone.vercel.app',
  
  // Development
  'http://localhost:5173',  // Vite dev server
  'http://localhost:4173',  // Vite preview server
  'http://localhost:3000',  // Alternative dev port
  
  // Add your production backend URL if different
  process.env.FRONTEND_URL
].filter(Boolean);

console.log('CORS allowed origins:', allowedOrigins);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
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

// Enhanced MongoDB connection with better error handling
const uri = process.env.MONGO_KEY;

if (!uri) {
  console.error('MONGO_KEY environment variable is not set');
  process.exit(1);
}

mongoose.connect(uri, {
  maxPoolSize: isProduction ? 25 : 10, // Increased pool size for production
  serverSelectionTimeoutMS: 10000, // Increased timeout
  socketTimeoutMS: 45000,
  bufferMaxEntries: 0, // Disable mongoose buffering
  bufferCommands: false, // Disable mongoose buffering
  maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
  family: 4 // Use IPv4, skip trying IPv6
});

mongoose.connection.on('connected', () => {
  console.log('Database connected successfully');
  console.log('Connection state:', mongoose.connection.readyState);
});

mongoose.connection.on('error', (err) => {
  console.error('Database connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Database disconnected');
});

// Enhanced graceful shutdown
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

// Rate limit status endpoint for debugging
app.get('/rate-limit-status', (req, res) => {
  res.json({
    ip: req.ip,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    rateLimitingActive: !isDevelopment,
    message: 'Rate limit status check'
  });
});

// Apply rate limiters to specific routes
app.use('/users/login', authLimiter);
app.use('/users', authLimiter); // For registration and other auth operations
app.use('/exercises', dataLimiter);
app.use('/folders', dataLimiter);
app.use('/assignments', assignmentLimiter);

// Routes
app.use('/users', userRoutes);
app.use('/exercises', exerciseRoutes);
app.use('/folders', folderRoutes);
app.use('/assignments', assignmentRoutes);

// Enhanced error handling middleware
app.use((error, req, res, next) => {
  // Don't log routine client errors to reduce noise
  const routineErrors = [
    'entity.verify.failed',
    'entity.parse.failed',
    'request.aborted',
    'request.size.invalid'
  ];
  
  const isRoutineError = routineErrors.includes(error.type) || error.status < 500;
  
  if (!isRoutineError) {
    console.error('Server error:', {
      message: error.message,
      stack: isDevelopment ? error.stack : undefined,
      url: req.url,
      method: req.method,
      ip: req.ip,
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
  
  // Rate limit errors
  if (error.status === 429) {
    return res.status(429).json({
      error: 'Too many requests. Please try again later.',
      retryAfter: error.retryAfter || 900 // 15 minutes default
    });
  }
  
  // MongoDB connection errors
  if (error.name === 'MongooseError' || error.name === 'MongoError') {
    console.error('Database error:', error.message);
    return res.status(503).json({
      error: 'Database temporarily unavailable'
    });
  }
  
  if (isProduction) {
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
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl
  });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Security middleware active`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Rate limiting: ${!isDevelopment ? 'ACTIVE' : 'DISABLED (development mode)'}`);
});

// Handle server errors
server.on('error', (error) => {
  console.error('Server error:', error);
});

// Set server timeout for long-running requests
server.timeout = 60000; // 60 seconds