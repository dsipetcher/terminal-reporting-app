import express from 'express';
import { PrismaClient } from '@prisma/client';
import {
  applyTrainConsistStatus,
  disbandConsistAfterUnloading,
  purgeOutboundConsist,
  TRAIN_CONSIST_STATUS_LABELS,
} from '../lib/trainConsistLifecycle';

const router = express.Router();
const prisma = new PrismaClient();

const consistInclude = {
  wagons: {
    include: {
      container: { select: { id: true, containerNumber: true, status: true } },
      warehouse: true,
    },
  },
  _count: { select: { wagons: true } },
};

async function validateParkWagons(wagonIds: number[]) {
  if (!wagonIds.length) {
    return { ok: false as const, error: 'Выберите хотя бы один вагон из парка' };
  }
  const wagons = await prisma.wagon.findMany({
    where: { id: { in: wagonIds } },
    select: { id: true, status: true, trainConsistId: true, number: true },
  });
  if (wagons.length !== wagonIds.length) {
    return { ok: false as const, error: 'Некоторые вагоны не найдены' };
  }
  const invalid = wagons.filter((w) => w.status !== 'IN_PARK' || w.trainConsistId != null);
  if (invalid.length) {
    return {
      ok: false as const,
      error: `Вагоны должны быть в парке без состава: ${invalid.map((w) => w.number).join(', ')}`,
    };
  }
  return { ok: true as const, wagons };
}

// GET /api/train-consists
router.get('/', async (req, res) => {
  try {
    const { status, direction } = req.query;
    const where: Record<string, unknown> = {};
    if (status && status !== 'ALL') where.status = status;
    if (direction && direction !== 'ALL') where.direction = direction;

    const consists = await prisma.trainConsist.findMany({
      where,
      include: consistInclude,
      orderBy: { arrivalAt: 'desc' },
    });
    res.json(consists);
  } catch (error) {
    console.error('Error fetching train consists:', error);
    res.status(500).json({ error: 'Не удалось загрузить составы' });
  }
});

// GET /api/train-consists/:id
router.get('/:id', async (req, res) => {
  try {
    const consist = await prisma.trainConsist.findUnique({
      where: { id: Number(req.params.id) },
      include: consistInclude,
    });
    if (!consist) return res.status(404).json({ error: 'Состав не найден' });
    res.json(consist);
  } catch (error) {
    console.error('Error fetching train consist:', error);
    res.status(500).json({ error: 'Не удалось загрузить состав' });
  }
});

// POST /api/train-consists — входящий состав (при создании вагона/партии)
router.post('/', async (req, res) => {
  try {
    const { trainNumber, origin, track, arrivalAt, wagonIds } = req.body;
    if (!trainNumber || !arrivalAt) {
      return res.status(400).json({ error: 'Укажите номер состава и дату прибытия' });
    }

    const consist = await prisma.trainConsist.create({
      data: {
        trainNumber,
        origin: origin || null,
        track: track || null,
        direction: 'INBOUND',
        arrivalAt: new Date(arrivalAt),
        status: 'EN_ROUTE',
      },
      include: consistInclude,
    });

    if (Array.isArray(wagonIds) && wagonIds.length > 0) {
      await prisma.wagon.updateMany({
        where: { id: { in: wagonIds.map(Number) } },
        data: { trainConsistId: consist.id, trainNumber, status: 'EN_ROUTE' },
      });
    }

    const full = await prisma.trainConsist.findUnique({
      where: { id: consist.id },
      include: consistInclude,
    });
    res.status(201).json(full);
  } catch (error) {
    console.error('Error creating train consist:', error);
    res.status(400).json({ error: 'Не удалось создать состав' });
  }
});

