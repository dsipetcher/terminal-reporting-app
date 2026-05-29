import express from 'express';
import prisma from '../lib/prisma';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { ilsFunction, entityType, orderId, limit } = req.query;
    const where: Record<string, unknown> = {};
    if (ilsFunction && ilsFunction !== 'ALL') where.ilsFunction = String(ilsFunction);
    if (entityType && entityType !== 'ALL') where.entityType = String(entityType);
    if (orderId) where.orderId = Number(orderId);

    const events = await prisma.infoFlowEvent.findMany({
      where,
      include: {
        user: { select: { id: true, username: true, fullName: true } },
        order: { select: { id: true, orderNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit ? Number(limit) : 100,
    });
    res.json(events);
  } catch (error) {
    console.error('Error fetching info flow events:', error);
    res.status(500).json({ error: 'Failed to fetch info flow events' });
  }
});

export default router;
