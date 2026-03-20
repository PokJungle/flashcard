import { useState, useEffect } from 'react'
import { ArrowLeft, Plus, X, ChevronDown, ChevronUp, Camera, ExternalLink } from 'lucide-react'
import { supabase } from '../../../supabase'
import { THEMES } from '../constants'
import { compressImage } from '../utils.js'

export default function ManageDeck({ deck, onBack, onDelete }) {
  // ── État global ────────────────────────────────────────────
  const [deckInfo, setDeckInfo]     = useState({ name: deck.name, theme: deck.theme, description: deck.description || '' })
  const [criteria, setCriteria]     = useState([])
  const [cards, setCards]           = useState([])
  const [cardValues, setCardValues] = useState({}) // { cardId: { criterionId: value } }
  const [loading, setLoading]       = useState(true)

  // ── Sections repliables ────────────────────────────────────
  const [openSection, setOpenSection] = useState('criteria') // 'criteria' | 'cards' | null

  // ── Édition critère ────────────────────────────────────────
  const [editingCriterion, setEditingCriterion] = useState(null)
  const [criterionForm, setCriterionForm]       = useState({ name: '', type: 'text', question_title: '', interrogeable: true })

  // ── Édition carte ──────────────────────────────────────────
  const [editingCard, setEditingCard]   = useState(null) // null | { id } | { id: null } pour nouvelle
  const [cardForm, setCardForm]         = useState({})   // { criterionId: value }
  const [uploadingCriterion, setUploadingCriterion] = useState(null)
  const [savingCard, setSavingCard]     = useState(false)

  // ── Chargement ─────────────────────────────────────────────
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

  // ── Deck info ──────────────────────────────────────────────
  const saveDeckInfo = async () => {
    await supabase.from('decks').update(deckInfo).eq('id', deck.id)
  }

  // ── Critères ───────────────────────────────────────────────
  const openNewCriterion = () => {
    setEditingCriterion({ id: null })
    setCriterionForm({ name: '', type: 'text', question_title: '', interrogeable: true })
  }

  const openEditCriterion = (c) => {
    setEditingCriterion(c)
    setCriterionForm({ name: c.name, type: c.type, question_title: c.question_title, interrogeable: c.interrogeable !== false })
  }

  const saveCriterion = async () => {
    if (!criterionForm.name.trim()) return
    if (editingCriterion?.id) {
      await supabase.from('deck_criteria').update({
        name: criterionForm.name.trim(),
        type: criterionForm.type,
        question_title: criterionForm.question_title.trim(),
        interrogeable: criterionForm.interrogeable,
      }).eq('id', editingCriterion.id)
    } else {
      await supabase.from('deck_criteria').insert({
        deck_id: deck.id,
        name: criterionForm.name.trim(),
        type: criterionForm.type,
        question_title: criterionForm.question_title.trim(),
        interrogeable: criterionForm.interrogeable,
        position: criteria.length,
      })
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

  // ── Cartes ─────────────────────────────────────────────────
  const openNewCard = () => {
    setEditingCard({ id: null })
    setCardForm({})
  }

  const openEditCard = (card) => {
    setEditingCard(card)
    setCardForm(cardValues[card.id] || {})
  }

  const saveCard = async () => {
    setSavingCard(true)
    try {
      let cardId = editingCard?.id

      if (!cardId) {
        const { data } = await supabase.from('cards').insert({ deck_id: deck.id }).select().single()
        cardId = data.id
      }

      // Upsert toutes les valeurs
      const values = Object.entries(cardForm)
        .filter(([, v]) => v !== undefined && v !== '')
        .map(([criterionId, value]) => ({ card_id: cardId, criterion_id: criterionId, value }))

      if (values.length > 0) {
        await supabase.from('card_values').upsert(values, { onConflict: 'card_id,criterion_id' })
      }

      setEditingCard(null)
      await load()
    } catch (err) {
      alert('Erreur : ' + err.message)
    }
    setSavingCard(false)
  }

  const deleteCard = async (cardId) => {
    await supabase.from('cards').delete().eq('id', cardId)
    setCards(prev => prev.filter(c => c.id !== cardId))
    setCardValues(prev => { const n = { ...prev }; delete n[cardId]; return n })
  }

  // ── Upload image dans le formulaire carte ──────────────────
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
    } catch (err) {
      alert('Erreur upload : ' + err.message)
    }
    setUploadingCriterion(null)
    e.target.value = ''
  }

  // ── Helpers d'affichage ────────────────────────────────────
  const getCardLabel = (card) => {
    const vals = cardValues[card.id] || {}
    // Prendre la première valeur texte comme label
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

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-4xl animate-bounce">🐒</div>
    </div>
  )

  return (
    <div className="flex flex-col h-full bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-700">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 truncate">{deck.name}</p>
          <p className="text-xs text-gray-400">{cards.length} carte{cards.length > 1 ? 's' : ''} · {criteria.length} critère{criteria.length > 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => { if (confirm('Supprimer ce deck ?')) onDelete(deck) }}
          className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded-lg bg-red-50">
          🗑️
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-8">

        {/* ── Infos deck ── */}
        <div className="bg-white mx-4 mt-4 rounded-2xl border border-gray-100 p-4 space-y-3">
          <input
            value={deckInfo.name}
            onChange={e => setDeckInfo(p => ({ ...p, name: e.target.value }))}
            onBlur={saveDeckInfo}
            placeholder="Nom du deck"
            className="w-full text-sm font-semibold text-gray-900 bg-transparent border-b border-gray-100 pb-1 focus:outline-none focus:border-gray-400"
          />
          <select
            value={deckInfo.theme}
            onChange={e => { setDeckInfo(p => ({ ...p, theme: e.target.value })); saveDeckInfo() }}
            className="w-full text-sm text-gray-600 bg-transparent focus:outline-none">
            {THEMES.map(t => <option key={t.id} value={t.id}>{t.emoji} {t.label}</option>)}
          </select>
          <input
            value={deckInfo.description}
            onChange={e => setDeckInfo(p => ({ ...p, description: e.target.value }))}
            onBlur={saveDeckInfo}
            placeholder="Description (optionnelle)"
            className="w-full text-xs text-gray-400 bg-transparent focus:outline-none"
          />
        </div>

        {/* ── Section Critères ── */}
        <Section
          title={`Critères · ${criteria.length}`}
          isOpen={openSection === 'criteria'}
          onToggle={() => setOpenSection(s => s === 'criteria' ? null : 'criteria')}
          action={<button onClick={openNewCriterion}
            className="text-xs px-2 py-1 bg-gray-900 text-white rounded-lg font-medium">
            + Ajouter
          </button>}>

          <div className="space-y-2 pt-1">
            {criteria.map(c => (
              <div key={c.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="flex items-center gap-3 px-3 py-2.5">
                  <span className="text-base">{c.type === 'image' ? '🖼️' : '📝'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{c.name}</p>
                    {c.question_title && (
                      <p className="text-xs text-gray-400 truncate">{c.question_title}</p>
                    )}
                  </div>
                  {/* Toggle interrogeable */}
                  <button onClick={() => toggleInterrogeable(c)}
                    className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                      c.interrogeable !== false
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'bg-gray-100 text-gray-400'
                    }`}>
                    {c.interrogeable !== false ? '❓ question' : '💡 réponse'}
                  </button>
                  <button onClick={() => openEditCriterion(c)} className="text-gray-300 hover:text-gray-600 flex-shrink-0">
                    ✏️
                  </button>
                  <button onClick={() => deleteCriterion(c.id)} className="text-gray-300 hover:text-red-400 flex-shrink-0">
                    <X size={14} />
                  </button>
                </div>

                {/* Formulaire édition critère inline */}
                {editingCriterion?.id === c.id && (
                  <CriterionForm
                    form={criterionForm}
                    onChange={setCriterionForm}
                    onSave={saveCriterion}
                    onCancel={() => setEditingCriterion(null)}
                  />
                )}
              </div>
            ))}

            {/* Nouvelle carte critère */}
            {editingCriterion?.id === null && (
              <div className="bg-white rounded-xl border border-gray-200">
                <CriterionForm
                  form={criterionForm}
                  onChange={setCriterionForm}
                  onSave={saveCriterion}
                  onCancel={() => setEditingCriterion(null)}
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
          action={<button onClick={openNewCard}
            className="text-xs px-2 py-1 bg-gray-900 text-white rounded-lg font-medium">
            + Ajouter
          </button>}>

          {/* Formulaire nouvelle carte */}
          {editingCard?.id === null && (
            <div className="bg-white rounded-xl border border-gray-200 mb-3 overflow-hidden">
              <div className="px-3 pt-3 pb-1">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Nouvelle carte</p>
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
              />
            </div>
          )}

          <div className="space-y-2">
            {cards.map(card => {
              const thumb = getCardThumb(card)
              const label = getCardLabel(card)
              return (
                <div key={card.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  <div className="flex items-center gap-3 px-3 py-2.5">
                    {thumb ? (
                      <img src={thumb} alt="" className="w-10 h-10 object-cover rounded-lg flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-lg flex-shrink-0">🃏</div>
                    )}
                    <p className="flex-1 text-sm font-medium text-gray-800 truncate">{label}</p>
                    <button onClick={() => openEditCard(card)} className="text-gray-300 hover:text-gray-600">✏️</button>
                    <button onClick={() => deleteCard(card.id)} className="text-gray-300 hover:text-red-400">
                      <X size={14} />
                    </button>
                  </div>

                  {/* Formulaire édition carte inline */}
                  {editingCard?.id === card.id && (
                    <CardForm
                      criteria={criteria}
                      form={cardForm}
                      onChange={setCardForm}
                      onSave={saveCard}
                      onCancel={() => setEditingCard(null)}
                      saving={savingCard}
                      onImageUpload={handleImageUpload}
                      uploadingCriterion={uploadingCriterion}
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

// ── Composant Section repliable ────────────────────────────
function Section({ title, isOpen, onToggle, action, children }) {
  return (
    <div className="mx-4 mt-4">
      <div className="flex items-center justify-between mb-2 px-1">
        <button onClick={onToggle} className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase tracking-widest">
          {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {title}
        </button>
        {action}
      </div>
      {isOpen && children}
    </div>
  )
}

// ── Formulaire critère ─────────────────────────────────────
function CriterionForm({ form, onChange, onSave, onCancel, isNew }) {
  return (
    <div className="px-3 pb-3 pt-2 space-y-2 border-t border-gray-50">
      <div className="flex gap-2">
        <input
          value={form.name}
          onChange={e => onChange(p => ({ ...p, name: e.target.value }))}
          placeholder="Nom du critère (ex: drapeau)"
          className="flex-1 text-sm px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-gray-400"
        />
        <select
          value={form.type}
          onChange={e => onChange(p => ({ ...p, type: e.target.value }))}
          className="text-sm px-2 py-2 rounded-xl border border-gray-200 focus:outline-none bg-white">
          <option value="text">📝 texte</option>
          <option value="image">🖼️ image</option>
        </select>
      </div>
      <input
        value={form.question_title}
        onChange={e => onChange(p => ({ ...p, question_title: e.target.value }))}
        placeholder="Question posée (ex: Quel est ce pays ?)"
        className="w-full text-sm px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-gray-400"
      />
      <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
        <input
          type="checkbox"
          checked={form.interrogeable}
          onChange={e => onChange(p => ({ ...p, interrogeable: e.target.checked }))}
          className="accent-indigo-500"
        />
        Utilisé comme question (interrogeable)
      </label>
      <div className="flex gap-2 pt-1">
        <button onClick={onSave} disabled={!form.name.trim()}
          className="flex-1 py-2 bg-gray-900 text-white rounded-xl text-sm font-semibold disabled:opacity-30">
          {isNew ? 'Ajouter' : 'Sauvegarder'}
        </button>
        <button onClick={onCancel}
          className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm">
          Annuler
        </button>
      </div>
    </div>
  )
}

// ── Formulaire carte ───────────────────────────────────────
function CardForm({ criteria, form, onChange, onSave, onCancel, saving, onImageUpload, uploadingCriterion }) {
  return (
    <div className="px-3 pb-3 pt-1 space-y-2 border-t border-gray-50">
      {criteria.map(c => (
        <div key={c.id}>
          <label className="text-xs text-gray-400 mb-1 block capitalize">{c.name}</label>
          {c.type === 'image' ? (
            <div className="space-y-1.5">
              {form[c.id] && (
                <img src={form[c.id]} alt="" className="h-20 object-contain rounded-xl border border-gray-100" />
              )}
              <div className="flex gap-2">
                <label className="flex-1 flex items-center justify-center gap-2 py-2 bg-gray-100 rounded-xl text-sm text-gray-600 cursor-pointer active:scale-95 transition-transform">
                  <Camera size={14} />
                  {uploadingCriterion === c.id ? 'Upload…' : 'Photo'}
                  <input type="file" accept="image/*" capture="environment" className="hidden"
                    onChange={e => onImageUpload(e, c.id)} />
                </label>
                <input
                  value={form[c.id] || ''}
                  onChange={e => onChange(p => ({ ...p, [c.id]: e.target.value }))}
                  placeholder="ou coller une URL…"
                  className="flex-1 text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none"
                />
              </div>
              {form[c.id] && (
                <a href={`https://fr.wikipedia.org/wiki/${encodeURIComponent(form[c.id])}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-blue-400">
                  <ExternalLink size={11} /> Chercher sur Wikipédia
                </a>
              )}
            </div>
          ) : (
            <input
              value={form[c.id] || ''}
              onChange={e => onChange(p => ({ ...p, [c.id]: e.target.value }))}
              placeholder={c.question_title || c.name}
              className="w-full text-sm px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-gray-400"
            />
          )}
        </div>
      ))}
      <div className="flex gap-2 pt-1">
        <button onClick={onSave} disabled={saving}
          className="flex-1 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold disabled:opacity-50 active:scale-95 transition-transform">
          {saving ? 'Sauvegarde…' : 'Sauvegarder'}
        </button>
        <button onClick={onCancel}
          className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm">
          Annuler
        </button>
      </div>
    </div>
  )
}