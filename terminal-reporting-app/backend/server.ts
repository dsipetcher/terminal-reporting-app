import express from 'express'
import { PrismaClient } from '@prisma/client'
import cors from 'cors'

const app = express()
const prisma = new PrismaClient()

app.use(cors())
app.use(express.json())

// Получить список вагонов
app.get('/api/wagons', async (req, res) => {
  const wagons = await prisma.wagon.findMany({ orderBy: { id: 'desc' } })
  res.json(wagons)
})

// Добавить вагон
app.post('/api/wagons', async (req, res) => {
  try {
    const { number, track, warehouse, cargo, arrivalAt } = req.body;

    const wagon = await prisma.wagon.create({
      data: {
        number,
        track,
        warehouse,
        cargo,
        arrivalAt: new Date(arrivalAt),
      },
    });

    res.status(201).json(wagon);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Не удалось создать вагон' });
  }
});


app.listen(3001, () => {
  console.log('✅ Backend running at http://localhost:3001')
})
