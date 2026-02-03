import './navbar.css'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Navbar({ search, onSearchChange }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, loading, refresh } = useAuth()

  const isHomePage = location.pathname === '/HomePage'

  const handleLogout = () =>
    fetch('/auth/logout', { method: 'POST', credentials: 'include' }).then(() => refresh())

  return (
    <div className="navbar">
      <div className="navbarTitle">
        <button type="button" className="homeButton" onClick={() => navigate('/HomePage')}>
          Symulator automawów
        </button>
        {user && user.role !== 'admin' && (
          <div className="navbarAdminLinks">
            <span className="divider">|</span>
            <button
              type="button"
              className="homeButton"
              onClick={() => navigate('/historia-zakupow')}
            >
              Historia zakupów
            </button>
          </div>
        )}
        {user?.role === 'admin' && (
          <div className="navbarAdminLinks">
            <span className="divider">|</span>
            <button type="button" className="homeButton" onClick={() => navigate('/produkty')}>
              Lista produktów
            </button>
            <span className="divider">|</span>
            <button type="button" className="homeButton" onClick={() => navigate('/usterki')}>
              Lista usterek
            </button>
            <span className="divider">|</span>
            <button type="button" className="homeButton" onClick={() => navigate('/admin-live')}>
              Podgląd live
            </button>
            <span className="divider">|</span>
            <button type="button" className="homeButton" onClick={() => navigate('/historia-zakupow')}>
              Historia zakupów
            </button>
          </div>
        )}
      </div>
      <div className="navbarCenter">
        {isHomePage && (
          <label className="navbarSearch" aria-label="Wyszukiwarka automatów">
            <span className="searchIcon" aria-hidden="true">🔍</span>
            <input
              type="search"
              className="searchInput"
              placeholder="Szukaj miasta lub lokalizacji"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </label>
        )}
      </div>
      {!loading && (
        <div className="navbarActions">
          {user ? (
            <>
              {user.role === 'admin' && <span className="navbarAdmin">Zalogowano jako admin</span>}
              <button type="button" className="navbarButton" onClick={handleLogout}>
                Wyloguj sie
              </button>
            </>
          ) : (
            <>
              <button type="button" className="navbarButton" onClick={() => navigate('/signin')}>
                Zaloguj sie
              </button>
              <button type="button" className="navbarButtonPrimary" onClick={() => navigate('/signup')}>
                Zarejestruj sie
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
