import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Archives() {
  const [archives, setArchives] = useState([])
  const [filter, setFilter] = useState('all')

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('archives').select('*').order('created_at', { ascending: false })
    setArchives(data || [])
  }

  const filtered = filter === 'all' ? archives : archives.filter(a => a.type_archivage === filter)
  const places = archives.filter(a => a.type_archivage === 'Placé').length
  const flags = archives.filter(a => a.type_archivage === 'Red flag').length

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Archivés & Red flags</div>
        <div className="page-sub">{places} placés · {flags} red flags</div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[
          { key: 'all', label: 'Tous', cls: '' },
          { key: 'Placé', label: `Placés (${places})`, cls: 'badge-green' },
          { key: 'Red flag', label: `Red flags (${flags})`, cls: 'badge-red' },
          { key: 'Archivé', label: 'Archivés', cls: 'badge-gray' },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: 'none',
              background: filter === f.key ? '#6d5ce7' : '#f3f4f6', color: filter === f.key ? '#fff' : '#374151' }}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: 0 }}>
        <table className="data-table">
          <thead>
            <tr><th>Candidat</th><th>Métier</th><th>Dernier poste</th><th>Type</th><th>Placé chez</th><th>Date</th><th>Motif</th></tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: 'center', color: '#9ca3af', padding: 24 }}>Aucune entrée</td></tr>
            )}
            {filtered.map(a => (
              <tr key={a.id}>
                <td style={{ fontWeight: 600 }}>{a.nom}</td>
                <td><span className="tag tag-purple">{a.metier}</span></td>
                <td style={{ fontSize: 12 }}>{a.dernier_poste}</td>
                <td>
                  <span className={`badge ${a.type_archivage === 'Placé' ? 'badge-green' : a.type_archivage === 'Red flag' ? 'badge-red' : 'badge-gray'}`}>
                    {a.type_archivage === 'Red flag' ? '🚩 ' : ''}{a.type_archivage}
                  </span>
                </td>
                <td style={{ fontSize: 12 }}>{a.place_chez || '—'}</td>
                <td style={{ fontSize: 12, color: '#6b7280' }}>{a.date_archivage ? new Date(a.date_archivage).toLocaleDateString('fr-FR') : '—'}</td>
                <td style={{ fontSize: 12, color: '#6b7280', maxWidth: 200 }}>{a.motif}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
