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
import logisticsOrdersRouter from './routes/logisticsOrders';
import counterpartiesRouter from './routes/counterparties';
import materialFlowsRouter from './routes/materialFlows';
import infoFlowsRouter from './routes/infoFlows';
import directoriesRouter from './routes/directories';
import logisticsRoutesRouter from './routes/logisticsRoutes';

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
      ordersTotal,
      ordersPlanning,
      ordersDispatch,
      ordersOperational,
      ordersInProgress,
      materialFlowsToday,
      infoEventsToday,
      counterpartiesCount,
      activeRoutes,
      cargoOnRoutes,
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
      prisma.logisticsOrder.count(),
      prisma.logisticsOrder.count({ where: { managementLevel: 'PLANNING' } }),
      prisma.logisticsOrder.count({ where: { managementLevel: 'DISPATCH' } }),
      prisma.logisticsOrder.count({ where: { managementLevel: 'OPERATIONAL' } }),
      prisma.logisticsOrder.count({
        where: { status: { in: ['PLANNED', 'IN_PROGRESS'] } },
      }),
      prisma.materialFlow.count({
        where: {
          performedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
      prisma.infoFlowEvent.count({
        where: {
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
      prisma.counterparty.count(),
      prisma.logisticsRoute.count({ where: { status: 'ACTIVE' } }),
      prisma.cargoTracking.count({
        where: { status: { in: ['REGISTERED', 'IN_TRANSIT', 'AT_STAGE'] } },
      }),
    ]);

    res.json({
      vesselCallsTotal: vesselCallsCount,
      vesselCallsActive: activeVesselCalls,
      containers: containersCount,
      wagons: wagonsCount,
      trucks: trucksCount,
      warehouses: warehousesCount,
      ordersTotal,
      ordersPlanning,
      ordersDispatch,
      ordersOperational,
      ordersInProgress,
      materialFlowsToday,
      infoEventsToday,
      counterpartiesCount,
      activeRoutes,
      cargoOnRoutes,
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
app.use('/api/logistics-orders', authenticateToken, logisticsOrdersRouter);
app.use('/api/counterparties', authenticateToken, counterpartiesRouter);
app.use('/api/material-flows', authenticateToken, materialFlowsRouter);
app.use('/api/info-flows', authenticateToken, infoFlowsRouter);
app.use('/api/directories', authenticateToken, directoriesRouter);
app.use('/api/logistics-routes', authenticateToken, logisticsRoutesRouter);

const PORT = 3001;
app.listen(PORT, () => {
  console.log('Information Logistics System (ILS) API');
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
