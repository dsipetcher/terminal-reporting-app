import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/wagons - Получить все вагоны
router.get('/', async (req, res) => {
  try {
    const { status, warehouseId } = req.query;
    
    const where: any = {};
    
    if (status && status !== 'ALL') {
      where.status = status;
    }
    
    if (warehouseId) {
      where.warehouseId = Number(warehouseId);
    }
    
    const wagons = await prisma.wagon.findMany({
      where,
      include: {
        warehouse: true,
        container: true,
      },
      orderBy: { arrivalAt: 'desc' },
    });
    
    res.json(wagons);
  } catch (error) {
    console.error('Error fetching wagons:', error);
    res.status(500).json({ error: 'Failed to fetch wagons' });
  }
});

// GET /api/wagons/:id - Получить вагон по ID
router.get('/:id', async (req, res) => {
  try {
    const wagon = await prisma.wagon.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        warehouse: true,
        container: {
          include: {
            vesselCall: {
              include: {
                vessel: true,
              },
            },
          },
        },
      },
    });
    
    if (!wagon) {
      return res.status(404).json({ error: 'Wagon not found' });
    }
    
    res.json(wagon);
  } catch (error) {
    console.error('Error fetching wagon:', error);
    res.status(500).json({ error: 'Failed to fetch wagon' });
  }
});

// POST /api/wagons - Создать вагон
router.post('/', async (req, res) => {
  try {
    const wagon = await prisma.wagon.create({
      data: req.body,
      include: {
        warehouse: true,
        container: true,
      },
    });
    res.status(201).json(wagon);
  } catch (error) {
    console.error('Error creating wagon:', error);
    res.status(400).json({ error: 'Failed to create wagon' });
  }
});

// PUT /api/wagons/:id - Обновить вагон
router.put('/:id', async (req, res) => {
  try {
    const wagon = await prisma.wagon.update({
      where: { id: Number(req.params.id) },
      data: req.body,
      include: {
        warehouse: true,
        container: true,
      },
    });
    res.json(wagon);
  } catch (error) {
    console.error('Error updating wagon:', error);
    res.status(400).json({ error: 'Failed to update wagon' });
  }
});

// PATCH /api/wagons/:id/status - Обновить статус вагона
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const updateData: any = { status };
    
    if (status === 'DEPARTED' && !req.body.departureAt) {
      updateData.departureAt = new Date();
    }
    
    const wagon = await prisma.wagon.update({
      where: { id: Number(req.params.id) },
      data: updateData,
      include: {
        warehouse: true,
        container: true,
      },
    });
    
    res.json(wagon);
  } catch (error) {
    console.error('Error updating wagon status:', error);
    res.status(400).json({ error: 'Failed to update wagon status' });
  }
});

// DELETE /api/wagons/:id - Удалить вагон
router.delete('/:id', async (req, res) => {
  try {
    await prisma.wagon.delete({
      where: { id: Number(req.params.id) },
    });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting wagon:', error);
    res.status(400).json({ error: 'Failed to delete wagon' });
  }
});

export default router;
