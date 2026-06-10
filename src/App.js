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

  const pages = {
    dashboard: <Dashboard onNavigate={setPage} />,
    candidats: <Candidats />,
    prequal: <FichePrequal />,
    clients: <CRMClients />,
    prospection: <Prospection />,
    archives: <Archives />,
  }

  return (
    <div className="app-layout">
      <Sidebar current={page} onNavigate={setPage} />
      <main className="main-content">
        {pages[page] || <Dashboard onNavigate={setPage} />}
      </main>
    </div>
  )
}
