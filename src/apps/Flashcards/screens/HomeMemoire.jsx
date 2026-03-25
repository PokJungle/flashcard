import { useState } from 'react'
import { Upload, Settings, Plus, X, Check } from 'lucide-react'
import { supabase } from '../../../supabase'
import { THEMES, THEME_COLOR } from '../constants'

const ACTIVE_DECKS_KEY = (profileId) => `memoire-active-decks-${profileId}`

export default function HomeMemoire({
  profile, decks, dueMap, progressMap, totalDue, loading,
  onStartDeck, onManageDeck, onShowUpload, onDeckCreated,
}) {
  const [filterMode, setFilterMode]   = useState(false)
  const [showNewDeck, setShowNewDeck] = useState(false)

  // Decks actifs par profil — localStorage
  const getActiveDecks = () => {
    try { return JSON.parse(localStorage.getItem(ACTIVE_DECKS_KEY(profile.id)) || 'null') }
    catch { return null }
  }
  const [activeDecks, setActiveDecks] = useState(() => getActiveDecks())
  // null = tous actifs (défaut), sinon Set d'IDs actifs

  const isActive = (deckId) => activeDecks === null || activeDecks.includes(deckId)

  const toggleDeck = (deckId) => {
    setActiveDecks(prev => {
      const current = prev === null ? decks.map(d => d.id) : [...prev]
      const next = current.includes(deckId)
        ? current.filter(id => id !== deckId)
        : [...current, deckId]
      // Si tous actifs → revenir à null (défaut)
      const allActive = decks.every(d => next.includes(d.id))
      const result = allActive ? null : next
      localStorage.setItem(ACTIVE_DECKS_KEY(profile.id), JSON.stringify(result))
      return result
    })
  }

  // Due count uniquement sur les decks actifs
  const activeTotalDue = decks
    .filter(d => isActive(d.id))
    .reduce((sum, d) => sum + (dueMap[d.id] ?? 0), 0)

  const themesPresents = THEMES.filter(t => decks.some(d => d.theme === t.id))

  return (
    <div className="flex-1 overflow-y-auto pb-4">
      <div className="px-4 pt-4 max-w-lg mx-auto">

        {/* Header avec boutons action */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1">
            {activeTotalDue > 0 && !filterMode && (
              <div className="rounded-2xl px-4 py-2.5 flex items-center gap-3"
                style={{ background: '#E6F1FB', border: '0.5px solid #B5D4F4' }}>
                <span style={{ fontSize: 18 }}>🧠</span>
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#185FA5' }}>
                    {activeTotalDue} critère{activeTotalDue > 1 ? 's' : ''} à réviser
                  </p>
                </div>
              </div>
            )}
            {filterMode && (
              <p className="text-sm font-semibold text-gray-700">Mes decks actifs</p>
            )}
          </div>
          <div className="flex gap-2 ml-3 flex-shrink-0">
            <button
              onClick={() => setFilterMode(f => !f)}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
              style={{
                background: filterMode ? '#533AB7' : 'var(--color-background-secondary)',
                color: filterMode ? 'white' : 'var(--color-text-secondary)',
              }}>
              <Settings size={16} />
            </button>
          </div>
        </div>

        {!loading && decks.length === 0 && (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">🎴</div>
            <p className="text-gray-500 font-medium mb-1">Aucun jeu disponible</p>
            <p className="text-gray-400 text-sm mb-4">Crée un deck ou importe un fichier JSON</p>
            <button onClick={() => setShowNewDeck(true)}
              className="px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold">
              + Créer un deck
            </button>
          </div>
        )}

        {/* Decks par thème */}
        {themesPresents.map(t => (
          <div key={t.id} className="mb-5">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
              {t.emoji} {t.label}
            </h2>
            <div className="space-y-2">
              {decks.filter(d => d.theme === t.id).map(deck => {
                const active = isActive(deck.id)
                return (
                  <DeckCard
                    key={deck.id}
                    deck={deck}
                    themeEmoji={t.emoji}
                    due={active ? (dueMap[deck.id] ?? 0) : 0}
                    criteria={active ? (progressMap[deck.id] || []) : []}
                    color={THEME_COLOR[deck.theme] || '#7A7A8A'}
                    active={active}
                    filterMode={filterMode}
                    onStart={() => !filterMode && onStartDeck(deck)}
                    onManage={() => !filterMode && onManageDeck(deck)}
                    onToggle={() => toggleDeck(deck.id)}
                  />
                )
              })}
            </div>
          </div>
        ))}

        {filterMode && (
          <p className="text-center text-xs text-gray-400 pb-4">
            Les decks désactivés restent visibles mais sans notifications ni progression
          </p>
        )}
      </div>

      {/* FAB — + Deck et Upload */}
      <div className="fixed bottom-20 right-5 flex flex-col gap-2 z-40">
        <button
          onClick={() => setShowNewDeck(true)}
          className="w-12 h-12 bg-white text-gray-700 rounded-full shadow-md border border-gray-200 flex items-center justify-center active:scale-95 transition-transform">
          <Plus size={18} />
        </button>
        <button
          onClick={onShowUpload}
          className="w-12 h-12 bg-gray-900 text-white rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform">
          <Upload size={18} />
        </button>
      </div>

      {/* Modal nouveau deck */}
      {showNewDeck && (
        <NewDeckModal
          onClose={() => setShowNewDeck(false)}
          onCreate={async (data) => {
            const { data: deck } = await supabase
              .from('decks')
              .insert({ name: data.name.trim(), theme: data.theme, description: data.description.trim() })
              .select().single()
            setShowNewDeck(false)
            onDeckCreated(deck)
          }}
        />
      )}
    </div>
  )
}

// ── DeckCard ───────────────────────────────────────────────
function DeckCard({ deck, themeEmoji, due, criteria, color, active, filterMode, onStart, onManage, onToggle }) {
  const hasProgress = active && criteria.some(c => c.total > 0)
  const globalPct   = hasProgress
    ? Math.round(criteria.reduce((s, c) => s + c.pct, 0) / criteria.length)
    : 0

  return (
    <div className="rounded-2xl border shadow-sm overflow-hidden relative transition-opacity"
      style={{
        background: 'white',
        borderColor: active ? '#f3f4f6' : '#e5e7eb',
        opacity: active ? 1 : 0.5,
      }}>

      {/* Barre de fond globale */}
      {globalPct > 0 && (
        <div className="absolute top-0 left-0 bottom-0 rounded-2xl transition-all duration-700 pointer-events-none"
          style={{ width: `${globalPct}%`, background: globalPct >= 80 ? 'rgba(99,153,34,0.12)' : color + '28' }}
        />
      )}

      <div className="relative">
        <div className="flex items-center gap-3 px-4 pt-3 pb-2">

          {/* Icône thème ou toggle en mode filtre */}
          {filterMode ? (
            <button onClick={onToggle}
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all active:scale-95"
              style={{ background: active ? color + '18' : '#f3f4f6' }}>
              {active
                ? <Check size={16} style={{ color }} />
                : <X size={16} className="text-gray-400" />
              }
            </button>
          ) : (
            <button onClick={onStart}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 active:scale-95 transition-transform"
              style={{ background: color + '18' }}>
              {themeEmoji}
            </button>
          )}

          <button onClick={filterMode ? onToggle : onStart}
            className="flex-1 min-w-0 text-left active:scale-95 transition-transform">
            <p className="font-semibold text-sm truncate" style={{ color: active ? '#111827' : '#6b7280' }}>
              {deck.name}
            </p>
            {deck.description && (
              <p className="text-xs text-gray-400 truncate mt-0.5">{deck.description}</p>
            )}
          </button>

          {/* Badge dues ou statut filtre */}
          {!filterMode && (
            due > 0 ? (
              <span className="text-xs font-semibold px-2 py-1 rounded-lg flex-shrink-0"
                style={{ background: '#E6F1FB', color: '#185FA5' }}>
                {due} {due === 1 ? 'due' : 'dues'}
              </span>
            ) : active ? (
              <span className="text-xs text-gray-300 flex-shrink-0">À jour</span>
            ) : null
          )}
          {filterMode && (
            <span className="text-xs font-medium px-2 py-1 rounded-lg flex-shrink-0"
              style={{
                background: active ? color + '15' : '#f3f4f6',
                color: active ? color : '#9ca3af',
              }}>
              {active ? 'actif' : 'inactif'}
            </span>
          )}

          {!filterMode && (
            <button onClick={onManage}
              className="p-1.5 text-gray-300 hover:text-gray-600 transition-colors flex-shrink-0">
              <Settings size={15} />
            </button>
          )}
        </div>

        {/* Barres par critère */}
        {hasProgress && (
          <div className="px-4 pb-3 space-y-1.5">
            {criteria.map(crit => (
              <div key={crit.criterionId} className="flex items-center gap-2">
                <span className="text-xs text-gray-400 capitalize flex-shrink-0" style={{ minWidth: 68 }}>
                  {crit.type === 'image' ? '🖼️' : '📝'} {crit.name}
                </span>
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${crit.pct}%`,
                      background: crit.pct >= 80 ? '#639922' : crit.pct >= 40 ? color : color + '88',
                    }} />
                </div>
                <span className="text-xs tabular-nums flex-shrink-0"
                  style={{
                    minWidth: 28, textAlign: 'right',
                    color: crit.pct >= 80 ? '#639922' : crit.pct >= 40 ? color : '#d1d5db',
                  }}>
                  {crit.pct}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Modal nouveau deck ─────────────────────────────────────
function NewDeckModal({ onClose, onCreate }) {
  const [name, setName]         = useState('')
  const [theme, setTheme]       = useState('autre')
  const [description, setDescription] = useState('')
  const [saving, setSaving]     = useState(false)

  const handleCreate = async () => {
    if (!name.trim()) return
    setSaving(true)
    await onCreate({ name, theme, description })
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={onClose}>
      <div className="bg-white w-full rounded-t-3xl p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-lg text-gray-900">Nouveau deck</h2>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>

        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Nom du deck *"
          autoFocus
          className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:border-gray-400 text-sm font-semibold mb-3"
        />

        <select
          value={theme}
          onChange={e => setTheme(e.target.value)}
          className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none bg-white text-sm mb-3">
          {THEMES.map(t => (
            <option key={t.id} value={t.id}>{t.emoji} {t.label}</option>
          ))}
        </select>

        <input
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Description (optionnelle)"
          className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:border-gray-400 text-sm mb-5"
        />

        <button
          onClick={handleCreate}
          disabled={!name.trim() || saving}
          className="w-full py-4 bg-gray-900 text-white rounded-2xl text-sm font-semibold disabled:opacity-30 active:scale-95 transition-transform">
          {saving ? 'Création…' : 'Créer le deck'}
        </button>
        <p className="text-center text-xs text-gray-400 mt-3">
          Tu pourras ajouter les critères et cartes ensuite
        </p>
      </div>
    </div>
  )
}