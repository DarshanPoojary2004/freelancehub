import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import userRoutes from './routes/userRoutes.js';
import hiringRoutes from './routes/hiringRoutes.js';
import proposalRoutes from './routes/proposalRoutes.js';
import { initializeDatabase } from './config/initDatabase.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const allowedOrigins = [
  ...(process.env.FRONTEND_URL || 'http://localhost:5173,http://localhost:5174')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  'https://freelancehub-lilac.vercel.app', // production frontend
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.options('*', cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'FreelanceHub Backend is running!',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/users', userRoutes);
app.use('/api/hiring-requests', hiringRoutes);
app.use('/api/proposals', proposalRoutes);

app.use((err, req, res, next) => {
  console.error('Error:', err);

  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(status).json({
    status: 'error',
    code: status,
    message: message,
    timestamp: new Date().toISOString()
  });
});

app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    code: 404,
    message: 'Route not found',
    path: req.originalUrl
  });
});

const startServer = async () => {
  try {
    await initializeDatabase();

    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════╗
║     FREELANCEHUB BACKEND RUNNING       ║
║                                        ║
║  Local:   http://localhost:${PORT}        ║
║  Env:     ${process.env.NODE_ENV || 'development'}        ║
║  DB:      ${process.env.DB_NAME || 'Not configured'}   ║
║                                        ║
║  API Docs: http://localhost:${PORT}/health ║
╚════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to initialize database:', error.message);
    console.error('Please check your PostgreSQL password in backend/.env and confirm the postgres user can connect to localhost:5432.');
    process.exit(1);
  }
};

startServer();

export default app;
