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

    const now = new Date()

    Promise.all([
      supabase.from('cards').select('id, deck_id'),
      supabase.from('deck_criteria').select('id, deck_id, interrogeable'),
      supabase.from('card_progress')
        .select('card_id, criterion_id, next_review, level')
        .eq('profile_id', profile.id),
    ]).then(([cardsRes, criteriaRes, progressRes]) => {
      const cards    = cardsRes.data    || []
      const criteria = criteriaRes.data || []
      const progress = progressRes.data || []

      // Map progress : "card_id|criterion_id" → { next_review, level }
      const progMap = {}
      progress.forEach(p => { progMap[`${p.card_id}|${p.criterion_id}`] = p })

      // Critères interrogeables par deck
      const critByDeck = {}
      criteria.forEach(c => {
        if (c.interrogeable !== false) {
          if (!critByDeck[c.deck_id]) critByDeck[c.deck_id] = []
          critByDeck[c.deck_id].push(c.id)
        }
      })

      let due = 0
      cards.forEach(card => {
        const crits = critByDeck[card.deck_id] || []
        crits.forEach(critId => {
          const prog = progMap[`${card.id}|${critId}`]
          if (!prog) {
            due++ // jamais vu
          } else if (prog.level < 4 && new Date(prog.next_review) <= now) {
            due++ // en retard
          }
        })
      })

      setDueCount(due)
    })
  }, [profile])

  const loaded  = dueCount !== null
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
    </button>
  )
}
