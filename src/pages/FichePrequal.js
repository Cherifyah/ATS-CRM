import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Save, Check } from 'lucide-react'

const METIERS = ['Audit financier', 'Expertise comptable', 'Conseil', 'Juridique']

const QUESTIONS_COMMUNES = [
  { num: 1, text: "Bonjour [Prénom], je suis Cherif / Kemra de CK Consulting, cabinet spécialisé recrutement audit, EC et juridique. Avez-vous quelques minutes pour qu'on échange ?" },
  { num: 2, text: "Comment avez-vous entendu parler de nous / qu'est-ce qui vous a amené à postuler ?" },
  { num: 3, text: "Pouvez-vous me retracer votre parcours depuis votre formation ?" },
  { num: 4, text: "Quelle est votre structure actuelle — taille, type, clientèle ?" },
  { num: 5, text: "Quel est votre niveau d'autonomie actuel sur vos missions ?" },
  { num: 6, text: "Avez-vous une expérience en management ou supervision d'équipe ?" },
  { num: 7, text: "Quels outils maîtrisez-vous ?" },
  { num: 8, text: "Niveau d'anglais — lu / écrit / parlé, contexte professionnel ?" },
  { num: 9, text: "Autres langues parlées ? Langue, niveau et contexte d'utilisation." },
]

const QUESTIONS_SPEC = {
  'Audit financier': [
    { num: 10, text: "Normes pratiquées — French GAAP, IFRS, consolidation ?" },
    { num: 11, text: "Type de mandats — CAC, contractuel, due diligence ?" },
    { num: 12, text: "Spécialisation sectorielle (banque, assurance, immo...) ?" },
    { num: 13, text: "Inscription à l'ordre — signataire ou en cours ?" },
  ],
  'Expertise comptable': [
    { num: 10, text: "Type de missions — tenue, révision, conseil, social, juridique ?" },
    { num: 11, text: "Portefeuille clients — secteurs, taille des entités ?" },
    { num: 12, text: "Statut DEC — stage en cours, mémoire, diplômé ?" },
    { num: 13, text: "Relation client — autonomie sur le contact associé ?" },
  ],
  'Conseil': [
    { num: 10, text: "Type de conseil — transaction, restructuring, performance, stratégie ?" },
    { num: 11, text: "Taille des missions — mid-market, large cap, PE-backed ?" },
    { num: 12, text: "Compétences en modélisation financière / data ?" },
    { num: 13, text: "Expérience client direct ou uniquement interne cabinet ?" },
  ],
  'Juridique': [
    { num: 10, text: "Domaines pratiqués — droit des sociétés, M&A, contrats, fiscal ?" },
    { num: 11, text: "Contexte — cabinet d'EC, cabinet d'avocats, in-house ?" },
    { num: 12, text: "CAPA ou CRFPA obtenu — barreau ou non-barreau ?" },
    { num: 13, text: "Rédaction d'actes en autonomie (statuts, PV, cessions) ?" },
  ],
}

const QUESTIONS_FIN = [
  { num: 14, text: "Qu'est-ce qui vous amène à envisager un changement ?" },
  { num: 15, text: "Quel type de structure / environnement recherchez-vous ?" },
  { num: 16, text: "Critères éliminatoires — ce que vous excluez ?" },
  { num: 17, text: "En cours de process avec d'autres cabinets ?" },
  { num: 18, text: "Rémunération actuelle (fixe + variable) ?" },
  { num: 19, text: "Rémunération cible ?" },
  { num: 20, text: "Disponibilité — préavis, durée ?" },
  { num: 21, text: "Synthèse / appréciation globale du profil" },
]

