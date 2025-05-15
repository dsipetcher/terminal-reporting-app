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
app.post('/api/wagons', async (req, res):Promise<void> => {
  const { number, cargo, warehouse, track } = req.body
  if (!number || !cargo || !warehouse || !track) {
    res.status(400).json({ error: 'Missing fields' })
  }

  const wagon = await prisma.wagon.create({
    data: { number, cargo, warehouse, track }
  })
  res.status(201).json(wagon)
})

app.listen(3001, () => {
  console.log('✅ Backend running at http://localhost:3001')
})
