import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import HomePage from './pages/HomePage.jsx'
import Navbar from './components/Navbar.jsx'
import SignInPage from './pages/SignInPage.jsx'
import SignUpPage from './pages/SignUpPage.jsx'
import MachinePage from './pages/MachinePage.jsx'
import ProductsPage from './pages/ProductsPage.jsx'
import IssuesPage from './pages/IssuesPage.jsx'
import PurchaseHistoryPage from './pages/PurchaseHistoryPage.jsx'
import AdminLivePage from './pages/AdminLivePage.jsx'

export default function App() {
  const [search, setSearch] = useState('')

  return (
    <>
      <Navbar search={search} onSearchChange={setSearch} />
      <Routes>
        <Route path="/" element={<Navigate to="/HomePage" />} />
        <Route path="/HomePage" element={<HomePage search={search} />} />
        <Route path="/machines/:id" element={<MachinePage />} />
        <Route path="/produkty" element={<ProductsPage />} />
        <Route path="/usterki" element={<IssuesPage />} />
        <Route path="/historia-zakupow" element={<PurchaseHistoryPage />} />
        <Route path="/admin-live" element={<AdminLivePage />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/signup" element={<SignUpPage />} />
      </Routes>
    </>
  )
}
