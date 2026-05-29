import express from 'express';
import { PrismaClient } from '@prisma/client';
import { validateContainerVesselAssignment } from '../lib/cargoAssignmentValidation';

const router = express.Router();
const prisma = new PrismaClient();

function pickContainerUpdateData(body: Record<string, unknown>, forCreate = false) {
  const data: Record<string, unknown> = {};

  if (forCreate || body.containerNumber !== undefined) {
    data.containerNumber = body.containerNumber;
  }
  if (body.containerType !== undefined) data.containerType = body.containerType;
  if (body.status !== undefined) data.status = body.status;
  if (body.cargoCategory !== undefined) data.cargoCategory = body.cargoCategory;
  if (body.supplierName !== undefined) data.supplierName = body.supplierName || null;
  if (body.quantityTons !== undefined) data.quantityTons = body.quantityTons ?? null;
  if (body.quantityUnit !== undefined) data.quantityUnit = body.quantityUnit;
  if (body.cargoDescription !== undefined) data.cargoDescription = body.cargoDescription || null;
  if (body.grossWeight !== undefined) data.grossWeight = body.grossWeight ?? null;
  if (body.sealNumber !== undefined) data.sealNumber = body.sealNumber || null;
  if (body.location !== undefined) data.location = body.location || null;
  if (body.portOfLoading !== undefined) data.portOfLoading = body.portOfLoading || null;
  if (body.portOfDischarge !== undefined) data.portOfDischarge = body.portOfDischarge || null;
  if (body.blNumber !== undefined) data.blNumber = body.blNumber || null;
  if (body.customsStatus !== undefined) data.customsStatus = body.customsStatus || null;
  if (body.vesselCallId !== undefined) data.vesselCallId = body.vesselCallId || null;
  if (body.warehouseId !== undefined) data.warehouseId = body.warehouseId || null;
  if (body.logisticsOrderId !== undefined) data.logisticsOrderId = body.logisticsOrderId || null;

  return data;
}

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
    const data = pickContainerUpdateData(req.body, true);
    const container = await prisma.container.create({
      data: data as never,
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
  } catch (error: any) {
    console.error('Error creating container:', error);
    if (error?.code === 'P2002') {
      return res.status(409).json({ error: 'Партия с таким номером уже существует' });
    }
    res.status(400).json({ error: 'Не удалось создать партию' });
  }
});

// PUT /api/containers/:id - Обновить контейнер
router.put('/:id', async (req, res) => {
  try {
    const containerId = Number(req.params.id);
    const data = pickContainerUpdateData(req.body);

    if (data.vesselCallId !== undefined && data.vesselCallId) {
      const assignmentError = await validateContainerVesselAssignment(
        prisma,
        containerId,
        data.vesselCallId as number
      );
      if (assignmentError) {
        return res.status(409).json({ error: assignmentError });
      }
    }

    const container = await prisma.container.update({
      where: { id: containerId },
      data: pickContainerUpdateData(req.body),
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
  } catch (error: any) {
    console.error('Error updating container:', error);
    if (error?.code === 'P2002') {
      return res.status(409).json({ error: 'Партия с таким номером уже существует' });
    }
    if (error?.code === 'P2025') {
      return res.status(404).json({ error: 'Партия не найдена' });
    }
    res.status(400).json({ error: 'Не удалось обновить партию' });
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
