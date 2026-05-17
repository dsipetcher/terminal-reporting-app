import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/warehouses - Получить все склады
router.get('/', async (req, res) => {
  try {
    const warehouses = await prisma.warehouse.findMany({
      include: {
        _count: {
          select: { 
            wagons: true,
            containers: true,
          },
        },
        containers: {
          select: {
            grossWeight: true,
          },
        },
      },
      orderBy: { number: 'asc' },
    });
    
    // Расчет загрузки для каждого склада
    const warehousesWithLoad = warehouses.map(warehouse => {
      const load = warehouse.containers.reduce((sum, container) => {
        return sum + (container.grossWeight || 0);
      }, 0);
      
      const { containers, ...warehouseData } = warehouse;
      
      return {
        ...warehouseData,
        load,
      };
    });
    
    res.json(warehousesWithLoad);
  } catch (error) {
    console.error('Error fetching warehouses:', error);
    res.status(500).json({ error: 'Failed to fetch warehouses' });
  }
});

// GET /api/warehouses/:id - Получить склад по ID
router.get('/:id', async (req, res) => {
  try {
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        wagons: true,
        containers: {
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
    
    if (!warehouse) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }
    
    // Расчет загрузки
    const load = warehouse.containers.reduce((sum, container) => {
      return sum + (container.grossWeight || 0);
    }, 0);
    
    res.json({
      ...warehouse,
      load,
    });
  } catch (error) {
    console.error('Error fetching warehouse:', error);
    res.status(500).json({ error: 'Failed to fetch warehouse' });
  }
});

// POST /api/warehouses - Создать склад
router.post('/', async (req, res) => {
  try {
    const warehouse = await prisma.warehouse.create({
      data: req.body,
    });
    res.status(201).json(warehouse);
  } catch (error) {
    console.error('Error creating warehouse:', error);
    res.status(400).json({ error: 'Failed to create warehouse' });
  }
});

// PUT /api/warehouses/:id - Обновить склад
router.put('/:id', async (req, res) => {
  try {
    const warehouse = await prisma.warehouse.update({
      where: { id: Number(req.params.id) },
      data: req.body,
    });
    res.json(warehouse);
  } catch (error) {
    console.error('Error updating warehouse:', error);
    res.status(400).json({ error: 'Failed to update warehouse' });
  }
});

// DELETE /api/warehouses/:id - Удалить склад
router.delete('/:id', async (req, res) => {
  try {
    await prisma.warehouse.delete({
      where: { id: Number(req.params.id) },
    });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting warehouse:', error);
    res.status(400).json({ error: 'Failed to delete warehouse' });
  }
});

export default router;
