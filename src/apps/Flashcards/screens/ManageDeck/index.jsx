import { useState, useEffect } from 'react'
import { ArrowLeft, Plus, X, ChevronDown, ChevronUp } from 'lucide-react'
import { supabase } from '../../../../supabase'
import { THEMES } from '../../constants'
import { compressImage } from '../../utils.js'
import { useThemeColors } from '../../../../hooks/useThemeColors'
import { getNewPerDay, setNewPerDay } from '../../services/progressStorage'
import CriterionForm from './CriterionForm'
import CardForm from './CardForm'

export default function ManageDeck({ deck, dark, onBack, onDelete }) {
  const [deckInfo, setDeckInfo]     = useState({ name: deck.name, theme: deck.theme, description: deck.description || '' })
  const [newPerDay, setNewPerDayState] = useState(() => getNewPerDay(deck.id))
  const [criteria, setCriteria]     = useState([])
  const [cards, setCards]           = useState([])
  const [cardValues, setCardValues] = useState({})
  const [loading, setLoading]       = useState(true)
  const [openSection, setOpenSection] = useState('criteria')
  const [editingCriterion, setEditingCriterion] = useState(null)
  const [criterionForm, setCriterionForm]       = useState({ name: '', type: 'text', question_title: '', interrogeable: true })
  const [editingCard, setEditingCard]   = useState(null)
  const [cardForm, setCardForm]         = useState({})
  const [uploadingCriterion, setUploadingCriterion] = useState(null)
  const [savingCard, setSavingCard]     = useState(false)

  useEffect(() => { load() }, [deck.id])

  const load = async () => {
    setLoading(true)
    const [{ data: crit }, { data: cardsData }] = await Promise.all([
      supabase.from('deck_criteria').select('*').eq('deck_id', deck.id).order('position'),
      supabase.from('cards').select('id, created_at').eq('deck_id', deck.id).order('created_at'),
    ])
    setCriteria(crit || [])
    if (cardsData?.length) {
      const cardIds = cardsData.map(c => c.id)
      const { data: vals } = await supabase
        .from('card_values').select('card_id, criterion_id, value').in('card_id', cardIds)
      const map = {}
      for (const v of (vals || [])) {
        if (!map[v.card_id]) map[v.card_id] = {}
        map[v.card_id][v.criterion_id] = v.value
      }
      setCards(cardsData)
      setCardValues(map)
    } else {
      setCards([])
      setCardValues({})
    }
    setLoading(false)
  }

  const saveDeckInfo = async () => {
    await supabase.from('decks').update(deckInfo).eq('id', deck.id)
  }

  const openNewCriterion = () => {
    setEditingCriterion({ id: null })
    setCriterionForm({ name: '', type: 'text', question_title: '', interrogeable: true, quiz_answer_criterion_id: '' })
  }

  const openEditCriterion = (c) => {
    setEditingCriterion(c)
    setCriterionForm({ name: c.name, type: c.type, question_title: c.question_title, interrogeable: c.interrogeable !== false, quiz_answer_criterion_id: c.quiz_answer_criterion_id || '' })
  }

  const saveCriterion = async () => {
    if (!criterionForm.name.trim()) return
    const critData = {
      name: criterionForm.name.trim(),
      type: criterionForm.type,
      question_title: criterionForm.question_title.trim(),
      interrogeable: criterionForm.interrogeable,
      quiz_answer_criterion_id: criterionForm.quiz_answer_criterion_id || null,
    }
    if (editingCriterion?.id) {
      await supabase.from('deck_criteria').update(critData).eq('id', editingCriterion.id)
    } else {
      await supabase.from('deck_criteria').insert({ deck_id: deck.id, position: criteria.length, ...critData })
    }
    setEditingCriterion(null)
    await load()
  }

  const deleteCriterion = async (id) => {
    await supabase.from('deck_criteria').delete().eq('id', id)
    await load()
  }

  const toggleInterrogeable = async (c) => {
    await supabase.from('deck_criteria').update({ interrogeable: !c.interrogeable }).eq('id', c.id)
    setCriteria(prev => prev.map(x => x.id === c.id ? { ...x, interrogeable: !x.interrogeable } : x))
  }

  const openNewCard = () => { setEditingCard({ id: null }); setCardForm({}) }
  const openEditCard = (card) => { setEditingCard(card); setCardForm(cardValues[card.id] || {}) }

  const saveCard = async () => {
    setSavingCard(true)
    try {
      let cardId = editingCard?.id
      if (!cardId) {
        const { data } = await supabase.from('cards').insert({ deck_id: deck.id, front: '', back: '' }).select().single()
        cardId = data.id
      }
      const values = Object.entries(cardForm)
        .filter(([, v]) => v !== undefined && v !== '')
        .map(([criterionId, value]) => ({ card_id: cardId, criterion_id: criterionId, value }))
      if (values.length > 0) {
        await supabase.from('card_values').upsert(values, { onConflict: 'card_id,criterion_id' })
      }
      setEditingCard(null)
      await load()
    } catch (err) { alert('Erreur : ' + err.message) }
    setSavingCard(false)
  }

  const deleteCard = async (cardId) => {
    await supabase.from('cards').delete().eq('id', cardId)
    setCards(prev => prev.filter(c => c.id !== cardId))
    setCardValues(prev => { const n = { ...prev }; delete n[cardId]; return n })
  }

  const handleImageUpload = async (e, criterionId) => {
    const file = e.target.files[0]
    if (!file) return
    setUploadingCriterion(criterionId)
    try {
      const blob = await compressImage(file)
      const path = `tmp/${Date.now()}.jpg`
      const { error } = await supabase.storage.from('card-images').upload(path, blob, { contentType: 'image/jpeg' })
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('card-images').getPublicUrl(path)
      setCardForm(prev => ({ ...prev, [criterionId]: publicUrl }))
    } catch (err) { alert('Erreur upload : ' + err.message) }
    setUploadingCriterion(null)
    e.target.value = ''
  }

  const getCardLabel = (card) => {
    const vals = cardValues[card.id] || {}
    for (const c of criteria) {
      if (c.type === 'text' && vals[c.id]) return vals[c.id]
    }
    return '—'
  }

  const getCardThumb = (card) => {
    const vals = cardValues[card.id] || {}
    for (const c of criteria) {
      if (c.type === 'image' && vals[c.id]) return vals[c.id]
    }
    return null
  }

  const { bg, card, border, border2, textPri, textSec } = useThemeColors(dark)
  const inputBg = dark ? '#0f0a1e' : '#ffffff'

  if (loading) return (
    <div className="flex-1 flex items-center justify-center" style={{ background: bg }}>
      <div className="text-4xl animate-bounce">🐒</div>
    </div>
  )

  return (
    <div className="flex flex-col h-full" style={{ background: bg }}>

      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-3 flex-shrink-0"
        style={{ background: card, borderBottom: `1px solid ${border}` }}>
        <button onClick={onBack} style={{ color: textSec }}>
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-bold truncate" style={{ color: textPri }}>{deck.name}</p>
          <p className="text-xs" style={{ color: textSec }}>{cards.length} carte{cards.length > 1 ? 's' : ''} · {criteria.length} critère{criteria.length > 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => { if (confirm('Supprimer ce deck ?')) onDelete(deck) }}
          className="text-xs px-2 py-1 rounded-lg"
          style={{ background: dark ? '#3b1a1a' : '#fff1f1', color: '#f87171' }}>
          🗑️
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-8">

        {/* ── Infos deck ── */}
        <div className="mx-4 mt-4 rounded-2xl p-4 space-y-3"
          style={{ background: card, border: `1px solid ${border}` }}>
          <input
            value={deckInfo.name}
            onChange={e => setDeckInfo(p => ({ ...p, name: e.target.value }))}
            onBlur={saveDeckInfo}
            placeholder="Nom du deck"
            className="w-full text-sm font-semibold bg-transparent pb-1 focus:outline-none"
            style={{ borderBottom: `1px solid ${border}`, color: textPri }}
          />
          <select
            value={deckInfo.theme}
            onChange={e => { setDeckInfo(p => ({ ...p, theme: e.target.value })); saveDeckInfo() }}
            className="w-full text-sm bg-transparent focus:outline-none"
            style={{ color: textSec }}>
            {THEMES.map(t => <option key={t.id} value={t.id}>{t.emoji} {t.label}</option>)}
          </select>
          <input
            value={deckInfo.description}
            onChange={e => setDeckInfo(p => ({ ...p, description: e.target.value }))}
            onBlur={saveDeckInfo}
            placeholder="Description (optionnelle)"
            className="w-full text-xs bg-transparent focus:outline-none"
            style={{ color: textSec }}
          />

          {/* Nouvelles cartes par jour */}
          <div className="pt-2" style={{ borderTop: `1px solid ${border}` }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium" style={{ color: textSec }}>Nouvelles cartes / jour</span>
              <span className="text-xs font-bold" style={{ color: textPri }}>
                {newPerDay === 999 ? '∞ illimité' : newPerDay}
              </span>
            </div>
            <div className="flex gap-2">
              {[5, 10, 20, 999].map(n => (
                <button key={n}
                  onClick={() => {
                    setNewPerDayState(n)
                    setNewPerDay(deck.id, n)
                  }}
                  className="flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all"
                  style={{
                    background: newPerDay === n ? (dark ? '#7c3aed' : '#1a1033') : (dark ? '#2d1f5e' : '#f3f4f6'),
                    color: newPerDay === n ? 'white' : textSec,
                  }}>
                  {n === 999 ? '∞' : n}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Section Critères ── */}
        <Section
          title={`Critères · ${criteria.length}`}
          isOpen={openSection === 'criteria'}
          onToggle={() => setOpenSection(s => s === 'criteria' ? null : 'criteria')}
          dark={dark}
          action={
            <button onClick={openNewCriterion}
              className="text-xs px-2 py-1 rounded-lg font-medium text-white"
              style={{ background: dark ? '#7c3aed' : '#111827' }}>
              + Ajouter
            </button>
          }>

          <div className="space-y-2 pt-1">
            {criteria.map(c => (
              <div key={c.id} className="rounded-xl overflow-hidden"
                style={{ background: card, border: `1px solid ${border}` }}>
                <div className="flex items-center gap-3 px-3 py-2.5">
                  <span className="text-base">{c.type === 'image' ? '🖼️' : '📝'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: textPri }}>{c.name}</p>
                    {c.question_title && (
                      <p className="text-xs truncate" style={{ color: textSec }}>{c.question_title}</p>
                    )}
                  </div>
                  <button onClick={() => toggleInterrogeable(c)}
                    className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                    style={{
                      background: c.interrogeable !== false ? (dark ? '#2d2060' : '#eef2ff') : (dark ? '#2d1f5e' : '#f3f4f6'),
                      color: c.interrogeable !== false ? (dark ? '#a5b4fc' : '#4f46e5') : textSec,
                    }}>
                    {c.interrogeable !== false ? '❓ question' : '💡 réponse'}
                  </button>
                  <button onClick={() => openEditCriterion(c)} style={{ color: textSec }} className="flex-shrink-0">✏️</button>
                  <button onClick={() => deleteCriterion(c.id)} className="flex-shrink-0" style={{ color: textSec }}>
                    <X size={14} />
                  </button>
                </div>

                {editingCriterion?.id === c.id && (
                  <CriterionForm
                    form={criterionForm}
                    onChange={setCriterionForm}
                    onSave={saveCriterion}
                    onCancel={() => setEditingCriterion(null)}
                    allCriteria={criteria}
                    dark={dark}
                  />
                )}
              </div>
            ))}

            {editingCriterion?.id === null && (
              <div className="rounded-xl overflow-hidden" style={{ background: card, border: `1px solid ${border2}` }}>
                <CriterionForm
                  form={criterionForm}
                  onChange={setCriterionForm}
                  onSave={saveCriterion}
                  onCancel={() => setEditingCriterion(null)}
                  allCriteria={criteria}
                  dark={dark}
                  isNew
                />
              </div>
            )}
          </div>
        </Section>

        {/* ── Section Cartes ── */}
        <Section
          title={`Cartes · ${cards.length}`}
          isOpen={openSection === 'cards'}
          onToggle={() => setOpenSection(s => s === 'cards' ? null : 'cards')}
          dark={dark}
          action={
            <button onClick={openNewCard}
              className="text-xs px-2 py-1 rounded-lg font-medium text-white"
              style={{ background: dark ? '#7c3aed' : '#111827' }}>
              + Ajouter
            </button>
          }>

          {editingCard?.id === null && (
            <div className="rounded-xl overflow-hidden mb-3" style={{ background: card, border: `1px solid ${border2}` }}>
              <div className="px-3 pt-3 pb-1">
                <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: textSec }}>Nouvelle carte</p>
              </div>
              <CardForm
                criteria={criteria}
                form={cardForm}
                onChange={setCardForm}
                onSave={saveCard}
                onCancel={() => setEditingCard(null)}
                saving={savingCard}
                onImageUpload={handleImageUpload}
                uploadingCriterion={uploadingCriterion}
                dark={dark}
              />
            </div>
          )}

          <div className="space-y-2">
            {cards.map(card_ => {
              const thumb = getCardThumb(card_)
              const label = getCardLabel(card_)
              return (
                <div key={card_.id} className="rounded-xl overflow-hidden"
                  style={{ background: card, border: `1px solid ${border}` }}>
                  <div className="flex items-center gap-3 px-3 py-2.5">
                    {thumb ? (
                      <img src={thumb} alt="" className="w-10 h-10 object-cover rounded-lg flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                        style={{ background: dark ? '#2d1f5e' : '#f3f4f6' }}>🃏</div>
                    )}
                    <p className="flex-1 text-sm font-medium truncate" style={{ color: textPri }}>{label}</p>
                    <button onClick={() => openEditCard(card_)} style={{ color: textSec }}>✏️</button>
                    <button onClick={() => deleteCard(card_.id)} style={{ color: textSec }}>
                      <X size={14} />
                    </button>
                  </div>

                  {editingCard?.id === card_.id && (
                    <CardForm
                      criteria={criteria}
                      form={cardForm}
                      onChange={setCardForm}
                      onSave={saveCard}
                      onCancel={() => setEditingCard(null)}
                      saving={savingCard}
                      onImageUpload={handleImageUpload}
                      uploadingCriterion={uploadingCriterion}
                      dark={dark}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </Section>
      </div>
    </div>
  )
}

// ── Section repliable (locale à ManageDeck) ────────────────
function Section({ title, isOpen, onToggle, action, children, dark }) {
  const { textSec } = useThemeColors(dark)
  return (
    <div className="mx-4 mt-4">
      <div className="flex items-center justify-between mb-2 px-1">
        <button onClick={onToggle} className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest"
          style={{ color: textSec }}>
          {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {title}
        </button>
        {action}
      </div>
      {isOpen && children}
    </div>
  )
}
