import { useState, useEffect } from 'react'
import { supabase } from '../../supabase'

export default function MemoireWidget({ profile, onClick, dark }) {
  const [dueCount, setDueCount] = useState(null)
  const [deckCount, setDeckCount] = useState(0)

  useEffect(() => {
    if (!profile) return

    try {
      const stored = JSON.parse(localStorage.getItem(`memoire-active-decks-${profile.id}`) || '[]')
      setDeckCount(Array.isArray(stored) ? stored.length : 0)
    } catch { setDeckCount(0) }

    supabase.from('card_progress')
      .select('id', { count: 'exact', head: true })
      .eq('profile_id', profile.id)
      .lte('next_review', new Date().toISOString())
      .lt('level', 4)
      .then(({ count }) => setDueCount(count ?? 0))
  }, [profile])

  const loaded = dueCount !== null
  const allGood = loaded && dueCount === 0

  return (
    <button onClick={onClick}
      className="w-full rounded-2xl p-3.5 text-left active:scale-95 transition-all flex items-center gap-3"
      style={{
        background: dark ? '#1a1035' : '#fff',
        border: `0.5px solid ${dark ? '#2d1f5e' : '#ede9fe'}`,
        borderLeft: '3px solid #6A9BCC',
      }}>
      <span className="text-2xl flex-shrink-0">🐒</span>
      <div className="min-w-0 flex-1">
        {!loaded ? (
          <p className="text-sm" style={{ color: dark ? '#c4b5fd' : '#9ca3af' }}>Chargement…</p>
        ) : allGood ? (
          <>
            <p className="text-sm font-semibold" style={{ color: '#22c55e' }}>Tout est à jour ✓</p>
            {deckCount > 0 && (
              <p className="text-[11px] mt-0.5" style={{ color: dark ? '#7c6fad' : '#a78bfa' }}>
                {deckCount} deck{deckCount > 1 ? 's' : ''} actif{deckCount > 1 ? 's' : ''}
              </p>
            )}
          </>
        ) : (
          <>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold leading-none" style={{ color: dark ? '#e9d5ff' : '#1e0a3c' }}>
                {dueCount}
              </span>
              <span className="text-[11px]" style={{ color: dark ? '#c4b5fd' : '#6b7280' }}>
                carte{dueCount > 1 ? 's' : ''} à réviser
              </span>
            </div>
            {deckCount > 0 && (
              <p className="text-[11px] mt-0.5" style={{ color: dark ? '#7c6fad' : '#a78bfa' }}>
                {deckCount} deck{deckCount > 1 ? 's' : ''} actif{deckCount > 1 ? 's' : ''}
              </p>
            )}
          </>
        )}
      </div>
      {loaded && !allGood && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: '#6A9BCC22' }}>
          <span className="text-xs font-bold" style={{ color: '#6A9BCC' }}>›</span>
        </div>
      )}
    </button>
  )
}
