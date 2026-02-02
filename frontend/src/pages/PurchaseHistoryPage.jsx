import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

export default function PurchaseHistoryPage() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    fetch('/orders/my', { credentials: 'include' })
      .then((res) => res.json().catch(() => []))
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false))
  }, [user])

  if (!user) {
    return (
      <div style={{ padding: '24px' }}>
        <h1>Historia zakupów</h1>
        <p>Zaloguj się, żeby zobaczyć swoje zakupy.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ padding: '24px' }}>
        <h1>Historia zakupów</h1>
        <p>Ładowanie...</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '24px' }}>
      <h1>Historia zakupów</h1>
      {user.role === 'admin' && (
        <div style={{ margin: '8px 0 16px', fontWeight: 700 }}>
          Razem: {(orders.reduce((sum, o) => sum + (o.price || 0), 0) / 100).toFixed(2)} PLN
        </div>
      )}
      {orders.length === 0 ? (
        <p>Nie masz jeszcze zakupów.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '12px' }}>
          {orders.map((o) => (
            <li
              key={o.id}
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: '10px',
                padding: '12px',
                background: '#ffffff',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                <span>Zamówienie #{o.id}</span>
                <span>{o.status}</span>
              </div>
              <div style={{ fontSize: '14px', marginTop: '6px', color: '#4b5563', display: 'grid', gap: '4px' }}>
                <div>Produkt ID: {o.product_id}</div>
                <div>Automat ID: {o.machine_id}</div>
                <div>Cena: {typeof o.price === 'number' ? (o.price / 100).toFixed(2) : o.price} zł</div>
                <div>Płatność: {o.payment_method}</div>
                <div>Data: {o.created_at}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
