import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/truck-visits - Получить все визиты
router.get('/', async (req, res) => {
  try {
    const { status, date } = req.query;
    
    const where: any = {};
    
    if (status && status !== 'ALL') {
      where.status = status;
    }
    
    if (date) {
      const startOfDay = new Date(date as string);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date as string);
      endOfDay.setHours(23, 59, 59, 999);
      
      where.timeSlot = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }
    
    const visits = await prisma.truckVisit.findMany({
      where,
      include: {
        truck: true,
        container: true,
      },
      orderBy: { timeSlot: 'asc' },
    });
    
    res.json(visits);
  } catch (error) {
    console.error('Error fetching truck visits:', error);
    res.status(500).json({ error: 'Failed to fetch truck visits' });
  }
});

// GET /api/truck-visits/:id - Получить визит по ID
router.get('/:id', async (req, res) => {
  try {
    const visit = await prisma.truckVisit.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        truck: true,
        container: {
          include: {
            warehouse: true,
          },
        },
      },
    });
    
    if (!visit) {
      return res.status(404).json({ error: 'Truck visit not found' });
    }
    
    res.json(visit);
  } catch (error) {
    console.error('Error fetching truck visit:', error);
    res.status(500).json({ error: 'Failed to fetch truck visit' });
  }
});

// POST /api/truck-visits - Создать визит
router.post('/', async (req, res) => {
  try {
    const visit = await prisma.truckVisit.create({
      data: req.body,
      include: {
        truck: true,
        container: true,
      },
    });
    res.status(201).json(visit);
  } catch (error) {
    console.error('Error creating truck visit:', error);
    res.status(400).json({ error: 'Failed to create truck visit' });
  }
});

// PUT /api/truck-visits/:id - Обновить визит
router.put('/:id', async (req, res) => {
  try {
    const visit = await prisma.truckVisit.update({
      where: { id: Number(req.params.id) },
      data: req.body,
      include: {
        truck: true,
        container: true,
      },
    });
    res.json(visit);
  } catch (error) {
    console.error('Error updating truck visit:', error);
    res.status(400).json({ error: 'Failed to update truck visit' });
  }
});

// PATCH /api/truck-visits/:id/check-in - Отметить въезд
router.patch('/:id/check-in', async (req, res) => {
  try {
    const visit = await prisma.truckVisit.update({
      where: { id: Number(req.params.id) },
      data: {
        timeIn: new Date(),
        status: 'ARRIVED',
      },
      include: {
        truck: true,
        container: true,
      },
    });
    res.json(visit);
  } catch (error) {
    console.error('Error checking in truck:', error);
    res.status(400).json({ error: 'Failed to check in truck' });
  }
});

// PATCH /api/truck-visits/:id/check-out - Отметить выезд
router.patch('/:id/check-out', async (req, res) => {
  try {
    const visit = await prisma.truckVisit.update({
      where: { id: Number(req.params.id) },
      data: {
        timeOut: new Date(),
        status: 'COMPLETED',
      },
      include: {
        truck: true,
        container: true,
      },
    });
    res.json(visit);
  } catch (error) {
    console.error('Error checking out truck:', error);
    res.status(400).json({ error: 'Failed to check out truck' });
  }
});

// DELETE /api/truck-visits/:id - Удалить визит
router.delete('/:id', async (req, res) => {
  try {
    await prisma.truckVisit.delete({
      where: { id: Number(req.params.id) },
    });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting truck visit:', error);
    res.status(400).json({ error: 'Failed to delete truck visit' });
  }
});

export default router;
