import { useEffect, useState } from 'react'
import axios from 'axios'

type Wagon = {
  id: number
  number: string
  cargo: string
  warehouse: string
  track: string
  arrivalAt: string
}

export default function WagonsPage() {
  const [wagons, setWagons] = useState<Wagon[]>([])

  useEffect(() => {
    axios.get('http://localhost:3001/wagons').then((res) => {
      setWagons(res.data)
    })
  }, [])

  return (
    <div>
      <h1>Wagon Report</h1>
      <table>
        <thead>
          <tr>
            <th>Number</th>
            <th>Cargo</th>
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
              <td>{wagon.warehouse}</td>
              <td>{wagon.track}</td>
              <td>{new Date(wagon.arrivalAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
