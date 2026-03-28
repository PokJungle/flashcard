import { useState } from 'react'
import { Upload, Settings, Plus, X, Check } from 'lucide-react'
import { supabase } from '../../../supabase'
import { THEMES, THEME_COLOR } from '../constants'
import { useThemeColors } from '../../../hooks/useThemeColors'
import { ls } from '../../../utils/localStorage'

const ACTIVE_DECKS_KEY = (profileId) => `memoire-active-decks-${profileId}`

export default function HomeMemoire({
  profile, decks, dueMap, progressMap, totalDue, loading, dark,
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
              <Settings size={16} />
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

// ── DeckCard ───────────────────────────────────────────────
function DeckCard({ deck, themeEmoji, due, criteria, color, active, filterMode, dark, onStart, onManage, onToggle }) {
  const hasProgress = active && criteria.some(c => c.total > 0)
  const globalPct   = hasProgress
    ? Math.round(criteria.reduce((s, c) => s + c.pct, 0) / criteria.length)
    : 0

  const { card: cardBg, textPri, textSec } = useThemeColors(dark)
  const cardBorder = dark ? (active ? '#2d1f5e' : '#1e1040') : (active ? '#f3f4f6' : '#e5e7eb')

  return (
    <div className="rounded-2xl border shadow-sm overflow-hidden relative transition-opacity"
      style={{ background: cardBg, borderColor: cardBorder, opacity: active ? 1 : 0.5 }}>

      {globalPct > 0 && (
        <div className="absolute top-0 left-0 bottom-0 rounded-2xl transition-all duration-700 pointer-events-none"
          style={{ width: `${globalPct}%`, background: globalPct >= 80 ? 'rgba(99,153,34,0.12)' : color + '28' }}
        />
      )}

      <div className="relative">
        <div className="flex items-center gap-3 px-4 pt-3 pb-2">

          {filterMode ? (
            <button onClick={onToggle}
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all active:scale-95"
              style={{ background: active ? color + '18' : (dark ? '#2d1f5e' : '#f3f4f6') }}>
              {active
                ? <Check size={16} style={{ color }} />
                : <X size={16} style={{ color: textSec }} />
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
            <p className="font-semibold text-sm truncate" style={{ color: active ? textPri : textSec }}>
              {deck.name}
            </p>
            {deck.description && (
              <p className="text-xs truncate mt-0.5" style={{ color: textSec }}>{deck.description}</p>
            )}
          </button>

          {!filterMode && (() => {
            const badge = due?.badge ?? due ?? 0
            return badge > 0 ? (
              <span className="text-xs font-semibold px-2 py-1 rounded-lg flex-shrink-0"
                style={{ background: dark ? '#1a2744' : '#E6F1FB', color: dark ? '#93c5fd' : '#185FA5' }}>
                {badge}
              </span>
            ) : active ? (
              <span className="text-xs flex-shrink-0" style={{ color: dark ? '#4338ca' : '#d1d5db' }}>À jour</span>
            ) : null
          })()}

          {filterMode && (
            <span className="text-xs font-medium px-2 py-1 rounded-lg flex-shrink-0"
              style={{
                background: active ? color + '15' : (dark ? '#2d1f5e' : '#f3f4f6'),
                color: active ? color : textSec,
              }}>
              {active ? 'actif' : 'inactif'}
            </span>
          )}

          {!filterMode && (
            <button onClick={onManage} className="p-1.5 transition-colors flex-shrink-0" style={{ color: textSec }}>
              <Settings size={15} />
            </button>
          )}
        </div>

        {hasProgress && (
          <div className="px-4 pb-3 space-y-1.5">
            {criteria.map(crit => (
              <div key={crit.criterionId} className="flex items-center gap-2">
                <span className="text-xs capitalize flex-shrink-0" style={{ minWidth: 68, color: textSec }}>
                  {crit.type === 'image' ? '🖼️' : '📝'} {crit.name}
                </span>
                <div className="flex-1 h-1.5 rounded-full overflow-hidden"
                  style={{ background: dark ? '#2d1f5e' : '#f3f4f6' }}>
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${crit.pct}%`,
                      background: crit.pct >= 80 ? '#639922' : crit.pct >= 40 ? color : color + '88',
                    }} />
                </div>
                <span className="text-xs tabular-nums flex-shrink-0"
                  style={{
                    minWidth: 28, textAlign: 'right',
                    color: crit.pct >= 80 ? '#639922' : crit.pct >= 40 ? color : (dark ? '#4338ca' : '#d1d5db'),
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
function NewDeckModal({ onClose, onCreate, dark }) {
  const [name, setName]               = useState('')
  const [theme, setTheme]             = useState('autre')
  const [description, setDescription] = useState('')
  const [saving, setSaving]           = useState(false)

  const handleCreate = async () => {
    if (!name.trim()) return
    setSaving(true)
    await onCreate({ name, theme, description })
    setSaving(false)
  }

  const { card: cardBg, border, textPri, textSec } = useThemeColors(dark)
  const inputBg = dark ? '#0f0a1e' : '#ffffff'

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={onClose}>
      <div className="w-full rounded-t-3xl p-6" style={{ background: cardBg }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-lg" style={{ color: textPri }}>Nouveau deck</h2>
          <button onClick={onClose}><X size={20} style={{ color: textSec }} /></button>
        </div>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Nom du deck *" autoFocus
          className="w-full px-4 py-3 rounded-2xl text-sm font-semibold mb-3 focus:outline-none"
          style={{ background: inputBg, border: `1px solid ${border}`, color: textPri }} />
        <select value={theme} onChange={e => setTheme(e.target.value)}
          className="w-full px-4 py-3 rounded-2xl text-sm mb-3 focus:outline-none"
          style={{ background: inputBg, border: `1px solid ${border}`, color: textPri }}>
          {THEMES.map(t => <option key={t.id} value={t.id}>{t.emoji} {t.label}</option>)}
        </select>
        <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (optionnelle)"
          className="w-full px-4 py-3 rounded-2xl text-sm mb-5 focus:outline-none"
          style={{ background: inputBg, border: `1px solid ${border}`, color: textPri }} />
        <button onClick={handleCreate} disabled={!name.trim() || saving}
          className="w-full py-4 rounded-2xl text-sm font-semibold text-white disabled:opacity-30 active:scale-95 transition-transform"
          style={{ background: dark ? '#7c3aed' : '#111827' }}>
          {saving ? 'Création…' : 'Créer le deck'}
        </button>
        <p className="text-center text-xs mt-3" style={{ color: textSec }}>
          Tu pourras ajouter les critères et cartes ensuite
        </p>
      </div>
    </div>
  )
}

// ── Modal lancement session ────────────────────────────────
const SESSION_KEY = (deckId) => `memoire-session-mode-${deckId}`

function LaunchModal({ deck, stats, color, dark, onClose, onStart }) {
  const { todo = 0, neverSeen = 0, ahead = 0 } = stats
  const saved = localStorage.getItem(SESSION_KEY(deck.id)) || 'normal'
  const [mode, setMode] = useState(saved)

  const compose = (limit) => {
    const max = limit ?? Infinity
    const t = Math.min(todo,     max)
    const n = Math.min(neverSeen, Math.max(0, max - t))
    const a = Math.min(ahead,    Math.max(0, max - t - n))
    return { todo: t, neverSeen: n, ahead: a, total: t + n + a }
  }

  const MODES = [
    { id: 'rapide',   label: '10',   emoji: '🐇', limit: 10   },
    { id: 'normal',   label: '20',   emoji: '🐒', limit: 20   },
    { id: 'marathon', label: 'Tout', emoji: '🐘', limit: null },
  ]

  const comps = Object.fromEntries(MODES.map(m => [m.id, compose(m.limit)]))
  const sel   = comps[mode]

  const handleStart = () => {
    localStorage.setItem(SESSION_KEY(deck.id), mode)
    onStart(MODES.find(m => m.id === mode).limit)
  }

  const { card: cardBg, border, textPri, textSec } = useThemeColors(dark)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={onClose}>
      <div className="w-full rounded-t-3xl p-6" style={{ background: cardBg }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg" style={{ color: textPri }}>{deck.name}</h2>
          <button onClick={onClose}><X size={20} style={{ color: textSec }} /></button>
        </div>

        <div className="flex gap-2 mb-5 flex-wrap">
          {todo > 0 && <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ background: dark ? '#1a2744' : '#E6F1FB', color: dark ? '#93c5fd' : '#185FA5' }}>
            🔁 {todo} à faire</span>}
          {neverSeen > 0 && <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ background: dark ? '#1a2b1a' : '#EAF3DE', color: dark ? '#86efac' : '#27500A' }}>
            ✨ {neverSeen} jamais vues</span>}
          {ahead > 0 && <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ background: dark ? '#2a2520' : '#F1EFE8', color: dark ? '#d4b896' : '#5F5E5A' }}>
            ⏳ {ahead} en avance</span>}
          {todo === 0 && neverSeen === 0 && ahead === 0 &&
            <span className="text-xs" style={{ color: textSec }}>Rien à réviser pour l'instant</span>}
        </div>

        <div className="flex gap-2 mb-4">
          {MODES.map(m => {
            const c = comps[m.id]
            const isSel = mode === m.id
            return (
              <button key={m.id} onClick={() => setMode(m.id)}
                className="flex-1 py-3 px-1 rounded-2xl text-center transition-all active:scale-95"
                style={{
                  background: isSel ? color + '15' : (dark ? '#0f0a1e' : '#f9fafb'),
                  border: `1px solid ${isSel ? color : border}`,
                }}>
                <p className="text-base font-bold" style={{ color: isSel ? color : textPri }}>{m.emoji} {m.label}</p>
                <p className="text-xs mt-0.5 font-medium" style={{ color: isSel ? color : textSec }}>
                  {c.total} carte{c.total > 1 ? 's' : ''}
                </p>
              </button>
            )
          })}
        </div>

        {sel.total > 0 && (
          <div className="flex gap-1.5 mb-4 flex-wrap">
            {sel.todo > 0 && <span className="text-xs px-2 py-0.5 rounded-md"
              style={{ background: dark ? '#1a2744' : '#E6F1FB', color: dark ? '#93c5fd' : '#185FA5' }}>
              {sel.todo} à faire</span>}
            {sel.neverSeen > 0 && <span className="text-xs px-2 py-0.5 rounded-md"
              style={{ background: dark ? '#1a2b1a' : '#EAF3DE', color: dark ? '#86efac' : '#27500A' }}>
              {sel.neverSeen} jamais vues</span>}
            {sel.ahead > 0 && <span className="text-xs px-2 py-0.5 rounded-md"
              style={{ background: dark ? '#2a2520' : '#F1EFE8', color: dark ? '#d4b896' : '#5F5E5A' }}>
              {sel.ahead} en avance</span>}
          </div>
        )}

        {sel.total === 0 ? (
          <button onClick={onClose} className="w-full py-4 rounded-2xl text-sm font-semibold"
            style={{ background: dark ? '#2d1f5e' : '#f3f4f6', color: textSec }}>
            Revenir plus tard
          </button>
        ) : (
          <button onClick={handleStart}
            className="w-full py-4 rounded-2xl text-white text-sm font-semibold active:scale-95 transition-transform"
            style={{ background: color }}>
            Lancer · {sel.total} carte{sel.total > 1 ? 's' : ''} →
          </button>
        )}
      </div>
    </div>
  )
}