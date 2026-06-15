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

  function handleSidebarNav(newPage) {
    setFilter(null)
    setPage(newPage)
  }

  const renderPage = () => {
    switch(page) {
      case 'dashboard':
        return <Dashboard key="dashboard" onNavigate={handleNavigate} />
      case 'candidats':
        return <Candidats key={`candidats-${filter}`} filter={filter} />
      case 'prequal':
        return <FichePrequal key="prequal" />
      case 'clients':
        return <CRMClients key={`clients-${filter}`} filter={filter} />
      case 'prospection':
        return <Prospection key={`prospection-${filter}`} filter={filter} />
      case 'archives':
        return <Archives key="archives" />
      default:
        return <Dashboard key="dashboard" onNavigate={handleNavigate} />
    }
  }

  return (
    <div className="app-layout">
      <Sidebar current={page} onNavigate={handleSidebarNav} />
      <main className="main-content">
        {renderPage()}
      </main>
    </div>
  )
}
