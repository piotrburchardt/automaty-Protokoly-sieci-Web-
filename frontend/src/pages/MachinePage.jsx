import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import vendingMachineSvg from '../assets/vending-machine.svg'
import { useAuth } from '../context/AuthContext.jsx'
import './MachinePage.css'

export default function MachinePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [machine, setMachine] = useState(null)
  const [inventory, setInventory] = useState([])
  const [products, setProducts] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ city: '', location: '', status: '' })
  const [newItem, setNewItem] = useState({ product_id: '', qty: 1 })
  const [buyProductId, setBuyProductId] = useState('')
  const [buyStatus, setBuyStatus] = useState('')
  const [buyStatusType, setBuyStatusType] = useState('info')
  const [issueForm, setIssueForm] = useState({ title: '', description: '' })
  const [issueStatus, setIssueStatus] = useState('')
  const [issueStatusType, setIssueStatusType] = useState('info')

  useEffect(() => {
    let ignore = false

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const [machineRes, invRes, productsRes] = await Promise.all([
          fetch(`/machines/${id}`),
          fetch(`/machines/${id}/inventory`),
          user?.role === 'admin' ? fetch('/products') : Promise.resolve(null),
        ])

        if (!machineRes.ok) throw new Error('Nie znaleziono automatu')
        if (!invRes.ok) throw new Error('Błąd wczytywania produktów')
        if (productsRes && !productsRes.ok) throw new Error('Błąd wczytywania produktów')

        const machineData = await machineRes.json()
        const invData = await invRes.json()
        const productsData = productsRes ? await productsRes.json() : []

        if (ignore) return

        setMachine(machineData)
        setForm({
          city: machineData.city || '',
          location: machineData.location || '',
          status: machineData.status || '',
        })
        setInventory(invData)
        setProducts(productsData)
      } catch (err) {
        if (!ignore) setError(err.message || String(err))
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    load()
    return () => {
      ignore = true
    }
  }, [id, user?.role])

  const loadInventory = () =>
    fetch(`/machines/${id}/inventory`)
      .then((res) => res.json())
      .then(setInventory)
      .catch((err) => setError(err.message || String(err)))

  const totalItems = inventory.reduce((sum, item) => sum + Number(item.qty || 0), 0)
  const totalValue = inventory.reduce((sum, item) => sum + Number(item.qty || 0) * item.price, 0)

  const availableProducts = products.filter((p) => !inventory.some((i) => i.product_id === p.id))

  const selectedProductId = availableProducts.length
    ? newItem.product_id || String(availableProducts[0].id)
    : ''

  const handleUpdateMachine = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/machines/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Nie udało się zapisać')
      setMachine((prev) => ({ ...prev, ...form }))
    } catch (err) {
      setError(err.message || String(err))
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteMachine = async () => {
    if (!window.confirm('Usunąć ten automat?')) return
    setError(null)
    try {
      const res = await fetch(`/machines/${id}`, { method: 'DELETE' })
      if (res.status === 204) navigate('/HomePage')
      else throw new Error('Nie udało się usunąć automatu')
    } catch (err) {
      setError(err.message || String(err))
    }
  }

  const handleQtyChange = (productId, rawValue) => {
    setInventory((prev) =>
      prev.map((item) =>
        item.product_id === productId
          ? { ...item, qty: rawValue === '' ? '' : Number(rawValue) }
          : item
      )
    )
  }

  const handleQtySave = async (productId, qty) => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/machines/${id}/inventory/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qty }),
      })
      if (!res.ok) throw new Error('Nie udało się zapisać ilości')
      await loadInventory()
    } catch (err) {
      setError(err.message || String(err))
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteItem = async (productId) => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/machines/${id}/inventory/${productId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Nie udało się usunąć produktu')
      await loadInventory()
    } catch (err) {
      setError(err.message || String(err))
    } finally {
      setSaving(false)
    }
  }

  const handleAddItem = async (e) => {
    e.preventDefault()
    if (!selectedProductId) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/machines/${id}/inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: Number(selectedProductId),
          qty: Number(newItem.qty),
        }),
      })
      if (!res.ok) throw new Error('Nie udało się dodać produktu')
      setNewItem({ product_id: '', qty: 1 })
      await loadInventory()
    } catch (err) {
      setError(err.message || String(err))
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    if (inventory.length > 0) {
      setBuyProductId(String(inventory[0].product_id))
    }
  }, [inventory])

  const handleBuy = (e) => {
    e.preventDefault()
    if (!buyProductId) return
    const item = inventory.find((i) => String(i.product_id) === String(buyProductId))
    if (!item) return
    setBuyStatus('Kupowanie...')
    setBuyStatusType('info')
    fetch('/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        machine_id: Number(id),
        product_id: Number(buyProductId),
        status: 'paid',
        price: item.price,
        created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
        payment_method: 'card',
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Nie udało się kupić')
        setBuyStatus('Kupiono produkt')
        setBuyStatusType('success')
        loadInventory()
        setTimeout(() => setBuyStatus(''), 1500)
      })
      .catch((err) => {
        setBuyStatus(err.message || String(err))
        setBuyStatusType('error')
      })
  }

  const handleIssue = (e) => {
    e.preventDefault()
    if (!issueForm.title.trim() || !issueForm.description.trim()) return
    setIssueStatus('Wysyłanie...')
    setIssueStatusType('info')
    fetch('/issues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        machine_id: Number(id),
        title: issueForm.title,
        description: issueForm.description,
        status: 'open',
        created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
        closed_at: null,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Nie udało się wysłać usterki')
        setIssueStatus('Zgłoszono usterkę')
        setIssueStatusType('success')
        setIssueForm({ title: '', description: '' })
        setTimeout(() => setIssueStatus(''), 1500)
      })
      .catch((err) => {
        setIssueStatus(err.message || String(err))
        setIssueStatusType('error')
      })
  }

  if (loading) return <div className="machinePageShell">Ładowanie...</div>
  if (error) return <div className="machinePageShell errorBox">{error}</div>
  if (!machine) return <div className="machinePageShell">Brak danych</div>

  return (
    <div className="machinePageShell">
      <button type="button" className="backLink" onClick={() => navigate('/HomePage')}>
        ← Powrót
      </button>

      <div className="machineHero">
        <div className="machineMeta">
          <div className="eyebrow">Automat #{machine.id}</div>
          <h1>{machine.city} — {machine.location}</h1>
          <div className="statusRow">
            <span className={`statusDot ${machine.status === 'aktywny' ? 'isActive' : ''}`} />
            <span className="statusText">{machine.status}</span>
          </div>
          {user && user.role !== 'admin' && (
            <div className="userActions">
              <div className="userActionsCard">
                <div className="userActionsTitle">Kup produkt</div>
                {inventory.length > 0 ? (
                  <>
                    <label className="userActionsLabel">
                      <span>Wybierz</span>
                      <select value={buyProductId} onChange={(e) => setBuyProductId(e.target.value)}>
                        {inventory.map((item) => (
                          <option key={item.product_id} value={item.product_id}>
                            {item.name} — {(item.price / 100).toFixed(2)} zł (qty: {item.qty})
                          </option>
                        ))}
                      </select>
                    </label>
                <button type="button" className="userBtn" onClick={handleBuy}>
                  Kup teraz
                </button>
                {buyStatus && (
                  <div className={`userStatus ${buyStatusType === 'success' ? 'ok' : buyStatusType === 'error' ? 'err' : ''}`}>
                    {buyStatus}
                  </div>
                )}
                  </>
                ) : (
                  <div className="mutedNote">Brak produktów do zakupu</div>
                )}
              </div>

              <div className="userActionsCard">
                <div className="userActionsTitle">Zgłoś usterkę</div>
                <input
                  placeholder="Tytuł"
                  value={issueForm.title}
                  onChange={(e) => setIssueForm((f) => ({ ...f, title: e.target.value }))}
                />
                <textarea
                  placeholder="Opis"
                  rows={3}
                  value={issueForm.description}
                  onChange={(e) => setIssueForm((f) => ({ ...f, description: e.target.value }))}
                />
                <button type="button" className="userBtn" onClick={handleIssue}>
                  Wyślij usterkę
                </button>
                {issueStatus && (
                  <div className={`userStatus ${issueStatusType === 'success' ? 'ok' : issueStatusType === 'error' ? 'err' : ''}`}>
                    {issueStatus}
                  </div>
                )}
              </div>
            </div>
          )}
          {user?.role === 'admin' && (
            <form className="machineForm" onSubmit={handleUpdateMachine}>
              <div className="formRow">
                <label>
                  Miasto
                  <input
                    value={form.city}
                    onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                    required
                  />
                </label>
                <label>
                  Lokalizacja
                  <input
                    value={form.location}
                    onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                    required
                  />
                </label>
              </div>
              <label className="statusSelect">
                Status
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                >
                  <option value="aktywny">aktywny</option>
                  <option value="nieaktywny">nieaktywny</option>
                </select>
              </label>
              <div className="actionsRow">
                <button type="submit" disabled={saving}>Zapisz dane</button>
                <button type="button" className="danger" onClick={handleDeleteMachine}>Usuń automat</button>
              </div>
            </form>
          )}
          {user?.role === 'admin' && (
            <div className="statRow">
              <div className="statCard">
                <div className="statLabel">Łączna liczba produktów</div>
                <div className="statValue">{totalItems}</div>
              </div>
              <div className="statCard">
                <div className="statLabel">Wartość zapasu</div>
                <div className="statValue">{(totalValue / 100).toFixed(2)} zł</div>
              </div>
            </div>
          )}
        </div>
        <div className="heroIllustration">
          <img src={vendingMachineSvg} alt="" />
        </div>
      </div>

      <div className="inventoryCard">
        <div className="inventoryHeader">
          <h2>Produkty w automacie</h2>
          <div className="inventoryCount">{inventory.length} pozycji</div>
        </div>
        <div className="inventoryGrid">
          {inventory.map((item) => (
            <div key={item.product_id} className="inventoryItem">
              <div className="itemTitle">{item.name}</div>
              <div className="itemMeta">
                <span>{item.grams} g</span>
                <span>·</span>
                <span>{(item.price / 100).toFixed(2)} zł</span>
              </div>
              <div className="itemQty">Stan: {Number(item.qty || 0)} szt.</div>
              {user?.role === 'admin' && (
                <div className="adminControls">
                  <input
                    type="number"
                    min="0"
                    value={item.qty === '' ? '' : item.qty}
                    onChange={(e) => handleQtyChange(item.product_id, e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => handleQtySave(item.product_id, Number(item.qty || 0))}
                    disabled={saving}
                  >
                    Zapisz
                  </button>
                  <button
                    type="button"
                    className="ghost"
                    onClick={() => handleDeleteItem(item.product_id)}
                    disabled={saving}
                  >
                    Usuń
                  </button>
                </div>
              )}
            </div>
          ))}
          {inventory.length === 0 && <div className="emptyState">Brak produktów w tym automacie.</div>}
          {user?.role === 'admin' && (
            <form className="inventoryItem addCard" onSubmit={handleAddItem}>
              <div className="itemTitle">Dodaj produkt</div>
              <div className="itemMeta">Wybierz produkt i ilość</div>
              {availableProducts.length === 0 ? (
                <div className="mutedNote">Wszystkie produkty są już w tym automacie.</div>
              ) : (
                <div className="adminControls">
                  <select
                    value={selectedProductId}
                    onChange={(e) => setNewItem((p) => ({ ...p, product_id: e.target.value }))}
                    required
                  >
                    {availableProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({(p.price / 100).toFixed(2)} zł)
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={newItem.qty}
                    onChange={(e) => setNewItem((p) => ({ ...p, qty: e.target.value }))}
                    required
                  />
                  <button type="submit" disabled={saving}>Dodaj</button>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
