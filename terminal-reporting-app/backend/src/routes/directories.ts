import express from 'express';
import prisma from '../lib/prisma';

const router = express.Router();

router.get('/ports', async (_req, res) => {
  try {
    const ports = await prisma.portDirectory.findMany({ orderBy: { name: 'asc' } });
    res.json(ports);
  } catch (error) {
    console.error('Error fetching ports:', error);
    res.status(500).json({ error: 'Failed to fetch ports' });
  }
});

router.get('/cargo', async (_req, res) => {
  try {
    const cargo = await prisma.cargoDirectory.findMany({ orderBy: { name: 'asc' } });
    res.json(cargo);
  } catch (error) {
    console.error('Error fetching cargo directory:', error);
    res.status(500).json({ error: 'Failed to fetch cargo directory' });
  }
});

export default router;
