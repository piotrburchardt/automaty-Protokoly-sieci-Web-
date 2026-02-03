import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import './Auth.css'

export default function SignUpPage() {
  const navigate = useNavigate()
  const { refresh } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)

  function onSubmit(e) {
    e.preventDefault()
    setError(null)

    fetch('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password }),
    })

      .then((res) => {
        if (res.status === 201) {
          return refresh().then(() => navigate('/signin'))
        }
        if (res.status === 409) {
          throw new Error('Nazwa juz zajęta')
        }
        throw new Error('Rejestracja nieudana')
      })
      .catch((err) => setError(err.message))
  }

  return (
    <div className="authPage">
      <h2>Zarejestruj się</h2>
      <form className="authForm" onSubmit={onSubmit}>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="username"
          autoComplete="username"
          required
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="password"
          autoComplete="new-password"
          type="password"
          required
        />
        <button type="submit">Załóż konto</button>
      </form>
      {error ? <div className="authError">{error}</div> : null}
    </div>
  )
}
