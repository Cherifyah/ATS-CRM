import React, { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Phone, Calendar, TrendingUp, Trophy, Users, Briefcase, Building, Target, Check, Clock } from 'lucide-react'

const supabase = createClient(
  'https://nlvffxqewztfpuvzqeih.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5sdmZmeHFld3p0ZnB1dnpxZWloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5NDY5NTgsImV4cCI6MjA5NjUyMjk1OH0.6tED9Mw82dh5FKaEzeagSJSWxdBg1CsZJQou4TTTE8Q'
)

export default function Dashboard({ onNavigate }) {
  const [stats, setStats] = useState({
    totalCandidats: 0, enEntretien: 0, presentesClient: 0, places: 0, redFlags: 0,
    prospectsMonth: 0, rdvMonth: 0, clientsActifs: 0, missionsOuvertes: 0,
    adchases: 0, placementActif: 0, totalPushCV: 0, controles: 0,
    entretiensWeek: 0, timeToFill: null
  })

  useEffect(() => { loadStats() }, [])

  async function loadStats() {
    const now = new Date()
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const monday = new Date(now)
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
    monday.setHours(0,0,0,0)
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)

    const [cands, archives, prosp, clients, pushcv] = await Promise.all([
      supabase.from('candidats').select('statut, derniere_action, created_at'),
      supabase.from('archives').select('type_archivage, date_archivage, created_at'),
      supabase.from('prospection').select('resultat, date_contact'),
      supabase.from('clients').select('statut, missions_ouvertes'),
      supabase.from('push_cv').select('adchases, placement_actif, controles_reference, semaine').order('semaine', { ascending: false }).limit(1)
    ])

    const c = cands.data || []
    const a = archives.data || []
    const p = prosp.data || []
    const cl = clients.data || []
    const pv = pushcv.data || []

    const entretiensWeek = c.filter(x => {
      if (!x.derniere_action) return false
      const d = new Date(x.derniere_action)
      return d >= monday && d <= sunday
    }).length

    const placesArr = a.filter(x => x.type_archivage === 'Place')
    const timesToFill = placesArr
      .filter(x => x.date_archivage && x.created_at)
      .map(x => Math.round((new Date(x.date_archivage) - new Date(x.created_at)) / (1000 * 60 * 60 * 24)))
      .filter(d => d > 0)
    const timeToFill = timesToFill.length > 0
      ? Math.round(timesToFill.reduce((s, d) => s + d, 0) / timesToFill.length)
      : null

    setStats({
      totalCandidats: c.length,
      enEntretien: c.filter(x => x.statut === 'En entretien').length,
      presentesClient: c.filter(x => x.statut === 'Presente client').length,
      places: a.filter(x => x.type_archivage === 'Place').length,
      redFlags: c.filter(x => x.statut === 'Red flag').length,
      prospectsMonth: p.filter(x => x.date_contact >= firstOfMonth).length,
      rdvMonth: p.filter(x => x.resultat === 'RDV obtenu' && x.date_contact >= firstOfMonth).length,
      clientsActifs: cl.filter(x => x.statut === 'Actif').length,
      missionsOuvertes: cl.reduce((s, x) => s + (x.statut === 'Actif' ? (x.missions_ouvertes || 0) : 0), 0),
      adchases: pv[0]?.adchases || 0,
      placementActif: pv[0]?.placement_actif || 0,
      totalPushCV: (pv[0]?.adchases || 0) + (pv[0]?.placement_actif || 0),
      controles: pv[0]?.controles_reference || 0,
      entretiensWeek,
      timeToFill
    })
  }

  const objectif = 8
  const pctEntretiens = Math.round((stats.entretiensWeek / objectif) * 100)
  const pctPush = Math.round((stats.totalPushCV / 150) * 100)

  // Haut (Candidats) : violet, bleu, orange, vert — pas de doublon autorise en bas
  const kpiCandidats = [
    { label: 'Total candidats', value: stats.totalCandidats, cls: 'kpi-purple', icon: <Users size={24} /> },
    { label: 'En entretien', value: stats.enEntretien, cls: 'kpi-blue', icon: <Calendar size={24} /> },
    { label: 'Presentes client', value: stats.presentesClient, cls: 'kpi-orange', icon: <Briefcase size={24} /> },
    { label: 'Places (total)', value: stats.places, cls: 'kpi-green', icon: <Trophy size={24} /> },
  ]

  // Bas (Prospection) : rose, cyan, gris ardoise, rouge — aucun doublon
  const kpiProsp = [
    { label: 'Prospects ce mois', value: stats.prospectsMonth, cls: 'kpi-pink', icon: <Phone size={24} />, badge: 'Objectif : 60' },
    { label: 'RDV obtenus ce mois', value: stats.rdvMonth, cls: 'kpi-cyan', icon: <Calendar size={24} />, badge: `Taux : ${stats.prospectsMonth > 0 ? Math.round(stats.rdvMonth / Math.max(stats.prospectsMonth,1) * 100) : 0}%` },
    { label: 'Clients actifs', value: stats.clientsActifs, cls: 'kpi-slate', icon: <Building size={24} /> },
    { label: 'Missions ouvertes', value: stats.missionsOuvertes, cls: 'kpi-red', icon: <Target size={24} /> },
  ]

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Dashboard</div>
        <div className="page-sub">Semaine {getWeekNumber(new Date())} — {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</div>
      </div>

      <div className="section-title">Candidats — Pipeline</div>
      <div className="kpi-grid">
        {kpiCandidats.map(k => (
          <div className={`kpi-card ${k.cls}`} key={k.label}>
            <div className="kpi-icon">{k.icon}</div>
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-value">{k.value}</div>
            {k.badge && <div className="kpi-badge">{k.badge}</div>}
          </div>
        ))}
      </div>

      <div className="tracker">
        <div className="tracker-header">
          <span className="card-title">Entretiens candidats — objectif semaine</span>
          <span className="tracker-pct">{stats.entretiensWeek} / {objectif} — {pctEntretiens}%</span>
        </div>
        <div className="dots-row">
          {Array.from({ length: objectif }, (_, i) => (
            <div key={i} className={`dot ${i < stats.entretiensWeek ? 'dot-done' : i === stats.entretiensWeek ? 'dot-active' : 'dot-empty'}`}>
              {i < stats.entretiensWeek ? <Check size={13} /> : i + 1}
            </div>
          ))}
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${Math.min(100, pctEntretiens)}%` }} />
        </div>
      </div>

      <div className="section-title">Prospection commerciale</div>
      <div className="kpi-grid">
        {kpiProsp.map(k => (
          <div className={`kpi-card ${k.cls}`} key={k.label}>
            <div className="kpi-icon">{k.icon}</div>
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-value">{k.value}</div>
            {k.badge && <div className="kpi-badge">{k.badge}</div>}
          </div>
        ))}
      </div>

      <div className="section-title">Push CV — semaine en cours</div>
      <div className="push-cv-grid">
        <div className="push-cv-card" style={{ background: '#fff0f6', border: '1px solid #ffb3d1' }}>
          <div className="push-cv-label" style={{ color: '#9d174d' }}>Adchases</div>
          <div className="push-cv-value" style={{ color: '#db2777' }}>{stats.adchases}</div>
          <div style={{ fontSize: 11, color: '#9d174d' }}>cette semaine</div>
        </div>
        <div className="push-cv-card" style={{ background: '#f0fdf4', border: '1px solid #86efac' }}>
          <div className="push-cv-label" style={{ color: '#166534' }}>Placement actif</div>
          <div className="push-cv-value" style={{ color: '#16a34a' }}>{stats.placementActif}</div>
          <div style={{ fontSize: 11, color: '#166534' }}>cette semaine</div>
        </div>
        <div className="push-cv-card" style={{ background: '#fff7ed', border: '1px solid #fdba74' }}>
          <div className="push-cv-label" style={{ color: '#9a3412' }}>Total push CV</div>
          <div className="push-cv-value" style={{ color: '#ea580c' }}>{stats.totalPushCV}</div>
          <div style={{ fontSize: 11, color: '#9a3412' }}>{pctPush}% de l'objectif 150</div>
          <div className="progress-bar" style={{ marginTop: 8 }}>
            <div className="progress-fill" style={{ width: `${Math.min(100, pctPush)}%`, background: '#ea580c' }} />
          </div>
        </div>
        <div className="push-cv-card" style={{ background: '#f0f9ff', border: '1px solid #7dd3fc' }}>
          <div className="push-cv-label" style={{ color: '#0c4a6e' }}>Controles de reference</div>
          <div className="push-cv-value" style={{ color: '#0284c7' }}>{stats.controles}</div>
          <div style={{ fontSize: 11, color: '#0c4a6e' }}>ce mois</div>
        </div>
      </div>

      <div className="section-title">Performance — Time-to-Fill</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <div className="kpi-card" style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', minHeight: 120 }}>
          <div className="kpi-icon"><Clock size={24} /></div>
          <div className="kpi-label">Time-to-Fill moyen</div>
          <div className="kpi-value">{stats.timeToFill !== null ? `${stats.timeToFill}j` : '—'}</div>
          <div className="kpi-badge">{stats.timeToFill !== null ? (stats.timeToFill <= 35 ? 'Dans l objectif' : 'Au-dessus de 35j') : 'Pas encore de placement'}</div>
        </div>
        <div className="kpi-card" style={{ background: 'linear-gradient(135deg, #0891b2, #0284c7)', minHeight: 120 }}>
          <div className="kpi-icon"><TrendingUp size={24} /></div>
          <div className="kpi-label">Objectif Time-to-Fill</div>
          <div className="kpi-value">35j</div>
          <div className="kpi-badge">Benchmark marche mid-market</div>
        </div>
        <div className="kpi-card" style={{ background: 'linear-gradient(135deg, #059669, #10b981)', minHeight: 120 }}>
          <div className="kpi-icon"><Trophy size={24} /></div>
          <div className="kpi-label">Placements reussis</div>
          <div className="kpi-value">{stats.places}</div>
          <div className="kpi-badge">Total depuis le debut</div>
        </div>
      </div>
    </div>
  )
}

function getWeekNumber(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const dayNum = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  return Math.ceil((((date - yearStart) / 86400000) + 1) / 7)
}
