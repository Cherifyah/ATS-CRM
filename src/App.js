import React, { useState } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Candidats from './pages/Candidats'
import FichePrequal from './pages/FichePrequal'
import CRMClients from './pages/CRMClients'
import Prospection from './pages/Prospection'
import Archives from './pages/Archives'
import './App.css'

export default function App() {
  const [page, setPage] = useState('dashboard')
  const [filter, setFilter] = useState(null)

  function handleNavigate(newPage, newFilter) {
    setFilter(newFilter || null)
    setPage(newPage)
  }

  const pages = {
    dashboard: <Dashboard onNavigate={handleNavigate} />,
    candidats: <Candidats filter={filter} />,
    prequal: <FichePrequal />,
    clients: <CRMClients filter={filter} />,
    prospection: <Prospection filter={filter} />,
    archives: <Archives />,
  }

  return (
    <div className="app-layout">
      <Sidebar current={page} onNavigate={(p) => handleNavigate(p, null)} />
      <main className="main-content">
        {pages[page] || <Dashboard onNavigate={handleNavigate} />}
      </main>
    </div>
  )
}
