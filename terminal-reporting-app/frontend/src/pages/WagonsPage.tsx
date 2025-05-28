import { useEffect, useState } from 'react'
import axios from 'axios'

type Wagon = {
  id: number
  number: string
  cargo: string
  cargoWeight?: number | null
  warehouse: {
    id: number
    number: string
  }
  track: string
  arrivalAt: string | null
}

type Warehouse = {
  id: number
  number: string
  capacity: number
}

export default function WagonsPage() {
  const [wagons, setWagons] = useState<Wagon[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])

  const [number, setNumber] = useState('')
  const [cargo, setCargo] = useState('')
  const [track, setTrack] = useState('')
  const [cargoWeight, setCargoWeight] = useState('')
  const [arrivalAt, setArrivalAt] = useState('')
  const [warehouseId, setWarehouseId] = useState<number | ''>('')

  useEffect(() => {
    axios.get('http://localhost:3001/api/wagons').then((res) => {
      setWagons(res.data)
    })

    axios.get('http://localhost:3001/api/warehouses').then((res) => {
      setWarehouses(res.data)
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await axios.post('http://localhost:3001/api/wagons', {
        number,
        cargo,
        track,
        arrivalAt,
        cargoWeight: parseFloat(cargoWeight),
        warehouseId: Number(warehouseId),
      })



      setNumber('')
      setCargo('')
      setCargoWeight('')
      setTrack('')
      setArrivalAt('')
      setWarehouseId('')

      const updated = await axios.get('http://localhost:3001/api/wagons')
      setWagons(updated.data)
    } catch (error) {
      console.error('Ошибка при создании вагона:', error)
    }
  }

  return (
    <div>
      <h1>Wagon Report</h1>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Wagon number"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Cargo"
          value={cargo}
          onChange={(e) => setCargo(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="CargoWeight"
          value={cargoWeight}
          onChange={(e) => setCargoWeight(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Track"
          value={track}
          onChange={(e) => setTrack(e.target.value)}
          required
        />
        <input
          type="datetime-local"
          value={arrivalAt}
          onChange={(e) => setArrivalAt(e.target.value)}
          required
        />

        <select
          value={warehouseId}
          onChange={(e) => setWarehouseId(Number(e.target.value))}
          required
        >
          <option value="">Выберите склад</option>
          {warehouses.map((w) => (
            <option key={w.id} value={w.id}>
              Склад {w.number}
            </option>
          ))}
        </select>

        <button type="submit">Добавить вагон</button>
      </form>

      <table>
        <thead>
          <tr>
            <th>Number</th>
            <th>Cargo</th>
            <th>Cargo Weight</th>
            <th>Warehouse</th>
            <th>Track</th>
            <th>Arrival</th>
          </tr>
        </thead>
        <tbody>
          {wagons.map((wagon) => (
            <tr key={wagon.id}>
              <td>{wagon.number}</td>
              <td>{wagon.cargo}</td>
              <td>{wagon.cargoWeight}</td>
              <td>{wagon.warehouse?.number ?? '—'}</td>
              <td>{wagon.track}</td>
              <td>{wagon.arrivalAt ? new Date(wagon.arrivalAt).toLocaleString() : '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
