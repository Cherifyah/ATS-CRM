import React, { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Plus, X, Edit2, Trash2 } from 'lucide-react'

const supabase = createClient(
  'https://nlvffxqewztfpuvzqeih.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5sdmZmeHFld3p0ZnB1dnpxZWloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5NDY5NTgsImV4cCI6MjA5NjUyMjk1OH0.6tED9Mw82dh5FKaEzeagSJSWxdBg1CsZJQou4TTTE8Q'
)

const CANAUX = ['Appel', 'Lemlist', 'Mail direct', 'LinkedIn', 'Autre']
const RESULTATS = ['RDV obtenu', 'Rappel prevu', 'Pas de reponse', 'Pas interesse', 'En negociation']
const BADGE = { 'RDV obtenu': 'badge-green', 'En negociation': 'badge-blue', 'Rappel prevu': 'badge-orange', 'Pas de reponse': 'badge-gray', 'Pas interesse': 'badge-red' }

function emptyLog() {
  return { date_contact: new Date().toISOString().split('T')[0], nom_cabinet: '', interlocuteur: '', fonction: '', canal: 'Appel', resultat: 'RDV obtenu', relance_prevue: '', notes: '' }
}
function emptyPush() {
  return { semaine: getWeek(), lundi: getMonday(), adchases: 0, placement_actif: 0, objectif_hebdo: 150, controles_reference: 0, notes: '' }
}

