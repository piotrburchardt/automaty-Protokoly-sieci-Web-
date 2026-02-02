import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import './HomePage.css'
import vendingMachineSvg from '../assets/vending-machine.svg'

export default function HomePage({ search = '' }) {
  const { user } = useAuth()
  const [machines, setMachines] = useState([])
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [newMachine, setNewMachine] = useState({
    city: '',
    location: '',
    status: 'aktywny',
  })

  const loadMachines = (signal) => {
    const query = search ? `?search=${encodeURIComponent(search)}` : ''
    return fetch(`/machines${query}`, signal ? { signal } : undefined)
      .then((res) => res.json())
      .then(setMachines)
      .catch((err) => {
        if (err.name !== 'AbortError') setError(String(err))
      })
  }

  useEffect(() => {
    const controller = new AbortController()
    loadMachines(controller.signal)
    return () => controller.abort()
  }, [search])

  const saveNewMachine = () => {
    setSaving(true)
    setError(null)
    fetch('/machines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newMachine),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Nie udało się dodać automatu')
        setNewMachine({ city: '', location: '', status: 'aktywny' })
        return loadMachines()
      })
      .catch((err) => setError(err.message || String(err)))
      .finally(() => setSaving(false))
  }

  const handleAddMachine = (e) => {
    e.preventDefault()
    if (saving) return
    if (!newMachine.city.trim() || !newMachine.location.trim()) return
    saveNewMachine()
  }

  const handleAddMachineBySpace = (e) => {
    if (e.code !== 'Space' && e.key !== ' ') return
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return
    e.preventDefault()
    if (saving) return
    saveNewMachine()
  }

  if (error) return <pre>{error}</pre>
  return (
    <ul className="machinesGrid">
      {machines.map((m) => (
        <li key={m.id}>
          <Link className="machineCard" to={`/machines/${m.id}`}>
            <img className="machineImg" src={vendingMachineSvg} alt="" />
            <div className="machineMeta">
              <div className="machineTitle">
                {m.city} - {m.location}
              </div>
              <div className="machineStatusRow">
                <span className={`statusDot ${m.status === 'aktywny' ? 'isActive' : ''}`} />
                <span className="machineStatusText">{m.status}</span>
              </div>
            </div>
          </Link>
        </li>
      ))}
      {user?.role === 'admin' && (
        <li>
          <div
            className="machineCard addCard"
            tabIndex={0}
            onKeyDown={handleAddMachineBySpace}
          >
            <div className="machineMeta">
              <form
                className="addMachineForm"
                onSubmit={handleAddMachine}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddMachine(e)
                }}
              >
                <div className="addLabel">Dodaj nowy automat</div>
                <input
                  placeholder="Miasto"
                  value={newMachine.city}
                  onChange={(e) => setNewMachine((m) => ({ ...m, city: e.target.value }))}
                  required
                />
                <input
                  placeholder="Lokalizacja"
                  value={newMachine.location}
                  onChange={(e) => setNewMachine((m) => ({ ...m, location: e.target.value }))}
                  required
                />
              </form>
            </div>
          </div>
        </li>
      )}
    </ul>
  )
}
