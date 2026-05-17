import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/containers - Получить все контейнеры
router.get('/', async (req, res) => {
  try {
    const { status, containerType, warehouseId } = req.query;
    
    const where: any = {};
    
    if (status && status !== 'ALL') {
      where.status = status;
    }
    
    if (containerType && containerType !== 'ALL') {
      where.containerType = containerType;
    }
    
    if (warehouseId) {
      where.warehouseId = Number(warehouseId);
    }
    
    const containers = await prisma.container.findMany({
      where,
      include: {
        vesselCall: {
          include: {
            vessel: true,
          },
        },
        warehouse: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    
    res.json(containers);
  } catch (error) {
    console.error('Error fetching containers:', error);
    res.status(500).json({ error: 'Failed to fetch containers' });
  }
});

// GET /api/containers/:id - Получить контейнер по ID
router.get('/:id', async (req, res) => {
  try {
    const container = await prisma.container.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        vesselCall: {
          include: {
            vessel: true,
            berth: true,
          },
        },
        warehouse: true,
        wagons: true,
        truckVisits: {
          include: {
            truck: true,
          },
        },
      },
    });
    
    if (!container) {
      return res.status(404).json({ error: 'Container not found' });
    }
    
    res.json(container);
  } catch (error) {
    console.error('Error fetching container:', error);
    res.status(500).json({ error: 'Failed to fetch container' });
  }
});

// GET /api/containers/number/:containerNumber - Поиск по номеру
router.get('/number/:containerNumber', async (req, res) => {
  try {
    const container = await prisma.container.findUnique({
      where: { containerNumber: req.params.containerNumber },
      include: {
        vesselCall: {
          include: {
            vessel: true,
          },
        },
        warehouse: true,
      },
    });
    
    if (!container) {
      return res.status(404).json({ error: 'Container not found' });
    }
    
    res.json(container);
  } catch (error) {
    console.error('Error fetching container:', error);
    res.status(500).json({ error: 'Failed to fetch container' });
  }
});

// POST /api/containers - Создать контейнер
router.post('/', async (req, res) => {
  try {
    const container = await prisma.container.create({
      data: req.body,
      include: {
        vesselCall: {
          include: {
            vessel: true,
          },
        },
        warehouse: true,
      },
    });
    res.status(201).json(container);
  } catch (error) {
    console.error('Error creating container:', error);
    res.status(400).json({ error: 'Failed to create container' });
  }
});

// PUT /api/containers/:id - Обновить контейнер
router.put('/:id', async (req, res) => {
  try {
    const container = await prisma.container.update({
      where: { id: Number(req.params.id) },
      data: req.body,
      include: {
        vesselCall: {
          include: {
            vessel: true,
          },
        },
        warehouse: true,
      },
    });
    res.json(container);
  } catch (error) {
    console.error('Error updating container:', error);
    res.status(400).json({ error: 'Failed to update container' });
  }
});

// PATCH /api/containers/:id/move - Переместить контейнер
router.patch('/:id/move', async (req, res) => {
  try {
    const { warehouseId, location, status } = req.body;
    
    const container = await prisma.container.update({
      where: { id: Number(req.params.id) },
      data: {
        warehouseId: warehouseId ? Number(warehouseId) : null,
        location,
        status: status || 'IN_TERMINAL',
      },
      include: {
        warehouse: true,
      },
    });
    
    res.json(container);
  } catch (error) {
    console.error('Error moving container:', error);
    res.status(400).json({ error: 'Failed to move container' });
  }
});

// DELETE /api/containers/:id - Удалить контейнер
router.delete('/:id', async (req, res) => {
  try {
    await prisma.container.delete({
      where: { id: Number(req.params.id) },
    });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting container:', error);
    res.status(400).json({ error: 'Failed to delete container' });
  }
});

export default router;
