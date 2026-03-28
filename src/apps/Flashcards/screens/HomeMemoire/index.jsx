import { useState } from 'react'
import { Upload, Plus } from 'lucide-react'
import { supabase } from '../../../../supabase'
import { THEMES, THEME_COLOR } from '../../constants'
import { useThemeColors } from '../../../../hooks/useThemeColors'
import { ls } from '../../../../utils/localStorage'
import DeckCard from './DeckCard'
import NewDeckModal from './NewDeckModal'
import LaunchModal from './LaunchModal'

const ACTIVE_DECKS_KEY = (profileId) => `memoire-active-decks-${profileId}`

export default function HomeMemoire({
  profile, decks, dueMap, progressMap, loading, dark,
  onStartDeck, onManageDeck, onShowUpload, onDeckCreated,
}) {
  const [filterMode, setFilterMode]   = useState(false)
  const [showNewDeck, setShowNewDeck] = useState(false)
  const [launchDeck, setLaunchDeck]   = useState(null)

  const [activeDecks, setActiveDecks] = useState(() => ls.get(ACTIVE_DECKS_KEY(profile.id)))

  const isActive = (deckId) => activeDecks === null || activeDecks.includes(deckId)

  const toggleDeck = (deckId) => {
    setActiveDecks(prev => {
      const current = prev === null ? decks.map(d => d.id) : [...prev]
      const next = current.includes(deckId)
        ? current.filter(id => id !== deckId)
        : [...current, deckId]
      const allActive = decks.every(d => next.includes(d.id))
      const result = allActive ? null : next
      ls.set(ACTIVE_DECKS_KEY(profile.id), result)
      return result
    })
  }

  const activeTotalDue = decks
    .filter(d => isActive(d.id))
    .reduce((sum, d) => sum + (dueMap[d.id]?.badge ?? dueMap[d.id] ?? 0), 0)

  const themesPresents = THEMES.filter(t => decks.some(d => d.theme === t.id))

  const { bg, textSec } = useThemeColors(dark)

  return (
    <div className="flex-1 overflow-y-auto pb-4" style={{ background: bg }}>
      <div className="px-4 pt-4 max-w-lg mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1">
            {activeTotalDue > 0 && !filterMode && (
              <div className="rounded-2xl px-4 py-2.5 flex items-center gap-3"
                style={{ background: dark ? '#1a2744' : '#E6F1FB', border: `0.5px solid ${dark ? '#2d4a8a' : '#B5D4F4'}` }}>
                <span style={{ fontSize: 18 }}>🧠</span>
                <p className="text-sm font-semibold" style={{ color: dark ? '#93c5fd' : '#185FA5' }}>
                  {activeTotalDue} critère{activeTotalDue > 1 ? 's' : ''} à réviser
                </p>
              </div>
            )}
            {filterMode && (
              <p className="text-sm font-semibold" style={{ color: dark ? '#e9d5ff' : '#374151' }}>Mes decks actifs</p>
            )}
          </div>
          <div className="flex gap-2 ml-3 flex-shrink-0">
            <button
              onClick={() => setFilterMode(f => !f)}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
              style={{
                background: filterMode ? '#533AB7' : (dark ? '#2d1f5e' : '#f3f4f6'),
                color: filterMode ? 'white' : textSec,
              }}>
              ⚙️
            </button>
          </div>
        </div>

        {!loading && decks.length === 0 && (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">🎴</div>
            <p className="font-medium mb-1" style={{ color: dark ? '#c4b5fd' : '#6b7280' }}>Aucun jeu disponible</p>
            <p className="text-sm mb-4" style={{ color: textSec }}>Crée un deck ou importe un fichier JSON</p>
            <button onClick={() => setShowNewDeck(true)}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: dark ? '#7c3aed' : '#111827' }}>
              + Créer un deck
            </button>
          </div>
        )}

        {themesPresents.map(t => (
          <div key={t.id} className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: textSec }}>
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
                    dark={dark}
                    onStart={() => !filterMode && setLaunchDeck(deck)}
                    onManage={() => !filterMode && onManageDeck(deck)}
                    onToggle={() => toggleDeck(deck.id)}
                  />
                )
              })}
            </div>
          </div>
        ))}

        {filterMode && (
          <p className="text-center text-xs pb-4" style={{ color: textSec }}>
            Les decks désactivés restent visibles mais sans notifications ni progression
          </p>
        )}
      </div>

      {/* FAB */}
      <div className="fixed bottom-20 right-5 flex flex-col gap-2 z-40">
        <button
          onClick={() => setShowNewDeck(true)}
          className="w-12 h-12 rounded-full shadow-md flex items-center justify-center active:scale-95 transition-transform"
          style={{
            background: dark ? '#1a1035' : '#ffffff',
            border: `1px solid ${dark ? '#4338ca' : '#e5e7eb'}`,
            color: dark ? '#c4b5fd' : '#374151',
          }}>
          <Plus size={18} />
        </button>
        <button
          onClick={onShowUpload}
          className="w-12 h-12 rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform text-white"
          style={{ background: dark ? '#7c3aed' : '#111827' }}>
          <Upload size={18} />
        </button>
      </div>

      {launchDeck && (
        <LaunchModal
          deck={launchDeck}
          stats={dueMap[launchDeck.id] || { badge: 0, todo: 0, neverSeen: 0, ahead: 0, total: 0 }}
          color={THEME_COLOR[launchDeck.theme] || '#7A7A8A'}
          dark={dark}
          onClose={() => setLaunchDeck(null)}
          onStart={(limit) => { setLaunchDeck(null); onStartDeck(launchDeck, limit) }}
        />
      )}

      {showNewDeck && (
        <NewDeckModal
          dark={dark}
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