export default function FichePrequal() {
  const [candidats, setCandidats] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [metier, setMetier] = useState('Audit financier')
  const [answers, setAnswers] = useState({})
  const [saved, setSaved] = useState(false)
  const [existingFiche, setExistingFiche] = useState(null)

  useEffect(() => { loadCandidats() }, [])
  useEffect(() => { if (selectedId) loadFiche() }, [selectedId])

  async function loadCandidats() {
    const { data } = await supabase.from('candidats').select('id, nom, metier').order('nom')
    setCandidats(data || [])
  }

  async function loadFiche() {
    const { data } = await supabase.from('fiches_prequal').select('*').eq('candidat_id', selectedId).single()
    if (data) {
      setExistingFiche(data)
      setMetier(data.metier || 'Audit financier')
      const a = {}
      for (let i = 1; i <= 21; i++) a[`q${i}`] = data[`q${i}`] || ''
      setAnswers(a)
    } else {
      setExistingFiche(null)
      setAnswers({})
      const cand = candidats.find(c => c.id === selectedId)
      if (cand) setMetier(cand.metier || 'Audit financier')
    }
  }

  function setAnswer(key, val) {
    setAnswers(prev => ({ ...prev, [key]: val }))
  }

  async function saveFiche() {
    if (!selectedId) return
    const payload = { candidat_id: selectedId, metier, date_entretien: new Date().toISOString().split('T')[0], ...answers }
    if (existingFiche) {
      await supabase.from('fiches_prequal').update(payload).eq('id', existingFiche.id)
    } else {
      await supabase.from('fiches_prequal').insert([payload])
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    loadFiche()
  }

  const specQuestions = QUESTIONS_SPEC[metier] || QUESTIONS_SPEC['Audit financier']

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Trame de préqualification</div>
        <div className="page-sub">1 fiche par candidat — sauvegardée dans la base de données</div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <label className="form-label">Candidat</label>
          <select className="form-select" value={selectedId} onChange={e => setSelectedId(e.target.value)}>
            <option value="">-- Sélectionner un candidat --</option>
            {candidats.map(c => <option key={c.id} value={c.id}>{c.nom} — {c.metier}</option>)}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label className="form-label">Métier</label>
          <div style={{ display: 'flex', gap: 6 }}>
            {METIERS.map(m => (
              <button key={m} onClick={() => setMetier(m)}
                style={{ padding: '5px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500, cursor: 'pointer', border: 'none',
                  background: metier === m ? '#6d5ce7' : '#f3f4f6', color: metier === m ? '#fff' : '#374151' }}>
                {m.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {!selectedId ? (
        <div className="empty-state"><p>Sélectionnez un candidat pour accéder à sa trame de préqualification</p></div>
      ) : (
        <>
          <div className="prequal-header">
            <div className="prequal-header-title">Trame entretien téléphonique — {candidats.find(c => c.id === selectedId)?.nom}</div>
            <div className="prequal-header-sub">{metier} — 20–30 min</div>
          </div>
          <div className="prequal-body">
            <div className="prequal-section-title">1 — Accroche & contexte · Commun</div>
            {QUESTIONS_COMMUNES.slice(0, 2).map(q => (
              <div className="prequal-q" key={q.num}>
                <div className="prequal-num">{q.num}</div>
                <div className="prequal-q-text">
                  {q.text}
                  <input className="form-input" style={{ marginTop: 4, fontSize: 11 }}
                    value={answers[`q${q.num}`] || ''} onChange={e => setAnswer(`q${q.num}`, e.target.value)}
                    placeholder="Notes..." />
                </div>
              </div>
            ))}

            <div className="prequal-section-title">2 — Parcours & compétences · Commun</div>
            <div className="grid-2">
              <div>
                {QUESTIONS_COMMUNES.slice(2, 6).map(q => (
                  <div className="prequal-q" key={q.num}>
                    <div className="prequal-num">{q.num}</div>
                    <div className="prequal-q-text">
                      {q.text}
                      <input className="form-input" style={{ marginTop: 4, fontSize: 11 }}
                        value={answers[`q${q.num}`] || ''} onChange={e => setAnswer(`q${q.num}`, e.target.value)}
                        placeholder="Notes..." />
                    </div>
                  </div>
                ))}
              </div>
              <div>
                {QUESTIONS_COMMUNES.slice(6).map(q => (
                  <div className="prequal-q" key={q.num}>
                    <div className="prequal-num">{q.num}</div>
                    <div className="prequal-q-text">
                      {q.text}
                      <input className="form-input" style={{ marginTop: 4, fontSize: 11 }}
                        value={answers[`q${q.num}`] || ''} onChange={e => setAnswer(`q${q.num}`, e.target.value)}
                        placeholder="Notes..." />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="prequal-section-title">3 — Questions spécifiques · {metier}</div>
            <div className="grid-2">
              {specQuestions.map(q => (
                <div className="prequal-q" key={q.num}>
                  <div className="prequal-num" style={{ background: '#dbeafe', color: '#1e40af' }}>{q.num}</div>
                  <div className="prequal-q-text">
                    {q.text}
                    <input className="form-input" style={{ marginTop: 4, fontSize: 11 }}
                      value={answers[`q${q.num}`] || ''} onChange={e => setAnswer(`q${q.num}`, e.target.value)}
                      placeholder="Notes..." />
                  </div>
                </div>
              ))}
            </div>

            <div className="prequal-section-title">4 — Motivations, disponibilité & rémunération · Commun</div>
            <div className="grid-2">
              {QUESTIONS_FIN.slice(0, 4).map(q => (
                <div className="prequal-q" key={q.num}>
                  <div className="prequal-num">{q.num}</div>
                  <div className="prequal-q-text">
                    {q.text}
                    <input className="form-input" style={{ marginTop: 4, fontSize: 11 }}
                      value={answers[`q${q.num}`] || ''} onChange={e => setAnswer(`q${q.num}`, e.target.value)}
                      placeholder="Notes..." />
                  </div>
                </div>
              ))}
            </div>
            <div className="grid-2">
              {QUESTIONS_FIN.slice(4, 7).map(q => (
                <div className="prequal-q" key={q.num}>
                  <div className="prequal-num">{q.num}</div>
                  <div className="prequal-q-text">
                    {q.text}
                    <input className="form-input" style={{ marginTop: 4, fontSize: 11 }}
                      value={answers[`q${q.num}`] || ''} onChange={e => setAnswer(`q${q.num}`, e.target.value)}
                      placeholder="Notes..." />
                  </div>
                </div>
              ))}
            </div>

            <div className="prequal-section-title">5 — Synthèse</div>
            <textarea className="form-textarea" style={{ marginTop: 4 }}
              value={answers['q21'] || ''} onChange={e => setAnswer('q21', e.target.value)}
              placeholder="Appréciation globale du profil, points forts, points de vigilance..." />

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16, gap: 10, alignItems: 'center' }}>
              {saved && <span style={{ fontSize: 12, color: '#166534', display: 'flex', alignItems: 'center', gap: 4 }}><Check size={14} /> Fiche enregistrée</span>}
              <button className="btn btn-primary" onClick={saveFiche}>
                <Save size={14} /> Enregistrer la fiche
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
