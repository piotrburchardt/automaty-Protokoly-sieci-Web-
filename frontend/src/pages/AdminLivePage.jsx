import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import './AdminLivePage.css'

export default function AdminLivePage() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [issues, setIssues] = useState([])
  const [machines, setMachines] = useState([])

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      return
    }

    const es = new EventSource('/sse/admin')
    es.onmessage = (e) => {
      const data = JSON.parse(e.data)
      if (data.orders) setOrders((prev) => [...data.orders, ...prev].slice(0, 10))
      if (data.issues) setIssues((prev) => [...data.issues, ...prev].slice(0, 10))
      if (data.machines) setMachines(data.machines)
    }
    return () => es.close()
  }, [user])

  if (!user) {
    return (
      <div className="adminLive">
        <h1>Panel live</h1>
        <p>Zaloguj się jako admin.</p>
      </div>
    )
  }

  if (user.role !== 'admin') {
    return (
      <div className="adminLive">
        <h1>Panel live</h1>
        <p>Brak dostępu.</p>
      </div>
    )
  }

  return (
    <div className="adminLive">
      <h1>Panel live</h1>

      <div className="liveGrid">
        <section>
          <h2>Nowe zamówienia</h2>
          {orders.length === 0 ? (
            <p>Brak nowych.</p>
          ) : (
            <ul>
              {orders.map((o) => (
                <li key={o.id}>
                  automat {o.machine_id} | produkt {o.product_id} | {o.created_at}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2>Nowe usterki</h2>
          {issues.length === 0 ? (
            <p>Brak nowych.</p>
          ) : (
            <ul>
              {issues.map((i) => (
                <li key={i.id}>
                  #{i.id} | automat {i.machine_id} | {i.title} | {i.description} | {i.created_at}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2>Maszyny</h2>
          {machines.length === 0 ? (
            <p>Brak danych.</p>
          ) : (
            <ul>
              {machines.map((m) => (
                <li key={m.id}>
                  #{m.id} {m.city} - {m.location} | {m.status}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
