import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import './PurchaseHistoryPage.css'

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
      <div className="historyPage">
        <h1>Historia zakupów</h1>
        <p>Zaloguj się, żeby zobaczyć swoje zakupy.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="historyPage">
        <h1>Historia zakupów</h1>
        <p>Ładowanie...</p>
      </div>
    )
  }

  return (
    <div className="historyPage">
      <h1>Historia zakupów</h1>
      {user.role === 'admin' && (
        <div className="historySummary">
          Razem: {(orders.reduce((sum, o) => sum + (o.price || 0), 0) / 100).toFixed(2)} PLN
        </div>
      )}
      {orders.length === 0 ? (
        <p>Nie masz jeszcze zakupów.</p>
      ) : (
        <ul className="historyList">
          {orders.map((o) => (
            <li key={o.id} className="historyCard">
              <div className="historyTop">
                <span>Zamówienie #{o.id}</span>
                <span>{o.status}</span>
              </div>
              <div className="historyMeta">
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
