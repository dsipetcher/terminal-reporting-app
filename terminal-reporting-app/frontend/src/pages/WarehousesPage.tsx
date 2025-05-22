import { useEffect, useState } from 'react'
import axios from 'axios'

type Warehouse = {
  id: number
  number: string
  capacity: number
  load: number
}

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [number, setNumber] = useState('')
  const [capacity, setCapacity] = useState<number>(0)

  const fetchWarehouses = () => {
    axios.get('/api/warehouses').then((res) => {
      setWarehouses(res.data)
    })

  }

  useEffect(() => {
    fetchWarehouses()
  }, [])

  const handleAddWarehouse = async () => {
    if (!number || capacity <= 0) return

    try {
      await axios.post('/api/warehouses', {
        number,
        capacity,
      })


      setNumber('')
      setCapacity(0)
      fetchWarehouses()
    } catch (err) {
      console.error('Ошибка при добавлении склада:', err)
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Склады</h1>

      {/* Форма добавления */}
      <div className="mb-6 flex items-center gap-4">
        <input
          type="text"
          placeholder="Номер склада"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          className="border p-2 rounded w-40"
        />
        <input
          type="number"
          placeholder="Объём"
          value={capacity}
          onChange={(e) => setCapacity(parseInt(e.target.value))}
          className="border p-2 rounded w-32"
        />
        <button
          onClick={handleAddWarehouse}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Добавить склад
        </button>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-200 text-left">
            <th className="p-2 border">Номер</th>
            <th className="p-2 border">Объём</th>
            <th className="p-2 border">Заполненность</th>
            <th className="p-2 border">Свободно</th>
          </tr>
        </thead>
        <tbody>
          {warehouses.length === 0 ? (
            <tr>
              <td colSpan={4} className="text-center p-4 text-gray-500">
                Нет данных
              </td>
            </tr>
          ) : (
            warehouses.map((w) => (
              <tr key={w.id} className="hover:bg-gray-50">
                <td className="p-2 border">{w.number}</td>
                <td className="p-2 border">{w.capacity}</td>
                <td className="p-2 border">{w.load}</td>
                <td className="p-2 border">{w.capacity - w.load}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
