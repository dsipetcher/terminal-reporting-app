import express from 'express';
import prisma from '../lib/prisma';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { partnerType } = req.query;
    const where: Record<string, string> = {};
    if (partnerType && partnerType !== 'ALL') where.partnerType = String(partnerType);

    const items = await prisma.counterparty.findMany({
      where,
      include: { _count: { select: { orders: true } } },
      orderBy: { name: 'asc' },
    });
    res.json(items);
  } catch (error) {
    console.error('Error fetching counterparties:', error);
    res.status(500).json({ error: 'Failed to fetch counterparties' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { code, name, partnerType, inn, contact } = req.body;
    if (!code || !name || !partnerType) {
      return res.status(400).json({ error: 'code, name and partnerType are required' });
    }
    const item = await prisma.counterparty.create({
      data: { code, name, partnerType, inn, contact },
    });
    res.status(201).json(item);
  } catch (error) {
    console.error('Error creating counterparty:', error);
    res.status(500).json({ error: 'Failed to create counterparty' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const item = await prisma.counterparty.update({
      where: { id: Number(req.params.id) },
      data: req.body,
    });
    res.json(item);
  } catch (error) {
    console.error('Error updating counterparty:', error);
    res.status(500).json({ error: 'Failed to update counterparty' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.counterparty.delete({ where: { id: Number(req.params.id) } });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting counterparty:', error);
    res.status(500).json({ error: 'Failed to delete counterparty' });
  }
});

export default router;
