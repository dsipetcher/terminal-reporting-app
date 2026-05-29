import express from 'express';
import { PrismaClient } from '@prisma/client';
import { validateWagonContainerAssignment } from '../lib/cargoAssignmentValidation';

const router = express.Router();
const prisma = new PrismaClient();

function pickWagonUpdateData(body: Record<string, unknown>) {
  const data: Record<string, unknown> = {};

  if (body.number !== undefined) data.number = body.number;
  if (body.wagonType !== undefined) data.wagonType = body.wagonType;
  if (body.cargo !== undefined) data.cargo = body.cargo || null;
  if (body.cargoWeight !== undefined) data.cargoWeight = body.cargoWeight ?? null;
  if (body.track !== undefined) data.track = body.track || null;
  if (body.trainNumber !== undefined) data.trainNumber = body.trainNumber || null;
  if (body.status !== undefined) data.status = body.status;
  if (body.warehouseId !== undefined) data.warehouseId = body.warehouseId || null;
  if (body.containerId !== undefined) data.containerId = body.containerId || null;
  if (body.arrivalAt !== undefined) data.arrivalAt = new Date(body.arrivalAt as string);
  if (body.departureAt !== undefined) {
    data.departureAt = body.departureAt ? new Date(body.departureAt as string) : null;
  }

  return data;
}

// GET /api/wagons - Получить все вагоны
router.get('/', async (req, res) => {
  try {
    const { status, warehouseId, withoutConsist, inParkWithoutConsist } = req.query;

    const where: Record<string, unknown> = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (warehouseId) {
      where.warehouseId = Number(warehouseId);
    }

    if (withoutConsist === 'true' || inParkWithoutConsist === 'true') {
      where.trainConsistId = null;
    }

    if (inParkWithoutConsist === 'true') {
      where.status = 'IN_PARK';
    }

    const wagons = await prisma.wagon.findMany({
      where,
      include: {
        warehouse: true,
        container: true,
        trainConsist: true,
      },
      orderBy: { arrivalAt: 'desc' },
    });

    res.json(wagons);
  } catch (error) {
    console.error('Error fetching wagons:', error);
    res.status(500).json({ error: 'Не удалось загрузить вагоны' });
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
      return res.status(404).json({ error: 'Вагон не найден' });
    }

    res.json(wagon);
  } catch (error) {
    console.error('Error fetching wagon:', error);
    res.status(500).json({ error: 'Не удалось загрузить вагон' });
  }
});

// POST /api/wagons - Создать вагон
router.post('/', async (req, res) => {
  try {
    const data = pickWagonUpdateData(req.body);
    if (!data.status) data.status = 'EN_ROUTE';

    const assignmentError = await validateWagonContainerAssignment(
      prisma,
      data.containerId as number | null | undefined,
      undefined
    );
    if (assignmentError) {
      return res.status(409).json({ error: assignmentError });
    }

    const wagon = await prisma.wagon.create({
      data: data as never,
      include: {
        warehouse: true,
        container: true,
      },
    });
    res.status(201).json(wagon);
  } catch (error: any) {
    console.error('Error creating wagon:', error);
    if (error?.code === 'P2002') {
      return res.status(409).json({ error: 'Вагон с таким номером уже существует' });
    }
    res.status(400).json({ error: 'Не удалось создать вагон' });
  }
});

// PUT /api/wagons/:id - Обновить вагон
router.put('/:id', async (req, res) => {
  try {
    const wagonId = Number(req.params.id);
    const data = pickWagonUpdateData(req.body);

    if (data.containerId !== undefined) {
      const assignmentError = await validateWagonContainerAssignment(
        prisma,
        data.containerId as number | null | undefined,
        wagonId
      );
      if (assignmentError) {
        return res.status(409).json({ error: assignmentError });
      }
    }

    const wagon = await prisma.wagon.update({
      where: { id: wagonId },
      data: data as never,
      include: {
        warehouse: true,
        container: true,
      },
    });
    res.json(wagon);
  } catch (error: any) {
    console.error('Error updating wagon:', error);
    if (error?.code === 'P2002') {
      return res.status(409).json({ error: 'Вагон с таким номером уже существует' });
    }
    if (error?.code === 'P2025') {
      return res.status(404).json({ error: 'Вагон не найден' });
    }
    res.status(400).json({ error: 'Не удалось обновить вагон' });
  }
});

// PATCH /api/wagons/:id/status - Обновить статус вагона
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const wagonId = Number(req.params.id);
    const normalizedStatus = status === 'EXPECTED' ? 'EN_ROUTE' : status;

    if (normalizedStatus === 'DEPARTED') {
      return res.status(400).json({
        error: 'Статус «Убыл» задаётся на уровне состава, а не отдельного вагона',
      });
    }

    const wagon = await prisma.wagon.update({
      where: { id: wagonId },
      data: { status: normalizedStatus },
      include: {
        warehouse: true,
        container: true,
      },
    });

    res.json(wagon);
  } catch (error) {
    console.error('Error updating wagon status:', error);
    res.status(400).json({ error: 'Не удалось обновить статус вагона' });
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
    res.status(400).json({ error: 'Не удалось удалить вагон' });
  }
});

export default router;
