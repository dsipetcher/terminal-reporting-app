import express from 'express';
import prisma from '../lib/prisma';
import { logInfoFlow } from '../lib/ils';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { orderId, transportMode } = req.query;
    const where: Record<string, unknown> = {};
    if (orderId) where.orderId = Number(orderId);
    if (transportMode && transportMode !== 'ALL') where.transportMode = String(transportMode);

    const flows = await prisma.materialFlow.findMany({
      where,
      include: {
        order: { select: { id: true, orderNumber: true } },
        container: { select: { id: true, containerNumber: true } },
      },
      orderBy: { performedAt: 'desc' },
      take: 200,
    });
    res.json(flows);
  } catch (error) {
    console.error('Error fetching material flows:', error);
    res.status(500).json({ error: 'Failed to fetch material flows' });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      orderId,
      flowType,
      transportMode,
      quantity,
      unit,
      fromLocation,
      toLocation,
      containerId,
      performedAt,
      description,
    } = req.body;

    if (!flowType || !transportMode) {
      return res.status(400).json({ error: 'flowType and transportMode are required' });
    }

    const flow = await prisma.materialFlow.create({
      data: {
        orderId: orderId ? Number(orderId) : undefined,
        flowType,
        transportMode,
        quantity: quantity != null ? Number(quantity) : undefined,
        unit,
        fromLocation,
        toLocation,
        containerId: containerId ? Number(containerId) : undefined,
        performedAt: performedAt ? new Date(performedAt) : new Date(),
        description,
      },
      include: {
        order: { select: { orderNumber: true } },
        container: { select: { containerNumber: true } },
      },
    });

    await logInfoFlow({
      ilsFunction: 'ACCOUNTING',
      eventType: 'CREATE',
      entityType: 'MATERIAL_FLOW',
      entityId: flow.id,
      orderId: flow.orderId ?? undefined,
      message: `Материальный поток: ${flowType} (${transportMode}) ${fromLocation || ''} → ${toLocation || ''}`,
    });

    res.status(201).json(flow);
  } catch (error) {
    console.error('Error creating material flow:', error);
    res.status(500).json({ error: 'Failed to create material flow' });
  }
});

export default router;