export default function Prospection({ filter }) {
  const [logs, setLogs] = useState([])
  const [pushcv, setPushcv] = useState([])
  const [activeFilter, setActiveFilter] = useState(filter || null)
  const [showLogModal, setShowLogModal] = useState(false)
  const [showPushModal, setShowPushModal] = useState(false)
  const [editingLogId, setEditingLogId] = useState(null)
  const [editingPushId, setEditingPushId] = useState(null)
  const [form, setForm] = useState(emptyLog())
  const [pushForm, setPushForm] = useState(emptyPush())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [msg, setMsg] = useState(null)

  useEffect(() => { load() }, [])
  useEffect(() => { setActiveFilter(filter || null) }, [filter])

  async function load() {
    const { data: ldata } = await supabase.from('prospection').select('*').order('date_contact', { ascending: false })
    setLogs(ldata || [])
    const { data: pdata } = await supabase.from('push_cv').select('*').order('semaine', { ascending: false })
    setPushcv(pdata || [])
  }

  function openNewLog() { setEditingLogId(null); setForm(emptyLog()); setError(null); setShowLogModal(true) }
  function openEditLog(l) {
    setEditingLogId(l.id)
    setForm({ date_contact: l.date_contact||new Date().toISOString().split('T')[0], nom_cabinet: l.nom_cabinet||'', interlocuteur: l.interlocuteur||'', fonction: l.fonction||'', canal: l.canal||'Appel', resultat: l.resultat||'RDV obtenu', relance_prevue: l.relance_prevue||'', notes: l.notes||'' })
    setError(null); setShowLogModal(true)
  }
  function openNewPush() { setEditingPushId(null); setPushForm(emptyPush()); setShowPushModal(true) }
  function openEditPush(p) {
    setEditingPushId(p.id)
    setPushForm({ semaine: p.semaine||getWeek(), lundi: p.lundi||getMonday(), adchases: p.adchases||0, placement_actif: p.placement_actif||0, objectif_hebdo: 150, controles_reference: p.controles_reference||0, notes: p.notes||'' })
    setShowPushModal(true)
  }

  async function saveLog() {
    if (!form.nom_cabinet) { setError('Nom du cabinet obligatoire'); return }
    setSaving(true); setError(null)
    const payload = { date_contact: form.date_contact||null, nom_cabinet: form.nom_cabinet, interlocuteur: form.interlocuteur||null, fonction: form.fonction||null, canal: form.canal||null, resultat: form.resultat||null, relance_prevue: form.relance_prevue||null, notes: form.notes||null }
    const res = editingLogId
      ? await supabase.from('prospection').update(payload).eq('id', editingLogId)
      : await supabase.from('prospection').insert(payload).select()
    setSaving(false)
    if (res.error) { setError('Erreur: ' + res.error.message); return }
    setShowLogModal(false); setForm(emptyLog()); setEditingLogId(null)
    setMsg(editingLogId ? 'Contact mis à jour' : 'Contact enregistré')
    setTimeout(() => setMsg(null), 3000); load()
  }

  async function deleteLog(id) {
    if (window.confirm('Supprimer ce contact ?')) { await supabase.from('prospection').delete().eq('id', id); load() }
  }

  async function savePush() {
    setSaving(true)
    const payload = { semaine: pushForm.semaine||getWeek(), lundi: pushForm.lundi||null, adchases: pushForm.adchases||0, placement_actif: pushForm.placement_actif||0, objectif_hebdo: 150, controles_reference: pushForm.controles_reference||0, notes: pushForm.notes||null }
    const res = editingPushId
      ? await supabase.from('push_cv').update(payload).eq('id', editingPushId)
      : await supabase.from('push_cv').insert(payload).select()
    setSaving(false)
    if (!res.error) { setShowPushModal(false); setPushForm(emptyPush()); setEditingPushId(null); setMsg('Push CV enregistré'); setTimeout(() => setMsg(null), 3000); load() }
  }

  async function deletePush(id) {
    if (window.confirm('Supprimer cette semaine ?')) { await supabase.from('push_cv').delete().eq('id', id); load() }
  }

  const thisMonth = new Date().toISOString().slice(0, 7)
  const prospectsMonth = logs.filter(l => l.date_contact && l.date_contact.startsWith(thisMonth)).length
  const rdvMonth = logs.filter(l => l.date_contact && l.date_contact.startsWith(thisMonth) && l.resultat === 'RDV obtenu').length
  const latestPush = pushcv[0]

  // Filtrage
  const displayedLogs = activeFilter === 'RDV obtenu'
    ? logs.filter(l => l.resultat === 'RDV obtenu')
    : activeFilter === 'mois'
    ? logs.filter(l => l.date_contact && l.date_contact.startsWith(thisMonth))
    : logs

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="page-title">Prospection</div>
          <div className="page-sub">
            {displayedLogs.length} contact{displayedLogs.length > 1 ? 's' : ''}
            {activeFilter === 'RDV obtenu' && ' — filtre : RDV obtenus'}
            {activeFilter === 'mois' && ' — filtre : Ce mois'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {activeFilter && <button className="btn btn-secondary" onClick={() => setActiveFilter(null)}>✕ Retirer le filtre</button>}
          <button className="btn btn-secondary" onClick={openNewPush}>+ Push CV semaine</button>
          <button className="btn btn-primary" onClick={openNewLog}><Plus size={15} /> Logger un contact</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        {[
          { key: null, label: 'Tous' },
          { key: 'mois', label: 'Ce mois' },
          { key: 'RDV obtenu', label: 'RDV obtenus' },
          { key: 'Rappel prevu', label: 'Rappels prévus' },
          { key: 'En negociation', label: 'En négociation' },
        ].map(f => (
          <button key={f.key || 'tous'} onClick={() => setActiveFilter(f.key)}
            style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 500, cursor: 'pointer', border: 'none',
              background: activeFilter === f.key ? '#6d5ce7' : '#f3f4f6', color: activeFilter === f.key ? '#fff' : '#374151' }}>
            {f.label}
          </button>
        ))}
      </div>

      {msg && <div className="alert alert-success">{msg}</div>}

      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 20 }}>
        <div className="kpi-card kpi-purple"><div className="kpi-label">Prospects ce mois</div><div className="kpi-value">{prospectsMonth}</div><div className="kpi-badge">Objectif : 60</div></div>
        <div className="kpi-card kpi-green"><div className="kpi-label">RDV obtenus ce mois</div><div className="kpi-value">{rdvMonth}</div><div className="kpi-badge">Taux : {prospectsMonth > 0 ? Math.round(rdvMonth/prospectsMonth*100) : 0}%</div></div>
        <div className="kpi-card kpi-orange"><div className="kpi-label">Push CV semaine {latestPush?.semaine || '—'}</div><div className="kpi-value">{latestPush ? (latestPush.adchases + latestPush.placement_actif) : 0}</div><div className="kpi-badge">/ 150 objectif</div></div>
      </div>

      {latestPush && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-title" style={{ marginBottom: 12 }}>Push CV — semaine {latestPush.semaine}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
            <div className="push-cv-card"><div className="push-cv-label">Adchases</div><div className="push-cv-value" style={{ color: '#2e86de' }}>{latestPush.adchases}</div></div>
            <div className="push-cv-card"><div className="push-cv-label">Placement actif</div><div className="push-cv-value" style={{ color: '#1fbc7a' }}>{latestPush.placement_actif}</div></div>
            <div className="push-cv-card" style={{ background: '#ede9fd' }}><div className="push-cv-label">Total</div><div className="push-cv-value" style={{ color: '#6d5ce7' }}>{latestPush.adchases + latestPush.placement_actif}</div><div style={{ fontSize: 10, color: '#4c3bb8' }}>{Math.round((latestPush.adchases + latestPush.placement_actif)/150*100)}% de 150</div></div>
            <div className="push-cv-card" style={{ background: '#fef3c7' }}><div className="push-cv-label">Contrôles de réf.</div><div className="push-cv-value" style={{ color: '#f5a623' }}>{latestPush.controles_reference}</div></div>
          </div>
        </div>
      )}

      <div className="section-title">Push CV — historique</div>
      <div className="card" style={{ padding: 0, marginBottom: 16 }}>
        <table className="data-table">
          <thead><tr><th>Semaine</th><th>Adchases</th><th>Placement actif</th><th>Total</th><th>% objectif</th><th>Contrôles</th><th>Notes</th><th>Actions</th></tr></thead>
          <tbody>
            {pushcv.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', color: '#9ca3af', padding: 20 }}>Aucune saisie</td></tr>}
            {pushcv.map(p => {
              const total = (p.adchases||0) + (p.placement_actif||0)
              const pct = Math.round(total/150*100)
              return (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600 }}>S{p.semaine}</td>
                  <td style={{ color: '#2e86de', fontWeight: 500 }}>{p.adchases}</td>
                  <td style={{ color: '#1fbc7a', fontWeight: 500 }}>{p.placement_actif}</td>
                  <td style={{ color: '#6d5ce7', fontWeight: 600 }}>{total}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ flex: 1, height: 6, background: '#f3f4f6', borderRadius: 3, overflow: 'hidden', minWidth: 50 }}>
                        <div style={{ height: 6, background: pct >= 100 ? '#1fbc7a' : '#6d5ce7', width: `${Math.min(100,pct)}%`, borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 11, color: '#6b7280' }}>{pct}%</span>
                    </div>
                  </td>
                  <td style={{ color: '#f5a623', fontWeight: 500 }}>{p.controles_reference}</td>
                  <td style={{ fontSize: 11, color: '#6b7280' }}>{p.notes}</td>
                  <td><div className="action-icons">
                    <button className="action-icon" onClick={() => openEditPush(p)}><Edit2 size={14} /></button>
                    <button className="action-icon danger" onClick={() => deletePush(p.id)}><Trash2 size={14} /></button>
                  </div></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="section-title">Log de prospection</div>
      <div className="card" style={{ padding: 0 }}>
        <table className="data-table">
          <thead><tr><th>Date</th><th>Cabinet</th><th>Interlocuteur</th><th>Canal</th><th>Résultat</th><th>Relance</th><th>Notes</th><th>Actions</th></tr></thead>
          <tbody>
            {displayedLogs.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', color: '#9ca3af', padding: 24 }}>Aucun contact</td></tr>}
            {displayedLogs.map(l => (
              <tr key={l.id}>
                <td style={{ fontSize: 12 }}>{l.date_contact ? new Date(l.date_contact+'T12:00:00').toLocaleDateString('fr-FR') : '—'}</td>
                <td style={{ fontWeight: 600, fontSize: 13 }}>{l.nom_cabinet}</td>
                <td><div style={{ fontSize: 12 }}>{l.interlocuteur}</div><div style={{ fontSize: 11, color: '#6b7280' }}>{l.fonction}</div></td>
                <td><span className="tag tag-gray">{l.canal}</span></td>
                <td><span className={`badge ${BADGE[l.resultat] || 'badge-gray'}`}>{l.resultat}</span></td>
                <td style={{ fontSize: 11, color: '#6b7280' }}>{l.relance_prevue ? new Date(l.relance_prevue+'T12:00:00').toLocaleDateString('fr-FR') : '—'}</td>
                <td style={{ fontSize: 11, color: '#6b7280', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.notes}</td>
                <td><div className="action-icons">
                  <button className="action-icon" onClick={() => openEditLog(l)}><Edit2 size={14} /></button>
                  <button className="action-icon danger" onClick={() => deleteLog(l.id)}><Trash2 size={14} /></button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showLogModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowLogModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">{editingLogId ? 'Modifier le contact' : 'Logger un contact'}</div>
              <button className="modal-close" onClick={() => setShowLogModal(false)}><X size={18} /></button>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <div className="grid-2">
              <div className="form-group"><label className="form-label">Date</label><input className="form-input" type="date" value={form.date_contact} onChange={e => setForm({...form, date_contact: e.target.value})} /></div>
              <div className="form-group"><label className="form-label">Nom cabinet *</label><input className="form-input" value={form.nom_cabinet} onChange={e => setForm({...form, nom_cabinet: e.target.value})} /></div>
              <div className="form-group"><label className="form-label">Interlocuteur</label><input className="form-input" value={form.interlocuteur} onChange={e => setForm({...form, interlocuteur: e.target.value})} /></div>
              <div className="form-group"><label className="form-label">Fonction</label><input className="form-input" value={form.fonction} onChange={e => setForm({...form, fonction: e.target.value})} /></div>
              <div className="form-group"><label className="form-label">Canal</label><select className="form-select" value={form.canal} onChange={e => setForm({...form, canal: e.target.value})}>{CANAUX.map(c => <option key={c}>{c}</option>)}</select></div>
              <div className="form-group"><label className="form-label">Résultat</label><select className="form-select" value={form.resultat} onChange={e => setForm({...form, resultat: e.target.value})}>{RESULTATS.map(r => <option key={r}>{r}</option>)}</select></div>
              <div className="form-group"><label className="form-label">Relance prévue</label><input className="form-input" type="date" value={form.relance_prevue} onChange={e => setForm({...form, relance_prevue: e.target.value})} /></div>
            </div>
            <div className="form-group"><label className="form-label">Notes</label><textarea className="form-textarea" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowLogModal(false)}>Annuler</button>
              <button className="btn btn-primary" onClick={saveLog} disabled={saving}>{saving ? 'Enregistrement...' : editingLogId ? 'Mettre à jour' : 'Enregistrer'}</button>
            </div>
          </div>
        </div>
      )}

      {showPushModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowPushModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">{editingPushId ? 'Modifier Push CV' : 'Saisir Push CV'} — semaine {pushForm.semaine}</div>
              <button className="modal-close" onClick={() => setShowPushModal(false)}><X size={18} /></button>
            </div>
            <div className="grid-2">
              <div className="form-group"><label className="form-label">Adchases</label><input className="form-input" type="number" value={pushForm.adchases} onChange={e => setPushForm({...pushForm, adchases: parseInt(e.target.value)||0})} /></div>
              <div className="form-group"><label className="form-label">Placement actif</label><input className="form-input" type="number" value={pushForm.placement_actif} onChange={e => setPushForm({...pushForm, placement_actif: parseInt(e.target.value)||0})} /></div>
              <div className="form-group"><label className="form-label">Contrôles de référence</label><input className="form-input" type="number" value={pushForm.controles_reference} onChange={e => setPushForm({...pushForm, controles_reference: parseInt(e.target.value)||0})} /></div>
              <div className="form-group"><label className="form-label">Total</label><div style={{ padding: '8px 12px', background: '#ede9fd', borderRadius: 8, fontWeight: 600, color: '#6d5ce7' }}>{pushForm.adchases + pushForm.placement_actif} / 150</div></div>
            </div>
            <div className="form-group"><label className="form-label">Notes</label><textarea className="form-textarea" value={pushForm.notes} onChange={e => setPushForm({...pushForm, notes: e.target.value})} /></div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowPushModal(false)}>Annuler</button>
              <button className="btn btn-primary" onClick={savePush} disabled={saving}>{saving ? 'Enregistrement...' : editingPushId ? 'Mettre à jour' : 'Enregistrer'}</button>
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
}  async function load() {
    const { data: ldata } = await supabase.from('prospection').select('*').order('date_contact', { ascending: false })
    setLogs(ldata || [])
    const { data: pdata } = await supabase.from('push_cv').select('*').order('semaine', { ascending: false })
    setPushcv(pdata || [])
  }

  function openNewLog() {
    setEditingLogId(null)
    setForm(emptyLog())
    setError(null)
    setShowLogModal(true)
  }

  function openEditLog(l) {
    setEditingLogId(l.id)
    setForm({
      date_contact: l.date_contact || new Date().toISOString().split('T')[0],
      nom_cabinet: l.nom_cabinet || '',
      interlocuteur: l.interlocuteur || '',
      fonction: l.fonction || '',
      canal: l.canal || 'Appel',
      resultat: l.resultat || 'RDV obtenu',
      relance_prevue: l.relance_prevue || '',
      notes: l.notes || ''
    })
    setError(null)
    setShowLogModal(true)
  }

  function openNewPush() {
    setEditingPushId(null)
    setPushForm(emptyPush())
    setShowPushModal(true)
  }

  function openEditPush(p) {
    setEditingPushId(p.id)
    setPushForm({
      semaine: p.semaine || getWeek(),
      lundi: p.lundi || getMonday(),
      adchases: p.adchases || 0,
      placement_actif: p.placement_actif || 0,
      objectif_hebdo: p.objectif_hebdo || 150,
      controles_reference: p.controles_reference || 0,
      notes: p.notes || ''
    })
    setShowPushModal(true)
  }

  async function saveLog() {
    if (!form.nom_cabinet) { setError('Nom du cabinet obligatoire'); return }
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
    let err
    if (editingLogId) {
      const res = await supabase.from('prospection').update(payload).eq('id', editingLogId)
      err = res.error
    } else {
      const res = await supabase.from('prospection').insert(payload).select()
      err = res.error
    }
    setSaving(false)
    if (err) { setError('Erreur: ' + err.message); return }
    setShowLogModal(false)
    setForm(emptyLog())
    setEditingLogId(null)
    setMsg(editingLogId ? 'Contact mis a jour' : 'Contact enregistre')
    setTimeout(() => setMsg(null), 3000)
    load()
  }

  async function deleteLog(id) {
    if (window.confirm('Supprimer ce contact ?')) {
      await supabase.from('prospection').delete().eq('id', id)
      load()
    }
  }

  async function savePush() {
    setSaving(true)
    const payload = {
      semaine: pushForm.semaine || getWeek(),
      lundi: pushForm.lundi || null,
      adchases: pushForm.adchases || 0,
      placement_actif: pushForm.placement_actif || 0,
      objectif_hebdo: 150,
      controles_reference: pushForm.controles_reference || 0,
      notes: pushForm.notes || null
    }
    let err
    if (editingPushId) {
      const res = await supabase.from('push_cv').update(payload).eq('id', editingPushId)
      err = res.error
    } else {
      const res = await supabase.from('push_cv').insert(payload).select()
      err = res.error
    }
    setSaving(false)
    if (err) { console.error(err); return }
    setShowPushModal(false)
    setPushForm(emptyPush())
    setEditingPushId(null)
    setMsg(editingPushId ? 'Push CV mis a jour' : 'Push CV enregistre')
    setTimeout(() => setMsg(null), 3000)
    load()
  }

  async function deletePush(id) {
    if (window.confirm('Supprimer cette semaine Push CV ?')) {
      await supabase.from('push_cv').delete().eq('id', id)
      load()
    }
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
          <button className="btn btn-secondary" onClick={openNewPush}>+ Saisir Push CV semaine</button>
          <button className="btn btn-primary" onClick={openNewLog}><Plus size={15} /> Logger un contact</button>
        </div>
      </div>

      {msg && <div className="alert alert-success">{msg}</div>}

      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 20 }}>
        <div className="kpi-card kpi-purple"><div className="kpi-label">Prospects ce mois</div><div className="kpi-value">{prospectsMonth}</div><div className="kpi-badge">Objectif : 60</div></div>
        <div className="kpi-card kpi-green"><div className="kpi-label">RDV obtenus ce mois</div><div className="kpi-value">{rdvMonth}</div><div className="kpi-badge">Taux : {prospectsMonth > 0 ? Math.round(rdvMonth/prospectsMonth*100) : 0}%</div></div>
        <div className="kpi-card kpi-orange"><div className="kpi-label">Push CV semaine {latestPush?.semaine || '—'}</div><div className="kpi-value">{latestPush ? (latestPush.adchases + latestPush.placement_actif) : 0}</div><div className="kpi-badge">/ 150 objectif</div></div>
      </div>

      <div className="section-title">Push CV — historique</div>
      <div className="card" style={{ padding: 0, marginBottom: 16 }}>
        <table className="data-table">
          <thead>
            <tr><th>Semaine</th><th>Adchases</th><th>Placement actif</th><th>Total</th><th>% objectif</th><th>Controles ref.</th><th>Notes</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {pushcv.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', color: '#9ca3af', padding: 20 }}>Aucune saisie</td></tr>}
            {pushcv.map(p => {
              const total = (p.adchases || 0) + (p.placement_actif || 0)
              const pct = Math.round(total / 150 * 100)
              return (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600 }}>S{p.semaine}</td>
                  <td style={{ color: '#2e86de', fontWeight: 500 }}>{p.adchases}</td>
                  <td style={{ color: '#1fbc7a', fontWeight: 500 }}>{p.placement_actif}</td>
                  <td style={{ color: '#6d5ce7', fontWeight: 600 }}>{total}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ flex: 1, height: 6, background: '#f3f4f6', borderRadius: 3, overflow: 'hidden', minWidth: 50 }}>
                        <div style={{ height: 6, background: pct >= 100 ? '#1fbc7a' : '#6d5ce7', width: `${Math.min(100, pct)}%`, borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 11, color: '#6b7280' }}>{pct}%</span>
                    </div>
                  </td>
                  <td style={{ color: '#f5a623', fontWeight: 500 }}>{p.controles_reference}</td>
                  <td style={{ fontSize: 11, color: '#6b7280' }}>{p.notes}</td>
                  <td>
                    <div className="action-icons">
                      <button className="action-icon" title="Modifier" onClick={() => openEditPush(p)}><Edit2 size={14} /></button>
                      <button className="action-icon danger" title="Supprimer" onClick={() => deletePush(p.id)}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="section-title">Log de prospection</div>
      <div className="card" style={{ padding: 0 }}>
        <table className="data-table">
          <thead>
            <tr><th>Date</th><th>Cabinet</th><th>Interlocuteur</th><th>Canal</th><th>Resultat</th><th>Relance</th><th>Notes</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {logs.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', color: '#9ca3af', padding: 24 }}>Aucun contact logue</td></tr>}
            {logs.map(l => (
              <tr key={l.id}>
                <td style={{ fontSize: 12 }}>{l.date_contact ? new Date(l.date_contact + 'T12:00:00').toLocaleDateString('fr-FR') : '—'}</td>
                <td style={{ fontWeight: 600, fontSize: 13 }}>{l.nom_cabinet}</td>
                <td><div style={{ fontSize: 12 }}>{l.interlocuteur}</div><div style={{ fontSize: 11, color: '#6b7280' }}>{l.fonction}</div></td>
                <td><span className="tag tag-gray">{l.canal}</span></td>
                <td><span className={`badge ${BADGE[l.resultat] || 'badge-gray'}`}>{l.resultat}</span></td>
                <td style={{ fontSize: 11, color: '#6b7280' }}>{l.relance_prevue ? new Date(l.relance_prevue + 'T12:00:00').toLocaleDateString('fr-FR') : '—'}</td>
                <td style={{ fontSize: 11, color: '#6b7280', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.notes}</td>
                <td>
                  <div className="action-icons">
                    <button className="action-icon" title="Modifier" onClick={() => openEditLog(l)}><Edit2 size={14} /></button>
                    <button className="action-icon danger" title="Supprimer" onClick={() => deleteLog(l.id)}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showLogModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowLogModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">{editingLogId ? 'Modifier le contact' : 'Logger un contact'}</div>
              <button className="modal-close" onClick={() => setShowLogModal(false)}><X size={18} /></button>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <div className="grid-2">
              <div className="form-group"><label className="form-label">Date</label><input className="form-input" type="date" value={form.date_contact} onChange={e => setForm({...form, date_contact: e.target.value})} /></div>
              <div className="form-group"><label className="form-label">Nom cabinet *</label><input className="form-input" value={form.nom_cabinet} onChange={e => setForm({...form, nom_cabinet: e.target.value})} /></div>
              <div className="form-group"><label className="form-label">Interlocuteur</label><input className="form-input" value={form.interlocuteur} onChange={e => setForm({...form, interlocuteur: e.target.value})} /></div>
              <div className="form-group"><label className="form-label">Fonction</label><input className="form-input" value={form.fonction} onChange={e => setForm({...form, fonction: e.target.value})} /></div>
              <div className="form-group"><label className="form-label">Canal</label><select className="form-select" value={form.canal} onChange={e => setForm({...form, canal: e.target.value})}>{CANAUX.map(c => <option key={c}>{c}</option>)}</select></div>
              <div className="form-group"><label className="form-label">Resultat</label><select className="form-select" value={form.resultat} onChange={e => setForm({...form, resultat: e.target.value})}>{RESULTATS.map(r => <option key={r}>{r}</option>)}</select></div>
              <div className="form-group"><label className="form-label">Relance prevue</label><input className="form-input" type="date" value={form.relance_prevue} onChange={e => setForm({...form, relance_prevue: e.target.value})} /></div>
            </div>
            <div className="form-group"><label className="form-label">Notes</label><textarea className="form-textarea" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowLogModal(false)}>Annuler</button>
              <button className="btn btn-primary" onClick={saveLog} disabled={saving}>{saving ? 'Enregistrement...' : editingLogId ? 'Mettre a jour' : 'Enregistrer'}</button>
            </div>
          </div>
        </div>
      )}

      {showPushModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowPushModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">{editingPushId ? 'Modifier Push CV' : 'Saisir Push CV'} — semaine {pushForm.semaine}</div>
              <button className="modal-close" onClick={() => setShowPushModal(false)}><X size={18} /></button>
            </div>
            <div className="grid-2">
              <div className="form-group"><label className="form-label">Adchases</label><input className="form-input" type="number" value={pushForm.adchases} onChange={e => setPushForm({...pushForm, adchases: parseInt(e.target.value)||0})} /></div>
              <div className="form-group"><label className="form-label">Placement actif</label><input className="form-input" type="number" value={pushForm.placement_actif} onChange={e => setPushForm({...pushForm, placement_actif: parseInt(e.target.value)||0})} /></div>
              <div className="form-group"><label className="form-label">Controles de reference</label><input className="form-input" type="number" value={pushForm.controles_reference} onChange={e => setPushForm({...pushForm, controles_reference: parseInt(e.target.value)||0})} /></div>
              <div className="form-group"><label className="form-label">Total</label><div style={{ padding: '8px 12px', background: '#ede9fd', borderRadius: 8, fontWeight: 600, color: '#6d5ce7' }}>{pushForm.adchases + pushForm.placement_actif} / 150</div></div>
            </div>
            <div className="form-group"><label className="form-label">Notes</label><textarea className="form-textarea" value={pushForm.notes} onChange={e => setPushForm({...pushForm, notes: e.target.value})} /></div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowPushModal(false)}>Annuler</button>
              <button className="btn btn-primary" onClick={savePush} disabled={saving}>{saving ? 'Enregistrement...' : editingPushId ? 'Mettre a jour' : 'Enregistrer'}</button>
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
