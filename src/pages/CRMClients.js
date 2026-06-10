import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, X } from 'lucide-react'

const TYPES = ['Audit', 'Expertise comptable', 'Conseil', 'Juridique', 'Mixte']
const STATUTS = ['Actif', 'En négociation', 'Fidélisé', 'Inactif']
const BADGE = { 'Actif': 'badge-green', 'Fidélisé': 'badge-blue', 'En négociation': 'badge-orange', 'Inactif': 'badge-gray' }

export default function CRMClients() {
  const [clients, setClients] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm())
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('clients').select('*').order('created_at', { ascending: false })
    setClients(data || [])
  }

  function emptyForm() {
    return { nom_cabinet: '', type: 'Audit', taille: '', ville: '', contact: '', fonction: '', email: '', telephone: '', statut: 'Actif', missions_ouvertes: 0, missions_closes: 0, notes: '' }
  }

  async function save() {
    if (!form.nom_cabinet) return
    setSaving(true)
    await supabase.from('clients').insert([{ ...form, premier_contact: new Date().toISOString().split('T')[0], derniere_interaction: new Date().toISOString().split('T')[0] }])
    setSaving(false)
    setShowModal(false); setForm(emptyForm()); load()
  }

  const actifs = clients.filter(c => c.statut === 'Actif').length
  const missions = clients.reduce((s, c) => s + (c.missions_ouvertes || 0), 0)
  const totalProspects = clients.length

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="page-title">CRM Clients</div>
          <div className="page-sub">{clients.length} cabinets dans la base</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={15} /> Nouveau client
        </button>
      </div>

      <div className="kpi-grid" style={{ marginBottom: 20 }}>
        <div className="kpi-card kpi-blue"><div className="kpi-label">Clients actifs</div><div className="kpi-value">{actifs}</div><div className="kpi-badge">+2 ce trimestre</div></div>
        <div className="kpi-card kpi-cyan"><div className="kpi-label">Missions en cours</div><div className="kpi-value">{missions}</div></div>
        <div className="kpi-card kpi-slate"><div className="kpi-label">Délai moyen placement</div><div className="kpi-value">—</div><div className="kpi-badge">À calculer</div></div>
        <div className="kpi-card kpi-pink"><div className="kpi-label">Fill rate</div><div className="kpi-value">—</div><div className="kpi-badge">Objectif : 80%</div></div>
      </div>

      <div className="section-title">Entonnoir commercial — trimestre</div>
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 10 }}>Conversion à chaque étape de la prospection</div>
        {[
          { label: 'Prospects contactés', n: totalProspects, pct: 100, color: '#6d5ce7' },
          { label: 'RDV obtenus', n: Math.round(totalProspects * 0.25), pct: 25, color: '#2e86de' },
          { label: 'Mandats signés', n: Math.round(totalProspects * 0.15), pct: 15, color: '#0abde3' },
          { label: 'Placements réalisés', n: Math.round(totalProspects * 0.08), pct: 8, color: '#1fbc7a' },
        ].map(row => (
          <div className="funnel-row" key={row.label}>
            <div className="funnel-label">{row.label}</div>
            <div className="funnel-bar-bg">
              <div className="funnel-bar" style={{ width: `${row.pct}%`, background: row.color }}>
                <span>{row.n}</span>
              </div>
            </div>
            <div className="funnel-pct">{row.pct}%</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 0 }}>
        <table className="data-table">
          <thead>
            <tr><th>Cabinet</th><th>Type</th><th>Contact</th><th>Statut</th><th>Missions ouvertes</th><th>Dernière interaction</th><th>Notes</th></tr>
          </thead>
          <tbody>
            {clients.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: 'center', color: '#9ca3af', padding: 24 }}>Aucun client — cliquez sur "+ Nouveau client"</td></tr>
            )}
            {clients.map(c => (
              <tr key={c.id}>
                <td>
                  <div style={{ fontWeight: 600 }}>{c.nom_cabinet}</div>
                  <div style={{ fontSize: 11, color: '#6b7280' }}>{c.type} · {c.taille ? `${c.taille} pers.` : ''} · {c.ville}</div>
                </td>
                <td><span className="tag tag-gray">{c.type}</span></td>
                <td>
                  <div style={{ fontSize: 12 }}>{c.contact}</div>
                  <div style={{ fontSize: 11, color: '#6b7280' }}>{c.fonction}</div>
                </td>
                <td><span className={`badge ${BADGE[c.statut] || 'badge-gray'}`}>{c.statut}</span></td>
                <td style={{ fontSize: 13, fontWeight: 600 }}>{c.missions_ouvertes || 0}</td>
                <td style={{ fontSize: 11, color: '#6b7280' }}>{c.derniere_interaction ? new Date(c.derniere_interaction).toLocaleDateString('fr-FR') : '—'}</td>
                <td style={{ fontSize: 11, color: '#6b7280', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">Nouveau client</div>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Nom du cabinet *</label>
                <input className="form-input" value={form.nom_cabinet} onChange={e => setForm({...form, nom_cabinet: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Type</label>
                <select className="form-select" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                  {TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Taille (personnes)</label>
                <input className="form-input" type="number" value={form.taille} onChange={e => setForm({...form, taille: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Ville / Arrondissement</label>
                <input className="form-input" value={form.ville} onChange={e => setForm({...form, ville: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Contact principal</label>
                <input className="form-input" value={form.contact} onChange={e => setForm({...form, contact: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Fonction</label>
                <input className="form-input" value={form.fonction} onChange={e => setForm({...form, fonction: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Téléphone</label>
                <input className="form-input" value={form.telephone} onChange={e => setForm({...form, telephone: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Statut</label>
                <select className="form-select" value={form.statut} onChange={e => setForm({...form, statut: e.target.value})}>
                  {STATUTS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Missions ouvertes</label>
                <input className="form-input" type="number" value={form.missions_ouvertes} onChange={e => setForm({...form, missions_ouvertes: parseInt(e.target.value) || 0})} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea className="form-textarea" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Annuler</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
