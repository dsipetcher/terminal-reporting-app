import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/trucks - Получить все грузовики
router.get('/', async (req, res) => {
  try {
    const trucks = await prisma.truck.findMany({
      include: {
        _count: {
          select: { visits: true },
        },
      },
      orderBy: { licensePlate: 'asc' },
    });
    res.json(trucks);
  } catch (error) {
    console.error('Error fetching trucks:', error);
    res.status(500).json({ error: 'Failed to fetch trucks' });
  }
});

// GET /api/trucks/:id - Получить грузовик по ID
router.get('/:id', async (req, res) => {
  try {
    const truck = await prisma.truck.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        visits: {
          include: {
            container: true,
          },
          orderBy: { timeSlot: 'desc' },
          take: 20,
        },
      },
    });
    
    if (!truck) {
      return res.status(404).json({ error: 'Truck not found' });
    }
    
    res.json(truck);
  } catch (error) {
    console.error('Error fetching truck:', error);
    res.status(500).json({ error: 'Failed to fetch truck' });
  }
});

// POST /api/trucks - Создать грузовик
router.post('/', async (req, res) => {
  try {
    const truck = await prisma.truck.create({
      data: req.body,
    });
    res.status(201).json(truck);
  } catch (error) {
    console.error('Error creating truck:', error);
    res.status(400).json({ error: 'Failed to create truck' });
  }
});

// PUT /api/trucks/:id - Обновить грузовик
router.put('/:id', async (req, res) => {
  try {
    const truck = await prisma.truck.update({
      where: { id: Number(req.params.id) },
      data: req.body,
    });
    res.json(truck);
  } catch (error) {
    console.error('Error updating truck:', error);
    res.status(400).json({ error: 'Failed to update truck' });
  }
});

// DELETE /api/trucks/:id - Удалить грузовик
router.delete('/:id', async (req, res) => {
  try {
    await prisma.truck.delete({
      where: { id: Number(req.params.id) },
    });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting truck:', error);
    res.status(400).json({ error: 'Failed to delete truck' });
  }
});

export default router;
