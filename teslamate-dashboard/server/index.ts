import express from 'express';
import cors from 'cors';
import { closePool } from './db';
import carRoutes from './routes/car';
import statsRoutes from './routes/stats';
import commuteRoutes from './routes/commute';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api', carRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/commute', commuteRoutes);

app.listen(PORT, () => {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  TeslaMate Dashboard API Server');
  console.log(`  Port:     ${PORT}`);
  console.log(`  Database: postgres://192.168.28.15:5432/teslamate`);
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log('  Endpoints:');
  console.log('    GET /api/health              — Health check');
  console.log('    GET /api/car                 — Vehicle status');
  console.log('    GET /api/drives              — Drive list');
  console.log('    GET /api/drives/:id          — Drive detail');
  console.log('    GET /api/drives/:id/positions — Drive GPS track');
  console.log('    GET /api/charges             — Charge list');
  console.log('    GET /api/charges/:id         — Charge detail');
  console.log('    GET /api/stats/weekly        — Weekly mileage');
  console.log('    GET /api/stats/monthly       — Monthly comparison');
  console.log('    GET /api/stats/summary       — Overall summary');
  console.log('    GET /api/stats/mileage       — Mileage trend');
  console.log('    GET /api/stats/efficiency    — Efficiency analysis');
  console.log('    GET /api/stats/locations     — Frequent locations');
  console.log('    GET /api/commute/compare     — Commute comparison');
  console.log('');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down...');
  await closePool();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closePool();
  process.exit(0);
});
