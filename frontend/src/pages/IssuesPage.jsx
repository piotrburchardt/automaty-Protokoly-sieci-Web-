import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

export default function IssuesPage() {
  const { user } = useAuth()
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(true)
  const [removingId, setRemovingId] = useState(null)

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      setLoading(false)
      return
    }
    fetch('/issues', { credentials: 'include' })
      .then((res) => res.json().catch(() => []))
      .then((data) => setIssues(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false))
  }, [user])

  const removeIssue = (id) => {
    setRemovingId(id)
    fetch(`/issues/${id}`, { method: 'DELETE', credentials: 'include' }).then(() => {
      setIssues((list) => list.filter((i) => i.id !== id))
      setRemovingId(null)
    })
  }

  if (!user) {
    return (
      <div style={{ padding: '24px' }}>
        <h1>Lista usterek</h1>
        <p>Zaloguj się jako admin.</p>
      </div>
    )
  }

  if (user.role !== 'admin') {
    return (
      <div style={{ padding: '24px' }}>
        <h1>Lista usterek</h1>
        <p>Usterki wysyłają użytkownicy, a tutaj podgląd i usuwanie ma tylko admin.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ padding: '24px' }}>
        <h1>Lista usterek</h1>
        <p>Ładowanie...</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '24px' }}>
      <h1>Lista usterek</h1>
      {issues.length === 0 ? (
        <p>Brak zgłoszeń.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '12px' }}>
          {issues.map((i) => (
            <li
              key={i.id}
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: '10px',
                padding: '12px',
                background: '#fff',
                display: 'grid',
                gap: '6px',
              }}
            >
              <div style={{ fontWeight: 700 }}>
                #{i.id} - {i.title}
              </div>
              <div style={{ fontSize: '14px', color: '#4b5563' }}>
                Automat: {i.machine_id} | Status: {i.status}
              </div>
              <div style={{ fontSize: '14px', color: '#4b5563' }}>{i.description}</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                Utworzono: {i.created_at} {i.closed_at ? `| Zamknięto: ${i.closed_at}` : ''}
              </div>
              <button
                type="button"
                onClick={() => removeIssue(i.id)}
                disabled={removingId === i.id}
                style={{
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: '1px solid #ef4444',
                  background: removingId === i.id ? '#fee2e2' : '#fecdd3',
                  color: '#991b1b',
                  cursor: 'pointer',
                  width: '120px',
                }}
              >
                {removingId === i.id ? 'Usuwanie...' : 'Usuń'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