// POST /api/train-consists/outbound — новый исходящий состав из вагонов в парке
router.post('/outbound', async (req, res) => {
  try {
    const { trainNumber, destination, track, wagonIds } = req.body;
    if (!trainNumber?.trim() || !destination?.trim()) {
      return res.status(400).json({ error: 'Укажите номер состава и пункт назначения' });
    }

    const ids = Array.isArray(wagonIds) ? wagonIds.map(Number) : [];
    const check = await validateParkWagons(ids);
    if (!check.ok) return res.status(400).json({ error: check.error });

    const now = new Date();
    const consist = await prisma.trainConsist.create({
      data: {
        trainNumber: trainNumber.trim(),
        destination: destination.trim(),
        track: track?.trim() || null,
        direction: 'OUTBOUND',
        arrivalAt: now,
        formedAt: now,
        status: 'FORMING',
      },
    });

    await prisma.wagon.updateMany({
      where: { id: { in: ids } },
      data: {
        trainConsistId: consist.id,
        trainNumber: trainNumber.trim(),
        status: 'FORMING',
      },
    });

    const full = await prisma.trainConsist.findUnique({
      where: { id: consist.id },
      include: consistInclude,
    });
    res.status(201).json(full);
  } catch (error) {
    console.error('Error creating outbound consist:', error);
    res.status(400).json({ error: 'Не удалось сформировать исходящий состав' });
  }
});

// POST /api/train-consists/:id/disband — расформировать входящий состав после разгрузки
router.post('/:id/disband', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const consist = await prisma.trainConsist.findUnique({ where: { id } });
    if (!consist) return res.status(404).json({ error: 'Состав не найден' });
    if (consist.direction !== 'INBOUND') {
      return res.status(400).json({ error: 'Расформировать можно только входящий состав' });
    }
    if (consist.status !== 'UNLOADING') {
      return res.status(400).json({
        error: 'Расформирование доступно после завершения разгрузки',
      });
    }

    await disbandConsistAfterUnloading(prisma, id);
    res.json({ id, disbanded: true });
  } catch (error) {
    console.error('Error disbanding train consist:', error);
    res.status(400).json({ error: 'Не удалось расформировать состав' });
  }
});

// PATCH /api/train-consists/:id/status
router.patch('/:id/status', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;

    if (!TRAIN_CONSIST_STATUS_LABELS[status]) {
      return res.status(400).json({ error: 'Неизвестный статус состава' });
    }

    const consist = await prisma.trainConsist.findUnique({ where: { id } });
    if (!consist) return res.status(404).json({ error: 'Состав не найден' });

    if (consist.direction === 'INBOUND') {
      const allowed: Record<string, string[]> = {
        EN_ROUTE: ['ARRIVED'],
        ARRIVED: ['UNLOADING'],
      };
      const nextAllowed = allowed[consist.status];
      if (nextAllowed && !nextAllowed.includes(status)) {
        return res.status(400).json({
          error: `Из статуса «${TRAIN_CONSIST_STATUS_LABELS[consist.status]}» доступен переход: ${nextAllowed.map((s) => TRAIN_CONSIST_STATUS_LABELS[s]).join(', ')}`,
        });
      }
      if (status === 'UNLOADING' && consist.status === 'UNLOADING') {
        return res.status(400).json({ error: 'Используйте расформирование после разгрузки' });
      }
    } else {
      if (consist.status === 'FORMING' && status === 'DEPARTED') {
        await applyTrainConsistStatus(prisma, id, 'DEPARTED');
        await purgeOutboundConsist(prisma, id);
        return res.json({ id, status: 'DEPARTED', purged: true });
      }
      return res.status(400).json({ error: 'Недопустимый переход статуса исходящего состава' });
    }

    await applyTrainConsistStatus(prisma, id, status);

    const updated = await prisma.trainConsist.findUnique({
      where: { id },
      include: consistInclude,
    });
    res.json(updated);
  } catch (error) {
    console.error('Error updating train consist status:', error);
    res.status(400).json({ error: 'Не удалось обновить статус состава' });
  }
});

// DELETE /api/train-consists/:id
router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const consist = await prisma.trainConsist.findUnique({ where: { id } });
    if (!consist) return res.status(404).json({ error: 'Состав не найден' });

    if (consist.direction === 'OUTBOUND') {
      await purgeOutboundConsist(prisma, id);
    } else {
      await disbandConsistAfterUnloading(prisma, id);
    }
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting train consist:', error);
    res.status(400).json({ error: 'Не удалось удалить состав' });
  }
});

export default router;
