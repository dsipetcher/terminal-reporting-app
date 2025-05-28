import express from 'express'
import { PrismaClient } from '@prisma/client'
import cors from 'cors'
import type { Request, Response } from 'express'

const app = express()
const prisma = new PrismaClient()

app.use(cors())
app.use(express.json())

// Получить список вагонов
app.get('/api/wagons', async (req: Request, res: Response) => {
  try {
    const warehouses = await prisma.warehouse.findMany({
      orderBy: { id: 'desc' },
    });
    res.json(warehouses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Не удалось получить склады' });
  }
});


// Добавить вагон
app.post('/api/wagons', async (req: Request, res: Response) => {
  try {
    const { number, track, cargo, cargoWeight, arrivalAt, warehouseId } = req.body;
    const warehouseIdNumber = Number(warehouseId);
        const wagon = await prisma.wagon.create({
      data: {
        number,
        track,
        cargo,
        cargoWeight,
        arrivalAt: new Date(arrivalAt),
        warehouse: {
          connect: { id: warehouseIdNumber },
        },
      },
    });

    res.status(201).json(wagon);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create wagon' });
  }
});



/**
 * 📦 Эндпоинты для складов
 */

// Получить список складов
app.get('/api/warehouses', async (req: Request, res: Response) => {
  try {
    const warehouses = await prisma.warehouse.findMany({
      orderBy: { id: 'desc' },
    })
    res.json(warehouses)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Не удалось получить склады' })
  }
})

// Добавить склад
app.post('/api/warehouses', async (req: Request, res: Response) => {
  try {
    const { number, capacity } = req.body

    const warehouse = await prisma.warehouse.create({
      data: { number, capacity },
    })

    res.status(201).json(warehouse)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Не удалось создать склад' })
  }
})

app.listen(3001, () => {
  console.log('✅ Backend running at http://localhost:3001')
})
