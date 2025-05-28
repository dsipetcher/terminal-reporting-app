import express from 'express'
import cors from 'cors'
import { PrismaClient } from '@prisma/client'

const app = express()
const prisma = new PrismaClient()

app.use(cors())
app.use(express.json())

// Get all wagons
app.get('/wagons', async (req, res) => {
  const wagons = await prisma.wagon.findMany()
  res.json(wagons)
})

// Add new wagon
app.post('/wagons', async (req, res) => {
  const { number, cargo, cargoWeight, warehouseId, track, arrivalAt } = req.body
  const wagon = await prisma.wagon.create({
    data: { number, cargo, cargoWeight, warehouseId, track, arrivalAt },
  })
  res.json(wagon)
})

// Delete wagon
app.delete('/wagons/:id', async (req, res) => {
  const { id } = req.params
  await prisma.wagon.delete({ where: { id: Number(id) } })
  res.status(204).send()
})

const PORT = 3001
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
