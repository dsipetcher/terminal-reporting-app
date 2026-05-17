import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/berths - Получить все причалы
router.get('/', async (req, res) => {
  try {
    const berths = await prisma.berth.findMany({
      include: {
        vesselCalls: {
          where: {
            status: {
              in: ['BERTHED', 'IN_OPERATION'],
            },
          },
          include: {
            vessel: true,
          },
        },
      },
      orderBy: { number: 'asc' },
    });
    res.json(berths);
  } catch (error) {
    console.error('Error fetching berths:', error);
    res.status(500).json({ error: 'Failed to fetch berths' });
  }
});

// GET /api/berths/:id - Получить причал по ID
router.get('/:id', async (req, res) => {
  try {
    const berth = await prisma.berth.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        vesselCalls: {
          include: {
            vessel: true,
          },
          orderBy: { eta: 'desc' },
          take: 20,
        },
      },
    });
    
    if (!berth) {
      return res.status(404).json({ error: 'Berth not found' });
    }
    
    res.json(berth);
  } catch (error) {
    console.error('Error fetching berth:', error);
    res.status(500).json({ error: 'Failed to fetch berth' });
  }
});

// POST /api/berths - Создать причал
router.post('/', async (req, res) => {
  try {
    const berth = await prisma.berth.create({
      data: req.body,
    });
    res.status(201).json(berth);
  } catch (error) {
    console.error('Error creating berth:', error);
    res.status(400).json({ error: 'Failed to create berth' });
  }
});

// PUT /api/berths/:id - Обновить причал
router.put('/:id', async (req, res) => {
  try {
    const berth = await prisma.berth.update({
      where: { id: Number(req.params.id) },
      data: req.body,
    });
    res.json(berth);
  } catch (error) {
    console.error('Error updating berth:', error);
    res.status(400).json({ error: 'Failed to update berth' });
  }
});

// DELETE /api/berths/:id - Удалить причал
router.delete('/:id', async (req, res) => {
  try {
    await prisma.berth.delete({
      where: { id: Number(req.params.id) },
    });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting berth:', error);
    res.status(400).json({ error: 'Failed to delete berth' });
  }
});

export default router;
