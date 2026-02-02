import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

export default function ProductsPage() {
  const { user } = useAuth()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState(null)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    fetch('/products', { credentials: 'include' })
      .then((res) => res.json().catch(() => []))
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false))
  }, [user])

  const updateField = (id, field, value) => {
    setProducts((list) =>
      list.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
    )
  }

  const saveProduct = (id) => {
    const item = products.find((p) => p.id === id)
    if (!item) return
    setSavingId(id)
    fetch(`/products/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        name: item.name,
        price: Number(item.price) || 0,
        grams: Number(item.grams) || 0,
      }),
    }).finally(() => setSavingId(null))
  }

  if (!user) {
    return (
      <div style={{ padding: '24px' }}>
        <h1>Lista produktów</h1>
        <p>Musisz być zalogowany jako admin.</p>
      </div>
    )
  }

  if (user.role !== 'admin') {
    return (
      <div style={{ padding: '24px' }}>
        <h1>Lista produktów</h1>
        <p>Brak dostępu. Tylko admin może edytować produkty.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ padding: '24px' }}>
        <h1>Lista produktów</h1>
        <p>Ładowanie...</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '24px' }}>
      <h1>Lista produktów</h1>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '12px' }}>
        {products.map((p) => (
          <li
            key={p.id}
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: '10px',
              padding: '12px',
              background: '#fff',
              display: 'grid',
              gap: '8px',
            }}
          >
            <div style={{ fontWeight: 700 }}>ID: {p.id}</div>
            <label style={{ display: 'grid', gap: '4px' }}>
              <span>Nazwa</span>
              <input
                value={p.name}
                onChange={(e) => updateField(p.id, 'name', e.target.value)}
              />
            </label>
            <label style={{ display: 'grid', gap: '4px' }}>
              <span>Cena (grosze)</span>
              <input
                type="number"
                value={p.price}
                onChange={(e) => updateField(p.id, 'price', e.target.value)}
              />
            </label>
            <label style={{ display: 'grid', gap: '4px' }}>
              <span>Waga (g)</span>
              <input
                type="number"
                value={p.grams}
                onChange={(e) => updateField(p.id, 'grams', e.target.value)}
              />
            </label>
            <button
              type="button"
              onClick={() => saveProduct(p.id)}
              disabled={savingId === p.id}
              style={{
                padding: '8px 10px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                background: savingId === p.id ? '#e5e7eb' : '#f3f4f6',
                cursor: 'pointer',
              }}
            >
              {savingId === p.id ? 'Zapisywanie...' : 'Zapisz'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
