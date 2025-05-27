import { useEffect, useState } from 'react'
import './App.css'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import WarehousesPage from './pages/WarehousesPage'

interface Wagon {
  id: number
  number: string
  cargo: string
  cargoWeight: number
  warehouse: string
  track: string
  arrivalAt: Date | string | null
}

export default function App() {
  const [wagons, setWagons] = useState<Wagon[]>([])
  const [form, setForm] = useState({
    number: '',
    cargo: '',
    cargoWeight: '',
    warehouse: '',
    track: ''
  });
  const [arrivalTime, setArrivalTime] = useState<Date | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const formatDateTimeLocal = (date: Date | null) => {
    if (!date) return ''
    return date.toISOString().slice(0, 16)
  }

  const parseDateTimeLocal = (value: string): Date | null => {
    return value ? new Date(value) : null
  }

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

    if (!arrivalTime) {
      alert('Пожалуйста, укажите дату и время прибытия')
      return
    }

    const res = await fetch('http://localhost:3001/api/wagons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        cargoWeight: parseFloat(form.cargoWeight),
        arrivalAt: arrivalTime.toISOString(),
      })
    })

    if (res.ok) {
      const newWagon = await res.json()
      setWagons([newWagon, ...wagons])
      setForm({
        number: '',
        cargo: '',
        cargoWeight: '',
        warehouse: '',
        track: ''
      })
      setArrivalTime(null)
    } else {
      alert('Ошибка при добавлении вагона')
    }
  }

  return (
    <Router>
      <div className={`app-container ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <aside className="sidebar">
          <h2>Меню</h2>
          <ul>
            <li><Link to="/">Статистика</Link></li>
            <li><Link to="/warehouses">Склады</Link></li>
            <li>Настройки</li>
          </ul>
        </aside>

        <div className="main-content">
          <button className="menu-button" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Меню">
            <span className="menu-icon" />
          </button>

          <Routes>
            <Route
              path="/"
              element={
                <>
                  <h1>Учет вагонов</h1>
                  <form onSubmit={handleSubmit} style={{ marginBottom: '1rem' }}>
                    <input name="number" value={form.number} onChange={handleChange} placeholder="Номер" required />
                    <input name="cargo" value={form.cargo} onChange={handleChange} placeholder="Груз" required />
                    <input name="cargoWeight" type="number" value={form.cargoWeight} onChange={handleChange} placeholder="Масса груза (т)" required />
                    <input name="warehouse" value={form.warehouse} onChange={handleChange} placeholder="Склад" required />
                    <input name="track" value={form.track} onChange={handleChange} placeholder="Путь" required />
                    <input
                      type="datetime-local"
                      value={formatDateTimeLocal(arrivalTime)}
                      onChange={(e) => setArrivalTime(parseDateTimeLocal(e.target.value))}
                      required
                    />
                    <button type="submit">Добавить</button>
                  </form>

                  <table border={1} cellPadding={8} style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Номер</th>
                        <th>Груз</th>
                        <th>Масса груза (т)</th>
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
                          <td>{w.cargoWeight}</td>
                          <td>{w.warehouse}</td>
                          <td>{w.track}</td>
                          <td>{w.arrivalAt ? new Date(w.arrivalAt).toLocaleString() : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              }
            />
            <Route path="/warehouses" element={<WarehousesPage />} />
          </Routes>
        </div>
      </div>
    </Router>
  )
}
