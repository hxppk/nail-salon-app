import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import memberRoutes from './routes/memberRoutes';
import appointmentRoutes from './routes/appointmentRoutes';
import serviceRoutes from './routes/serviceRoutes';

// Load environment variables
dotenv.config();

const app = express();
const prisma = new PrismaClient();
const BASE_PORT = parseInt(process.env.PORT || '5225', 10);
const ENV_PORT_SET = !!process.env.PORT;

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

// Middleware
app.use(limiter);
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(cors({
  origin: process.env.CORS_ORIGIN || ['http://localhost:3233'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Nail Salon API Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/members', memberRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/services', serviceRoutes);

// API Routes placeholder
app.get('/api', (req, res) => {
  res.json({ 
    message: 'Nail Salon Management System API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth/*',
      members: '/api/members/*',
      appointments: '/api/appointments/*',
      services: '/api/services/*',
      staff: '/api/staff/*',
      products: '/api/products/*',
      transactions: '/api/transactions/*'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', error);
  
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server with conditional port fallback
const tryListen = (port: number, retries = 5) => {
  const server = app.listen(port, () => {
    console.log(`🚀 Nail Salon API Server running on port ${port}`);
    console.log(`📊 Health check available at http://localhost:${port}/health`);
    console.log(`🔗 API docs available at http://localhost:${port}/api`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  });

  server.on('error', (err: any) => {
    if (err && err.code === 'EADDRINUSE') {
      if (ENV_PORT_SET) {
        console.error(`❌ Port ${port} is in use. Exiting because PORT is explicitly set.`);
        process.exit(1);
      }
      if (retries > 0) {
        const nextPort = port + 1;
        console.warn(`⚠️ Port ${port} in use, trying ${nextPort}...`);
        setTimeout(() => tryListen(nextPort, retries - 1), 300);
      } else {
        console.error('❌ Failed to find a free port.');
        process.exit(1);
      }
    } else {
      console.error('❌ Failed to start server:', err);
      process.exit(1);
    }
  });
};

tryListen(BASE_PORT);

export default app;
