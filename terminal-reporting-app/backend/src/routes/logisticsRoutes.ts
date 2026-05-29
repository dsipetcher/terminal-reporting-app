import express from 'express';
import prisma from '../lib/prisma';
import { logInfoFlow } from '../lib/ils';
import { buildExportRouteStages } from '../lib/exportRouteStages';
import { cargoStatusFromStageType } from '../lib/cargoStatusFromStage';

const router = express.Router();

const routeInclude = {
  order: { select: { id: true, orderNumber: true, status: true } },
  stages: { orderBy: { sequence: 'asc' as const } },
  trackings: {
    include: {
      container: {
        select: {
          id: true,
          containerNumber: true,
          status: true,
          cargoCategory: true,
          supplierName: true,
          quantityTons: true,
          cargoDescription: true,
        },
      },
      currentStage: true,
      events: { orderBy: { eventAt: 'desc' as const }, take: 5 },
    },
  },
};

router.get('/', async (req, res) => {
  try {
    const { status, orderId } = req.query;
    const where: Record<string, unknown> = {};
    if (status && status !== 'ALL') where.status = String(status);
    if (orderId) where.orderId = Number(orderId);

    const routes = await prisma.logisticsRoute.findMany({
      where,
      include: {
        order: { select: { orderNumber: true } },
        stages: { orderBy: { sequence: 'asc' } },
        _count: { select: { trackings: true, stages: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
    res.json(routes);
  } catch (error) {
    console.error('Error fetching routes:', error);
    res.status(500).json({ error: 'Failed to fetch routes' });
  }
});

async function trackByBatchNumber(batchNumber: string) {
  const container = await prisma.container.findUnique({
    where: { containerNumber: batchNumber.toUpperCase() },
  });
  if (!container) return null;

  const trackings = await prisma.cargoTracking.findMany({
    where: { containerId: container.id },
    include: {
      route: {
        include: {
          stages: { orderBy: { sequence: 'asc' } },
          order: { select: { orderNumber: true } },
        },
      },
      currentStage: true,
      events: { orderBy: { eventAt: 'desc' }, take: 20 },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return { container, trackings };
}

router.get('/track/batch/:batchNumber', async (req, res) => {
  try {
    const result = await trackByBatchNumber(req.params.batchNumber);
    if (!result) return res.status(404).json({ error: 'Cargo batch not found' });
    res.json(result);
  } catch (error) {
    console.error('Error tracking batch:', error);
    res.status(500).json({ error: 'Failed to track cargo batch' });
  }
});

router.get('/track/container/:containerNumber', async (req, res) => {
  try {
    const result = await trackByBatchNumber(req.params.containerNumber);
    if (!result) return res.status(404).json({ error: 'Cargo batch not found' });
    res.json(result);
  } catch (error) {
    console.error('Error tracking batch:', error);
    res.status(500).json({ error: 'Failed to track cargo batch' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const route = await prisma.logisticsRoute.findUnique({
      where: { id: Number(req.params.id) },
      include: routeInclude,
    });
    if (!route) return res.status(404).json({ error: 'Route not found' });
    res.json(route);
  } catch (error) {
    console.error('Error fetching route:', error);
    res.status(500).json({ error: 'Failed to fetch route' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { routeNumber, name, orderId, origin, destination, status, stages, routeKind } = req.body;
    if (!routeNumber || !origin || !destination) {
      return res.status(400).json({ error: 'routeNumber, origin and destination are required' });
    }

    const stagePayload =
      Array.isArray(stages) && stages.length > 0
        ? stages.map((s: Record<string, unknown>, i: number) => ({
            sequence: Number(s.sequence) || i + 1,
            stageType: String(s.stageType),
            locationCode: String(s.locationCode),
            locationName: String(s.locationName),
            transportMode: s.transportMode ? String(s.transportMode) : undefined,
            plannedAt: s.plannedAt ? new Date(String(s.plannedAt)) : undefined,
            status: String(s.status || (i === 0 ? 'CURRENT' : 'PENDING')),
          }))
        : buildExportRouteStages({
            supplierName: origin,
            destPortCode: destination,
            destPortName: `Порт ${destination}`,
          });

    const route = await prisma.logisticsRoute.create({
      data: {
        routeNumber,
        name: name || `Экспорт: ${origin} → ${destination}`,
        orderId: orderId ? Number(orderId) : undefined,
        origin,
        destination,
        routeKind: routeKind || 'EXPORT',
        status: status || 'PLANNED',
        stages: { create: stagePayload },
      },
      include: routeInclude,
    });

    await logInfoFlow({
      ilsFunction: 'PLANNING',
      eventType: 'CREATE',
      entityType: 'LOGISTICS_ROUTE',
      entityId: route.id,
      orderId: route.orderId ?? undefined,
      message: `Создан маршрут ${route.routeNumber}: ${route.origin} → ${route.destination}`,
    });

    res.status(201).json(route);
  } catch (error) {
    console.error('Error creating route:', error);
    res.status(500).json({ error: 'Failed to create route' });
  }
});

router.post('/:id/trackings', async (req, res) => {
  try {
    const routeId = Number(req.params.id);
    const { containerId, notes } = req.body;
    if (!containerId) return res.status(400).json({ error: 'containerId is required' });

    const route = await prisma.logisticsRoute.findUnique({
      where: { id: routeId },
      include: { stages: { orderBy: { sequence: 'asc' }, take: 1 } },
    });
    if (!route) return res.status(404).json({ error: 'Route not found' });

    const firstStage = route.stages[0];
    const tracking = await prisma.cargoTracking.create({
      data: {
        containerId: Number(containerId),
        routeId,
        currentStageId: firstStage?.id,
        status: firstStage ? 'AT_STAGE' : 'REGISTERED',
        notes,
        events: firstStage
          ? {
              create: {
                toStageId: firstStage.id,
                description: `Груз зарегистрирован на этапе: ${firstStage.locationName}`,
              },
            }
          : undefined,
      },
      include: {
        container: true,
        currentStage: true,
        route: { include: { stages: { orderBy: { sequence: 'asc' } } } },
      },
    });

    if (route.status === 'PLANNED') {
      await prisma.logisticsRoute.update({
        where: { id: routeId },
        data: { status: 'ACTIVE' },
      });
    }

    await logInfoFlow({
      ilsFunction: 'CONTROL',
      eventType: 'CREATE',
      entityType: 'CARGO_TRACKING',
      entityId: tracking.id,
      orderId: route.orderId ?? undefined,
      message: `На маршрут ${route.routeNumber} поставлен на отслеживание контейнер ${tracking.container.containerNumber}`,
    });

    res.status(201).json(tracking);
  } catch (error) {
    console.error('Error creating tracking:', error);
    res.status(500).json({ error: 'Failed to register cargo on route' });
  }
});

router.patch('/trackings/:trackingId/advance', async (req, res) => {
  try {
    const trackingId = Number(req.params.trackingId);
    const tracking = await prisma.cargoTracking.findUnique({
      where: { id: trackingId },
      include: {
        route: { include: { stages: { orderBy: { sequence: 'asc' } } } },
        currentStage: true,
        container: true,
      },
    });
    if (!tracking) return res.status(404).json({ error: 'Tracking not found' });

    const stages = tracking.route.stages;
    const currentSeq = tracking.currentStage?.sequence ?? 0;
    const nextStage = stages.find((s) => s.sequence > currentSeq && s.status !== 'SKIPPED');

    if (!nextStage) {
      const updated = await prisma.cargoTracking.update({
        where: { id: trackingId },
        data: {
          status: 'DELIVERED',
          lastEventAt: new Date(),
          events: {
            create: {
              fromStageId: tracking.currentStageId ?? undefined,
              description: 'Груз доставлен в конечную точку',
            },
          },
        },
        include: { container: true, currentStage: true, route: true, events: { take: 10, orderBy: { eventAt: 'desc' } } },
      });

      await prisma.container.update({
        where: { id: tracking.containerId },
        data: { status: 'DELIVERED' },
      });

      const allDelivered = await prisma.cargoTracking.count({
        where: { routeId: tracking.routeId, status: { not: 'DELIVERED' } },
      });
      if (allDelivered === 0) {
        await prisma.logisticsRoute.update({
          where: { id: tracking.routeId },
          data: { status: 'COMPLETED' },
        });
      }

      await logInfoFlow({
        ilsFunction: 'ACCOUNTING',
        eventType: 'STATUS_CHANGE',
        entityType: 'CARGO_TRACKING',
        entityId: trackingId,
        orderId: tracking.route.orderId ?? undefined,
        message: `Партия ${tracking.container.containerNumber} доставлена (${tracking.route.routeNumber})`,
      });

      return res.json(updated);
    }

    if (tracking.currentStageId) {
      await prisma.routeStage.update({
        where: { id: tracking.currentStageId },
        data: { status: 'COMPLETED', actualAt: new Date() },
      });
    }

    await prisma.routeStage.update({
      where: { id: nextStage.id },
      data: { status: 'CURRENT', actualAt: newStage.actualAt ?? new Date() },
    });

    const cargoStatus = cargoStatusFromStageType(nextStage.stageType);

    const updated = await prisma.cargoTracking.update({
      where: { id: trackingId },
      data: {
        currentStageId: nextStage.id,
        status: 'AT_STAGE',
        lastEventAt: new Date(),
        events: {
          create: {
            fromStageId: tracking.currentStageId ?? undefined,
            toStageId: nextStage.id,
            description: `Перемещение: ${tracking.currentStage?.locationName ?? 'старт'} → ${nextStage.locationName}`,
          },
        },
      },
      include: {
        container: true,
        currentStage: true,
        route: { include: { stages: { orderBy: { sequence: 'asc' } } } },
        events: { orderBy: { eventAt: 'desc' }, take: 10 },
      },
    });

    await prisma.container.update({
      where: { id: tracking.containerId },
      data: { status: cargoStatus },
    });

    await logInfoFlow({
      ilsFunction: 'CONTROL',
      eventType: 'STATUS_CHANGE',
      entityType: 'CARGO_TRACKING',
      entityId: trackingId,
      orderId: tracking.route.orderId ?? undefined,
      message: `Партия ${tracking.container.containerNumber}: ${cargoStatus} — «${nextStage.locationName}» (${tracking.route.routeNumber})`,
    });

    res.json(updated);
  } catch (error) {
    console.error('Error advancing tracking:', error);
    res.status(500).json({ error: 'Failed to advance cargo on route' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.logisticsRoute.delete({ where: { id: Number(req.params.id) } });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting route:', error);
    res.status(500).json({ error: 'Failed to delete route' });
  }
});

export default router;
