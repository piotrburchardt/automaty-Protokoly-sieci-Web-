import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import './ProductsPage.css'

export default function ProductsPage() {
  const { user } = useAuth()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [newProduct, setNewProduct] = useState({ name: '', price: '', grams: '' })

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

  const deleteProduct = (id) => {
    setDeletingId(id)
    fetch(`/products/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    }).then(() => {
      setProducts((list) => list.filter((p) => p.id !== id))
      setDeletingId(null)
    })
  }

  const addProduct = (e) => {
    e.preventDefault()
    if (!newProduct.name.trim()) return
    fetch('/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        name: newProduct.name,
        price: Number(newProduct.price) || 0,
        grams: Number(newProduct.grams) || 0,
      }),
    })
      .then(() => fetch('/products', { credentials: 'include' }))
      .then((res) => res.json().catch(() => []))
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .finally(() => setNewProduct({ name: '', price: '', grams: '' }))
  }

  if (!user) {
    return (
      <div className="productsPage">
        <h1>Lista produktów</h1>
        <p>Musisz być zalogowany jako admin.</p>
      </div>
    )
  }

  if (user.role !== 'admin') {
    return (
      <div className="productsPage">
        <h1>Lista produktów</h1>
        <p>Brak dostępu. Tylko admin może edytować produkty.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="productsPage">
        <h1>Lista produktów</h1>
        <p>Ładowanie...</p>
      </div>
    )
  }

  return (
    <div className="productsPage">
      <h1>Lista produktów</h1>
      <form onSubmit={addProduct} className="productsAddForm">
        <strong>Dodaj produkt</strong>
        <input
          placeholder="Nazwa"
          value={newProduct.name}
          onChange={(e) => setNewProduct((v) => ({ ...v, name: e.target.value }))}
        />
        <input
          type="number"
          placeholder="Cena (grosze)"
          value={newProduct.price}
          onChange={(e) => setNewProduct((v) => ({ ...v, price: e.target.value }))}
        />
        <input
          type="number"
          placeholder="Waga (g)"
          value={newProduct.grams}
          onChange={(e) => setNewProduct((v) => ({ ...v, grams: e.target.value }))}
        />
        <button type="submit" className="productsBtn">
          Dodaj
        </button>
      </form>
      <ul className="productsCardList">
        {products.map((p) => (
          <li key={p.id} className="productsCard">
            <div className="productsCardTitle">ID: {p.id}</div>
            <label className="productsField">
              <span>Nazwa</span>
              <input
                value={p.name}
                onChange={(e) => updateField(p.id, 'name', e.target.value)}
              />
            </label>
            <label className="productsField">
              <span>Cena (grosze)</span>
              <input
                type="number"
                value={p.price}
                onChange={(e) => updateField(p.id, 'price', e.target.value)}
              />
            </label>
            <label className="productsField">
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
              className="productsBtn"
            >
              {savingId === p.id ? 'Zapisywanie...' : 'Zapisz'}
            </button>
            <button
              type="button"
              onClick={() => deleteProduct(p.id)}
              disabled={deletingId === p.id}
              className="productsBtn danger"
            >
              {deletingId === p.id ? 'Usuwanie...' : 'Usuń'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
