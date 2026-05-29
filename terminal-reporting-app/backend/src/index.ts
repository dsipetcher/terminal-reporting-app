import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from './lib/prisma';
import { authenticateToken } from './middleware/auth';

import authRouter from './routes/auth';
import vesselsRouter from './routes/vessels';
import vesselCallsRouter from './routes/vesselCalls';
import berthsRouter from './routes/berths';
import containersRouter from './routes/containers';
import warehousesRouter from './routes/warehouses';
import wagonsRouter from './routes/wagons';
import logisticsOrdersRouter from './routes/logisticsOrders';
import logisticsOrderDocumentsRouter from './routes/logisticsOrderDocuments';
import counterpartiesRouter from './routes/counterparties';
import materialFlowsRouter from './routes/materialFlows';
import infoFlowsRouter from './routes/infoFlows';
import directoriesRouter from './routes/directories';
import logisticsRoutesRouter from './routes/logisticsRoutes';
import trainConsistsRouter from './routes/trainConsists';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');
const frontendDist = path.join(projectRoot, 'frontend', 'dist');

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
            in: ['EN_ROUTE', 'ARRIVED', 'UNLOADING', 'EXPECTED', 'BERTHED', 'IN_OPERATION'],
          },
        },
      }),
      prisma.container.count(),
      prisma.wagon.count(),
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
app.use('/api/warehouses', authenticateToken, warehousesRouter);
app.use('/api/wagons', authenticateToken, wagonsRouter);
app.use('/api/train-consists', authenticateToken, trainConsistsRouter);
app.use('/api/logistics-orders', authenticateToken, logisticsOrdersRouter);
app.use(
  '/api/logistics-orders/:orderId/documents',
  authenticateToken,
  logisticsOrderDocumentsRouter
);
app.use('/api/counterparties', authenticateToken, counterpartiesRouter);
app.use('/api/material-flows', authenticateToken, materialFlowsRouter);
app.use('/api/info-flows', authenticateToken, infoFlowsRouter);
app.use('/api/directories', authenticateToken, directoriesRouter);
app.use('/api/logistics-routes', authenticateToken, logisticsRoutesRouter);

const serveFrontend = process.env.SERVE_FRONTEND === '1';
if (serveFrontend) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(frontendDist, 'index.html'), (err) => {
      if (err) next(err);
    });
  });
}

const PORT = Number(process.env.PORT) || 3001;
const HOST = process.env.HOST || '127.0.0.1';

app.listen(PORT, HOST, () => {
  const url = `http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`;
  console.log('Information Logistics System (ILS)');
  console.log(`Server running on ${url}`);
  if (serveFrontend) {
    console.log(`Application UI: ${url}`);
    console.log('Login: admin / admin');
  } else {
    console.log(`Health check: ${url}/api/health`);
  }
});
