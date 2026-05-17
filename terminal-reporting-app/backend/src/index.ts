import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

// Импорт маршрутов
import vesselsRouter from './routes/vessels';
import vesselCallsRouter from './routes/vesselCalls';
import berthsRouter from './routes/berths';
import containersRouter from './routes/containers';
import trucksRouter from './routes/trucks';
import truckVisitsRouter from './routes/truckVisits';
import warehousesRouter from './routes/warehouses';
import wagonsRouter from './routes/wagons';

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Dashboard stats
app.get('/api/dashboard/stats', async (req, res) => {
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

// Подключение маршрутов
app.use('/api/vessels', vesselsRouter);
app.use('/api/vessel-calls', vesselCallsRouter);
app.use('/api/berths', berthsRouter);
app.use('/api/containers', containersRouter);
app.use('/api/trucks', trucksRouter);
app.use('/api/truck-visits', truckVisitsRouter);
app.use('/api/warehouses', warehousesRouter);
app.use('/api/wagons', wagonsRouter);

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚢 Terminal Operating System API`);
  console.log(`📡 Server running on http://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
});
