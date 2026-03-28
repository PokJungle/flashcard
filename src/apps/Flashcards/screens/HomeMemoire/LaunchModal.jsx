import { useState } from 'react'
import { X } from 'lucide-react'
import { useThemeColors } from '../../../../hooks/useThemeColors'
import BottomModal from '../../../../components/BottomModal'
import { getSessionMode, setSessionMode } from '../../services/progressStorage'

const SESSION_MODES = [
  { id: 'rapide',   label: '10',   emoji: '🐇', limit: 10   },
  { id: 'normal',   label: '20',   emoji: '🐒', limit: 20   },
  { id: 'marathon', label: 'Tout', emoji: '🐘', limit: null },
]

export default function LaunchModal({ deck, stats, color, dark, onClose, onStart }) {
  const { todo = 0, neverSeen = 0, ahead = 0 } = stats
  const [mode, setMode] = useState(getSessionMode(deck.id))

  const compose = (limit) => {
    const max = limit ?? Infinity
    const t = Math.min(todo,      max)
    const n = Math.min(neverSeen, Math.max(0, max - t))
    const a = Math.min(ahead,     Math.max(0, max - t - n))
    return { todo: t, neverSeen: n, ahead: a, total: t + n + a }
  }

  const comps = Object.fromEntries(SESSION_MODES.map(m => [m.id, compose(m.limit)]))
  const sel   = comps[mode]

  const handleStart = () => {
    setSessionMode(deck.id, mode)
    onStart(SESSION_MODES.find(m => m.id === mode).limit)
  }

  const { card: cardBg, border, textPri, textSec } = useThemeColors(dark)

  return (
    <BottomModal open onClose={onClose} dark={dark} cardBg={cardBg}>
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
        {SESSION_MODES.map(m => {
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
    </BottomModal>
  )
}
