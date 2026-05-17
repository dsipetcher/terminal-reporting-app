import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/vessels - Получить все суда
router.get('/', async (req, res) => {
  try {
    const vessels = await prisma.vessel.findMany({
      include: {
        _count: {
          select: { vesselCalls: true },
        },
      },
      orderBy: { name: 'asc' },
    });
    res.json(vessels);
  } catch (error) {
    console.error('Error fetching vessels:', error);
    res.status(500).json({ error: 'Failed to fetch vessels' });
  }
});

// GET /api/vessels/:id - Получить судно по ID
router.get('/:id', async (req, res) => {
  try {
    const vessel = await prisma.vessel.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        vesselCalls: {
          include: {
            berth: true,
            _count: {
              select: { containers: true },
            },
          },
          orderBy: { eta: 'desc' },
          take: 10,
        },
      },
    });
    
    if (!vessel) {
      return res.status(404).json({ error: 'Vessel not found' });
    }
    
    res.json(vessel);
  } catch (error) {
    console.error('Error fetching vessel:', error);
    res.status(500).json({ error: 'Failed to fetch vessel' });
  }
});

// POST /api/vessels - Создать новое судно
router.post('/', async (req, res) => {
  try {
    const vessel = await prisma.vessel.create({
      data: req.body,
    });
    res.status(201).json(vessel);
  } catch (error) {
    console.error('Error creating vessel:', error);
    res.status(400).json({ error: 'Failed to create vessel' });
  }
});

// PUT /api/vessels/:id - Обновить судно
router.put('/:id', async (req, res) => {
  try {
    const vessel = await prisma.vessel.update({
      where: { id: Number(req.params.id) },
      data: req.body,
    });
    res.json(vessel);
  } catch (error) {
    console.error('Error updating vessel:', error);
    res.status(400).json({ error: 'Failed to update vessel' });
  }
});

// DELETE /api/vessels/:id - Удалить судно
router.delete('/:id', async (req, res) => {
  try {
    await prisma.vessel.delete({
      where: { id: Number(req.params.id) },
    });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting vessel:', error);
    res.status(400).json({ error: 'Failed to delete vessel' });
  }
});

export default router;
