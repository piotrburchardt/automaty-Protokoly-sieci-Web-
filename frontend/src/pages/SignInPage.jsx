import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import './Auth.css'

export default function SignInPage() {
  const navigate = useNavigate()
  const { refresh } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)

  function onSubmit(e) {
    e.preventDefault()
    setError(null)

    fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password }),
    })
      .then((res) => {
        if (res.status === 200) {
          return refresh().then(() => navigate('/HomePage'))
        }

        if (res.status === 401) {
          throw new Error('Niepoprawny login lub hasło')
        }

        throw new Error('Błąd logowania')
      })
      .catch((err) => setError(err.message))
  }

  return (
    <div className="authPage">
      <h2>Zaloguj się</h2>
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
          autoComplete="current-password"
          type="password"
          required
        />
        <button type="submit">Zaloguj</button>
      </form>
      {error ? <div className="authError">{error}</div> : null}
    </div>
  )
}
