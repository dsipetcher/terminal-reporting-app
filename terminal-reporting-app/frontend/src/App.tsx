import { useEffect, useState } from 'react'

interface Wagon {
  id: number
  number: string
  cargo: string
  warehouse: string
  track: string
  arrivalAt: string
}

export default function App() {
  const [wagons, setWagons] = useState<Wagon[]>([])
  const [form, setForm] = useState({ number: '', cargo: '', warehouse: '', track: '' })

  useEffect(() => {
    fetch('http://localhost:3001/api/wagons')
      .then(res => res.json())
      .then(setWagons)
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('http://localhost:3001/api/wagons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })

    if (res.ok) {
      const newWagon = await res.json()
      setWagons([newWagon, ...wagons])
      setForm({ number: '', cargo: '', warehouse: '', track: '' })
    } else {
      alert('Ошибка при добавлении вагона')
    }
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Учет вагонов</h1>

      <form onSubmit={handleSubmit} style={{ marginBottom: '1rem' }}>
        <input name="number" value={form.number} onChange={handleChange} placeholder="Номер" required />
        <input name="cargo" value={form.cargo} onChange={handleChange} placeholder="Груз" required />
        <input name="warehouse" value={form.warehouse} onChange={handleChange} placeholder="Склад" required />
        <input name="track" value={form.track} onChange={handleChange} placeholder="Путь" required />
        <button type="submit">Добавить</button>
      </form>

      <table border={1} cellPadding={8} style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Номер</th>
            <th>Груз</th>
            <th>Склад</th>
            <th>Путь</th>
            <th>Время прибытия</th>
          </tr>
        </thead>
        <tbody>
          {wagons.map(w => (
            <tr key={w.id}>
              <td>{w.id}</td>
              <td>{w.number}</td>
              <td>{w.cargo}</td>
              <td>{w.warehouse}</td>
              <td>{w.track}</td>
              <td>{new Date(w.arrivalAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
