import './config/env.js';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import formRoutes from './routes/forms.js';
import responseRoutes from './routes/responses.js';
import exportRoutes from './routes/exports.js';
import folderRoutes from './routes/folders.js';
import authRoutes from './routes/auth.js';
import integrationRoutes from './routes/integrations.js';
import uploadRoutes from './routes/upload.js';

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ CORS: fixed origins + any extra origins from CORS_ORIGINS env var (comma-separated)
const BASE_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://oorb-forms.vercel.app',
  'https://forms.oorbtech.com',
  'https://nb0fzghw-5173.inc1.devtunnels.ms',
];
const extraOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(o => o.trim()).filter(Boolean)
  : [];
const allowedOrigins = [...new Set([...BASE_ORIGINS, ...extraOrigins])];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
  optionsSuccessStatus: 200,
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Enable preflight for all routes

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/forms', formRoutes);
app.use('/api/responses', responseRoutes);
app.use('/api/exports', exportRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/upload', uploadRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'OORB Forms API is running' });
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('✅ Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
  });

export default app;
