import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Flag, Archive, Trash2, X } from 'lucide-react'

const METIERS = ['Audit financier', 'Expertise comptable', 'Conseil', 'Juridique']
const STATUTS = ['Identifié', 'En entretien', 'Présenté client', 'En attente mission', 'Placé', 'Red flag', 'Archivé']
const SOURCES = ['LinkedIn', 'Candidature directe', 'Recommandation', 'Sourcing', 'Lemlist', 'Autre']
const ANGLAIS = ['Courant', 'Professionnel', 'Intermédiaire', 'Lu/écrit', 'Notions', 'Non']

const BADGE = {
  'Identifié': 'badge-gray', 'En entretien': 'badge-purple', 'Présenté client': 'badge-blue',
  'En attente mission': 'badge-orange', 'Placé': 'badge-green', 'Red flag': 'badge-red', 'Archivé': 'badge-gray'
}

export default function Candidats() {
  const [candidats, setCandidats] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm())
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('candidats').select('*').order('created_at', { ascending: false })
    setCandidats(data || [])
  }

  function emptyForm() {
    return { nom: '', metier: 'Audit financier', poste_vise: '', niveau: '', structure_actuelle: '', statut: 'Identifié', source: 'LinkedIn', anglais: 'Courant', autres_langues: '', rem_actuelle: '', rem_cible: '', disponibilite: '', notes: '' }
  }

  async function save() {
    if (!form.nom) return
    setSaving(true)
    const { error } = await supabase.from('candidats').insert([{ ...form, derniere_action: new Date().toISOString() }])
    setSaving(false)
    if (!error) { setMsg('Candidat ajouté !'); setShowModal(false); setForm(emptyForm()); load() }
    else setMsg('Erreur : ' + error.message)
  }

  async function flagCandidat(id) {
    await supabase.from('candidats').update({ statut: 'Red flag' }).eq('id', id)
    load()
  }

  async function archiveCandidat(id, nom, metier, poste) {
    await supabase.from('archives').insert([{ nom, metier, dernier_poste: poste, type_archivage: 'Archivé', date_archivage: new Date().toISOString().split('T')[0] }])
    await supabase.from('candidats').update({ statut: 'Archivé' }).eq('id', id)
    load()
  }

  async function deleteCandidat(id) {
    if (window.confirm('Supprimer ce candidat ?')) {
      await supabase.from('candidats').delete().eq('id', id)
      load()
    }
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="page-title">Candidats</div>
          <div className="page-sub">{candidats.length} candidats actifs</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={15} /> Nouveau candidat
        </button>
      </div>

      {msg && <div className="alert alert-success" onClick={() => setMsg(null)}>{msg}</div>}

      <div className="card" style={{ padding: 0 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Candidat</th><th>Métier</th><th>Statut</th><th>Anglais</th><th>Autre langue</th><th>Rém. actuelle</th><th>Disponibilité</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {candidats.length === 0 && (
              <tr><td colSpan={8} style={{ textAlign: 'center', color: '#9ca3af', padding: 24 }}>Aucun candidat — cliquez sur "+ Nouveau candidat"</td></tr>
            )}
            {candidats.map(c => (
              <tr key={c.id}>
                <td>
                  <div style={{ fontWeight: 600 }}>{c.nom}</div>
                  <div style={{ fontSize: 11, color: '#6b7280' }}>{c.poste_vise}</div>
                </td>
                <td><span className="tag tag-purple">{c.metier}</span></td>
                <td><span className={`badge ${BADGE[c.statut] || 'badge-gray'}`}>{c.statut}</span></td>
                <td style={{ fontSize: 12 }}>{c.anglais}</td>
                <td style={{ fontSize: 12, color: '#6b7280' }}>{c.autres_langues || '—'}</td>
                <td style={{ fontSize: 12 }}>{c.rem_actuelle ? `${c.rem_actuelle}k€` : '—'}</td>
                <td style={{ fontSize: 12 }}>{c.disponibilite || '—'}</td>
                <td>
                  <div className="action-icons">
                    <button className="action-icon danger" title="Red flag" onClick={() => flagCandidat(c.id)}><Flag size={14} /></button>
                    <button className="action-icon" title="Archiver" onClick={() => archiveCandidat(c.id, c.nom, c.metier, c.poste_vise)}><Archive size={14} /></button>
                    <button className="action-icon danger" title="Supprimer" onClick={() => deleteCandidat(c.id)}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">Nouveau candidat</div>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Prénom Nom *</label>
                <input className="form-input" value={form.nom} onChange={e => setForm({...form, nom: e.target.value})} placeholder="Ex: Marie D." />
              </div>
              <div className="form-group">
                <label className="form-label">Métier</label>
                <select className="form-select" value={form.metier} onChange={e => setForm({...form, metier: e.target.value})}>
                  {METIERS.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Poste visé</label>
                <input className="form-input" value={form.poste_vise} onChange={e => setForm({...form, poste_vise: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Niveau</label>
                <input className="form-input" value={form.niveau} onChange={e => setForm({...form, niveau: e.target.value})} placeholder="Senior, Manager..." />
              </div>
              <div className="form-group">
                <label className="form-label">Structure actuelle</label>
                <input className="form-input" value={form.structure_actuelle} onChange={e => setForm({...form, structure_actuelle: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Statut</label>
                <select className="form-select" value={form.statut} onChange={e => setForm({...form, statut: e.target.value})}>
                  {STATUTS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Source</label>
                <select className="form-select" value={form.source} onChange={e => setForm({...form, source: e.target.value})}>
                  {SOURCES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Anglais</label>
                <select className="form-select" value={form.anglais} onChange={e => setForm({...form, anglais: e.target.value})}>
                  {ANGLAIS.map(a => <option key={a}>{a}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Autre(s) langue(s)</label>
                <input className="form-input" value={form.autres_langues} onChange={e => setForm({...form, autres_langues: e.target.value})} placeholder="Ex: Arabe, Espagnol B2..." />
              </div>
              <div className="form-group">
                <label className="form-label">Disponibilité</label>
                <input className="form-input" value={form.disponibilite} onChange={e => setForm({...form, disponibilite: e.target.value})} placeholder="Ex: 1 mois, Immédiat..." />
              </div>
              <div className="form-group">
                <label className="form-label">Rém. actuelle (k€)</label>
                <input className="form-input" type="number" value={form.rem_actuelle} onChange={e => setForm({...form, rem_actuelle: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Rém. cible (k€)</label>
                <input className="form-input" type="number" value={form.rem_cible} onChange={e => setForm({...form, rem_cible: e.target.value})} />
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
