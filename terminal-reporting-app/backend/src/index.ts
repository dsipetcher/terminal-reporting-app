import express from 'express';
import cors from 'cors';
import prisma from './lib/prisma';
import { authenticateToken } from './middleware/auth';

import authRouter from './routes/auth';
import vesselsRouter from './routes/vessels';
import vesselCallsRouter from './routes/vesselCalls';
import berthsRouter from './routes/berths';
import containersRouter from './routes/containers';
import trucksRouter from './routes/trucks';
import truckVisitsRouter from './routes/truckVisits';
import warehousesRouter from './routes/warehouses';
import wagonsRouter from './routes/wagons';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRouter);

app.get('/api/dashboard/stats', authenticateToken, async (_req, res) => {
  try {
    const [
      vesselCallsCount,
      activeVesselCalls,
      containersCount,
      wagonsCount,
      trucksCount,
      warehousesCount,
    ] = await Promise.all([
      prisma.vesselCall.count(),
      prisma.vesselCall.count({
        where: {
          status: {
            in: ['EXPECTED', 'ARRIVED', 'BERTHED', 'IN_OPERATION'],
          },
        },
      }),
      prisma.container.count(),
      prisma.wagon.count(),
      prisma.truck.count(),
      prisma.warehouse.count(),
    ]);

    res.json({
      vesselCallsTotal: vesselCallsCount,
      vesselCallsActive: activeVesselCalls,
      containers: containersCount,
      wagons: wagonsCount,
      trucks: trucksCount,
      warehouses: warehousesCount,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

app.use('/api/vessels', authenticateToken, vesselsRouter);
app.use('/api/vessel-calls', authenticateToken, vesselCallsRouter);
app.use('/api/berths', authenticateToken, berthsRouter);
app.use('/api/containers', authenticateToken, containersRouter);
app.use('/api/trucks', authenticateToken, trucksRouter);
app.use('/api/truck-visits', authenticateToken, truckVisitsRouter);
app.use('/api/warehouses', authenticateToken, warehousesRouter);
app.use('/api/wagons', authenticateToken, wagonsRouter);

const PORT = 3001;
app.listen(PORT, () => {
  console.log('Terminal Operating System API');
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
