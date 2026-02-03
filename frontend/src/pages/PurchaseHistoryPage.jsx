import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import './PurchaseHistoryPage.css'

export default function PurchaseHistoryPage() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [machines, setMachines] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    Promise.all([
      fetch('/orders/my', { credentials: 'include' }).then((res) => res.json().catch(() => [])),
      fetch('/products', { credentials: 'include' }).then((res) => res.json().catch(() => [])),
      fetch('/machines', { credentials: 'include' }).then((res) => res.json().catch(() => [])),
    ])
      .then(([ordersData, productsData, machinesData]) => {
        setOrders(Array.isArray(ordersData) ? ordersData : [])
        setProducts(Array.isArray(productsData) ? productsData : [])
        setMachines(Array.isArray(machinesData) ? machinesData : [])
      })
      .finally(() => setLoading(false))
  }, [user])

  const productName = (id) => {
    const p = products.find((x) => x.id === id)
    return p ? p.name : `ID: ${id}`
  }

  const machineLabel = (id) => {
    const m = machines.find((x) => x.id === id)
    return m ? `${m.city} — ${m.location}` : `ID: ${id}`
  }

  if (!user) return null

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
              </div>
              <div className="historyMeta">
                <div>Produkt: {productName(o.product_id)}</div>
                <div>Automat: {machineLabel(o.machine_id)}</div>
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
