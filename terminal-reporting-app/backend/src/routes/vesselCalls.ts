import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/vessel-calls - Получить все судозаходы
router.get('/', async (req, res) => {
  try {
    const { status, fromDate, toDate } = req.query;
    
    const where: any = {};
    
    if (status && status !== 'ALL') {
      where.status = status;
    }
    
    if (fromDate || toDate) {
      where.eta = {};
      if (fromDate) where.eta.gte = new Date(fromDate as string);
      if (toDate) where.eta.lte = new Date(toDate as string);
    }
    
    const vesselCalls = await prisma.vesselCall.findMany({
      where,
      include: {
        vessel: true,
        berth: true,
        _count: {
          select: { containers: true },
        },
      },
      orderBy: { eta: 'asc' },
    });
    
    res.json(vesselCalls);
  } catch (error) {
    console.error('Error fetching vessel calls:', error);
    res.status(500).json({ error: 'Failed to fetch vessel calls' });
  }
});

// GET /api/vessel-calls/:id - Получить судозаход по ID
router.get('/:id', async (req, res) => {
  try {
    const vesselCall = await prisma.vesselCall.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        vessel: true,
        berth: true,
        containers: true,
      },
    });
    
    if (!vesselCall) {
      return res.status(404).json({ error: 'Vessel call not found' });
    }
    
    res.json(vesselCall);
  } catch (error) {
    console.error('Error fetching vessel call:', error);
    res.status(500).json({ error: 'Failed to fetch vessel call' });
  }
});

// POST /api/vessel-calls - Создать судозаход
router.post('/', async (req, res) => {
  try {
    const vesselCall = await prisma.vesselCall.create({
      data: req.body,
      include: {
        vessel: true,
        berth: true,
      },
    });
    res.status(201).json(vesselCall);
  } catch (error) {
    console.error('Error creating vessel call:', error);
    res.status(400).json({ error: 'Failed to create vessel call' });
  }
});

// PUT /api/vessel-calls/:id - Обновить судозаход
router.put('/:id', async (req, res) => {
  try {
    const vesselCall = await prisma.vesselCall.update({
      where: { id: Number(req.params.id) },
      data: req.body,
      include: {
        vessel: true,
        berth: true,
      },
    });
    res.json(vesselCall);
  } catch (error) {
    console.error('Error updating vessel call:', error);
    res.status(400).json({ error: 'Failed to update vessel call' });
  }
});

// PATCH /api/vessel-calls/:id/status - Обновить статус судозахода
router.patch('/:id/status', async (req, res) => {
  try {
    const { status, berthId } = req.body;
    const updateData: any = { status };

    const normalizedStatus = status === 'EXPECTED' ? 'EN_ROUTE' : status === 'BERTHED' ? 'ARRIVED' : status === 'IN_OPERATION' ? 'UNLOADING' : status;
    updateData.status = normalizedStatus;

    if (normalizedStatus === 'ARRIVED' && berthId) {
      updateData.berthId = Number(berthId);
    }

    // Автоматически устанавливать фактическое время
    if (normalizedStatus === 'ARRIVED' && !req.body.ata) {
      updateData.ata = new Date();
    }
    if (normalizedStatus === 'DEPARTED' && !req.body.atd) {
      updateData.atd = new Date();
    }

    const vesselCall = await prisma.vesselCall.update({
      where: { id: Number(req.params.id) },
      data: updateData,
      include: {
        vessel: true,
        berth: true,
      },
    });

    res.json(vesselCall);
  } catch (error) {
    console.error('Error updating vessel call status:', error);
    res.status(400).json({ error: 'Failed to update vessel call status' });
  }
});

// DELETE /api/vessel-calls/:id - Удалить судозаход
router.delete('/:id', async (req, res) => {
  try {
    await prisma.vesselCall.delete({
      where: { id: Number(req.params.id) },
    });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting vessel call:', error);
    res.status(400).json({ error: 'Failed to delete vessel call' });
  }
});

export default router;
