import React, { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Plus, X } from 'lucide-react'

const supabase = createClient(
  'https://nlvffxqewztfpuvzqeih.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5sdmZmeHFld3p0ZnB1dnpxZWloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5NDY5NTgsImV4cCI6MjA5NjUyMjk1OH0.6tED9Mw82dh5FKaEzeagSJSWxdBg1CsZJQou4TTTE8Q'
)

const CANAUX = ['Appel', 'Lemlist', 'Mail direct', 'LinkedIn', 'Autre']
const RESULTATS = ['RDV obtenu', 'Rappel prevu', 'Pas de reponse', 'Pas interesse', 'En negociation']
const BADGE = { 'RDV obtenu': 'badge-green', 'En negociation': 'badge-blue', 'Rappel prevu': 'badge-orange', 'Pas de reponse': 'badge-gray', 'Pas interesse': 'badge-red' }

export default function Prospection() {
  const [logs, setLogs] = useState([])
  const [pushcv, setPushcv] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [showPushModal, setShowPushModal] = useState(false)
  const [form, setForm] = useState(emptyForm())
  const [pushForm, setPushForm] = useState({ semaine: getWeek(), lundi: getMonday(), adchases: 0, placement_actif: 0, objectif_hebdo: 150, controles_reference: 0, notes: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    const { data, error } = await supabase
      .from('prospection')
      .select('*')
      .order('date_contact', { ascending: false })
    if (error) console.error('load error:', error)
    setLogs(data || [])

    const { data: pdata } = await supabase
      .from('push_cv')
      .select('*')
      .order('semaine', { ascending: false })
    setPushcv(pdata || [])
  }

  function emptyForm() {
    return {
      date_contact: new Date().toISOString().split('T')[0],
      nom_cabinet: '',
      interlocuteur: '',
      fonction: '',
      canal: 'Appel',
      resultat: 'RDV obtenu',
      relance_prevue: '',
      notes: ''
    }
  }

  async function save() {
    if (!form.nom_cabinet) {
      setError('Le nom du cabinet est obligatoire')
      return
    }
    setSaving(true)
    setError(null)

    const payload = {
      date_contact: form.date_contact || null,
      nom_cabinet: form.nom_cabinet,
      interlocuteur: form.interlocuteur || null,
      fonction: form.fonction || null,
      canal: form.canal || null,
      resultat: form.resultat || null,
      relance_prevue: form.relance_prevue || null,
      notes: form.notes || null
    }

    console.log('Inserting:', payload)

    const { data, error } = await supabase
      .from('prospection')
      .insert(payload)
      .select()

    console.log('Result:', data, error)

    setSaving(false)

    if (error) {
      setError('Erreur: ' + error.message)
      console.error('Insert error:', error)
    } else {
      setShowModal(false)
      setForm(emptyForm())
      load()
    }
  }

  async function savePush() {
    setSaving(true)
    const { error } = await supabase.from('push_cv').insert({
      semaine: pushForm.semaine,
      lundi: pushForm.lundi || null,
      adchases: pushForm.adchases || 0,
      placement_actif: pushForm.placement_actif || 0,
      objectif_hebdo: 150,
      controles_reference: pushForm.controles_reference || 0,
      notes: pushForm.notes || null
    })
    setSaving(false)
    if (!error) { setShowPushModal(false); load() }
    else console.error('Push CV error:', error)
  }

  const thisMonth = new Date().toISOString().slice(0, 7)
  const prospectsMonth = logs.filter(l => l.date_contact && l.date_contact.startsWith(thisMonth)).length
  const rdvMonth = logs.filter(l => l.date_contact && l.date_contact.startsWith(thisMonth) && l.resultat === 'RDV obtenu').length
  const latestPush = pushcv[0]

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="page-title">Prospection</div>
          <div className="page-sub">Log des contacts et suivi Push CV</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={() => setShowPushModal(true)}>+ Saisir Push CV semaine</button>
          <button className="btn btn-primary" onClick={() => { setError(null); setShowModal(true) }}>
            <Plus size={15} /> Logger un contact
          </button>
        </div>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 20 }}>
        <div className="kpi-card kpi-purple">
          <div className="kpi-label">Prospects ce mois</div>
          <div className="kpi-value">{prospectsMonth}</div>
          <div className="kpi-badge">Objectif : 60</div>
        </div>
        <div className="kpi-card kpi-green">
          <div className="kpi-label">RDV obtenus ce mois</div>
          <div className="kpi-value">{rdvMonth}</div>
          <div className="kpi-badge">Taux : {prospectsMonth > 0 ? Math.round(rdvMonth/prospectsMonth*100) : 0}%</div>
        </div>
        <div className="kpi-card kpi-orange">
          <div className="kpi-label">Push CV — semaine {latestPush?.semaine || '—'}</div>
          <div className="kpi-value">{latestPush ? (latestPush.adchases + latestPush.placement_actif) : 0}</div>
          <div className="kpi-badge">/ 150 objectif</div>
        </div>
      </div>

      {latestPush && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-title" style={{ marginBottom: 12 }}>Push CV — semaine {latestPush.semaine}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
            <div className="push-cv-card"><div className="push-cv-label">Adchases</div><div className="push-cv-value" style={{ color: '#2e86de' }}>{latestPush.adchases}</div></div>
            <div className="push-cv-card"><div className="push-cv-label">Placement actif</div><div className="push-cv-value" style={{ color: '#1fbc7a' }}>{latestPush.placement_actif}</div></div>
            <div className="push-cv-card" style={{ background: '#ede9fd' }}>
              <div className="push-cv-label">Total</div>
              <div className="push-cv-value" style={{ color: '#6d5ce7' }}>{latestPush.adchases + latestPush.placement_actif}</div>
              <div style={{ fontSize: 10, color: '#4c3bb8' }}>{Math.round((latestPush.adchases + latestPush.placement_actif)/150*100)}% de 150</div>
            </div>
            <div className="push-cv-card" style={{ background: '#fef3c7' }}>
              <div className="push-cv-label">Controles de ref.</div>
              <div className="push-cv-value" style={{ color: '#f5a623' }}>{latestPush.controles_reference}</div>
            </div>
          </div>
        </div>
      )}

      <div className="section-title">Log de prospection</div>
      <div className="card" style={{ padding: 0 }}>
        <table className="data-table">
          <thead>
            <tr><th>Date</th><th>Cabinet</th><th>Interlocuteur</th><th>Canal</th><th>Resultat</th><th>Relance</th><th>Notes</th></tr>
          </thead>
          <tbody>
            {logs.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: 'center', color: '#9ca3af', padding: 24 }}>Aucun contact logue</td></tr>
            )}
            {logs.map(l => (
              <tr key={l.id}>
                <td style={{ fontSize: 12 }}>{l.date_contact ? new Date(l.date_contact + 'T12:00:00').toLocaleDateString('fr-FR') : '—'}</td>
                <td style={{ fontWeight: 600, fontSize: 13 }}>{l.nom_cabinet}</td>
                <td><div style={{ fontSize: 12 }}>{l.interlocuteur}</div><div style={{ fontSize: 11, color: '#6b7280' }}>{l.fonction}</div></td>
                <td><span className="tag tag-gray">{l.canal}</span></td>
                <td><span className={`badge ${BADGE[l.resultat] || 'badge-gray'}`}>{l.resultat}</span></td>
                <td style={{ fontSize: 11, color: '#6b7280' }}>{l.relance_prevue ? new Date(l.relance_prevue + 'T12:00:00').toLocaleDateString('fr-FR') : '—'}</td>
                <td style={{ fontSize: 11, color: '#6b7280' }}>{l.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">Logger un contact</div>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Date</label>
                <input className="form-input" type="date" value={form.date_contact} onChange={e => setForm({...form, date_contact: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Nom cabinet *</label>
                <input className="form-input" value={form.nom_cabinet} onChange={e => setForm({...form, nom_cabinet: e.target.value})} placeholder="Ex: Mazars Paris 8" />
              </div>
              <div className="form-group">
                <label className="form-label">Interlocuteur</label>
                <input className="form-input" value={form.interlocuteur} onChange={e => setForm({...form, interlocuteur: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Fonction</label>
                <input className="form-input" value={form.fonction} onChange={e => setForm({...form, fonction: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Canal</label>
                <select className="form-select" value={form.canal} onChange={e => setForm({...form, canal: e.target.value})}>
                  {CANAUX.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Resultat</label>
                <select className="form-select" value={form.resultat} onChange={e => setForm({...form, resultat: e.target.value})}>
                  {RESULTATS.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Relance prevue</label>
                <input className="form-input" type="date" value={form.relance_prevue} onChange={e => setForm({...form, relance_prevue: e.target.value})} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea className="form-textarea" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Annuler</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPushModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowPushModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">Saisir Push CV — semaine {pushForm.semaine}</div>
              <button className="modal-close" onClick={() => setShowPushModal(false)}><X size={18} /></button>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Adchases</label>
                <input className="form-input" type="number" value={pushForm.adchases} onChange={e => setPushForm({...pushForm, adchases: parseInt(e.target.value)||0})} />
              </div>
              <div className="form-group">
                <label className="form-label">Placement actif</label>
                <input className="form-input" type="number" value={pushForm.placement_actif} onChange={e => setPushForm({...pushForm, placement_actif: parseInt(e.target.value)||0})} />
              </div>
              <div className="form-group">
                <label className="form-label">Controles de reference</label>
                <input className="form-input" type="number" value={pushForm.controles_reference} onChange={e => setPushForm({...pushForm, controles_reference: parseInt(e.target.value)||0})} />
              </div>
              <div className="form-group">
                <label className="form-label">Total</label>
                <div style={{ padding: '8px 12px', background: '#ede9fd', borderRadius: 8, fontWeight: 600, color: '#6d5ce7' }}>
                  {pushForm.adchases + pushForm.placement_actif} / 150
                </div>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea className="form-textarea" value={pushForm.notes} onChange={e => setPushForm({...pushForm, notes: e.target.value})} />
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowPushModal(false)}>Annuler</button>
              <button className="btn btn-primary" onClick={savePush} disabled={saving}>
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function getWeek() {
  const d = new Date()
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const dayNum = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  return Math.ceil((((date - yearStart) / 86400000) + 1) / 7)
}

function getMonday() {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(d.setDate(diff)).toISOString().split('T')[0]
}
