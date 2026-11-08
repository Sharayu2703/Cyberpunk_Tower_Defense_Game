import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB, getDBStatus } from './config/db.js';
import scoreRoutes from './routes/scoreRoutes.js';
import gameRoutes from './routes/gameRoutes.js';
import benchmarkRoutes from './routes/benchmarkRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Connect to MongoDB (with graceful fallback if not present)
connectDB();

// API Routes
app.use('/api/scores', scoreRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/benchmarks', benchmarkRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    game: 'VOID RIFT: TACTICAL PROTOCOL',
    version: '1.0.0',
    database: getDBStatus(),
    timestamp: new Date(),
  });
});

// Serve static frontend build if present
const clientDist = path.join(__dirname, '../client/dist');
app.use(express.static(clientDist));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(clientDist, 'index.html'), (err) => {
    if (err) {
      res.json({ message: 'VOID RIFT API Server Running. Client can run via Vite dev server on port 5173.' });
    }
  });
});

app.listen(PORT, () => {
  console.log(`[Server] VOID RIFT Backend running on port ${PORT}`);
});
