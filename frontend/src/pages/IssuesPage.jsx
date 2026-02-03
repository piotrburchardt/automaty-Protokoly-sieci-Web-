import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import './IssuesPage.css'

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

  if (!user || user.role !== 'admin') return null

  if (loading) {
    return (
      <div className="issuesPage">
        <h1>Lista usterek</h1>
        <p>Ładowanie...</p>
      </div>
    )
  }

  return (
    <div className="issuesPage">
      <h1>Lista usterek</h1>
      {issues.length === 0 ? (
        <p>Brak zgłoszeń.</p>
      ) : (
        <ul className="issuesList">
          {issues.map((i) => (
            <li key={i.id} className="issueCard">
              <div className="issueTitle">
                #{i.id} - {i.title}
              </div>
              <div className="issueMeta">
                Automat: {i.machine_id}
              </div>
              <div className="issueText">{i.description}</div>
              <div className="issueTime">
                Zgłoszono: {i.created_at}
              </div>
              <button
                type="button"
                onClick={() => removeIssue(i.id)}
                disabled={removingId === i.id}
                className="issueBtn danger"
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
