import { useState, useEffect } from 'react'
import { supabase } from '../../supabase'

// Réplique les helpers de progressStorage.js
const getTodayKey  = () => new Date().toISOString().slice(0, 10)
const getNewPerDay = (deckId) => {
  try { const v = parseInt(localStorage.getItem(`memoire-new-per-day-${deckId}`)); return isNaN(v) ? 10 : v }
  catch { return 10 }
}
const getDoneToday = (deckId) => {
  try { const v = parseInt(localStorage.getItem(`memoire-done-today-${deckId}-${getTodayKey()}`)); return isNaN(v) ? 0 : v }
  catch { return 0 }
}

export default function MemoireWidget({ profile, onClick, dark }) {
  const [dueCount, setDueCount] = useState(null)

  useEffect(() => {
    if (!profile) return
    const now = new Date()

    Promise.all([
      supabase.from('decks').select('id'),
      supabase.from('cards').select('id, deck_id'),
      supabase.from('deck_criteria').select('id, deck_id, name, interrogeable'),
      supabase.from('card_progress')
        .select('card_id, criterion_id, next_review, level')
        .eq('profile_id', profile.id),
    ]).then(([decksRes, cardsRes, criteriaRes, progressRes]) => {
      const decks    = decksRes.data    || []
      const cards    = cardsRes.data    || []
      const criteria = criteriaRes.data || []
      const progress = progressRes.data || []

      const progMap = {}
      progress.forEach(p => { progMap[`${p.card_id}|${p.criterion_id}`] = p })

      // Critères actifs par deck (même filtre que getActiveCriteria)
      const critByDeck = {}
      criteria.forEach(c => {
        if (c.interrogeable !== false && c.name !== 'verso') {
          if (!critByDeck[c.deck_id]) critByDeck[c.deck_id] = []
          critByDeck[c.deck_id].push(c.id)
        }
      })

      const cardsByDeck = {}
      cards.forEach(c => {
        if (!cardsByDeck[c.deck_id]) cardsByDeck[c.deck_id] = []
        cardsByDeck[c.deck_id].push(c.id)
      })

      let total = 0
      decks.forEach(deck => {
        const deckCards = cardsByDeck[deck.id] || []
        const deckCrits = critByDeck[deck.id]  || []
        const quota     = getNewPerDay(deck.id)
        const doneToday = getDoneToday(deck.id)
        const remaining = quota === 999 ? Infinity : Math.max(0, quota - doneToday)

        let todo = 0, neverSeen = 0
        deckCards.forEach(cardId => {
          deckCrits.forEach(critId => {
            const prog = progMap[`${cardId}|${critId}`]
            if (!prog) neverSeen++
            else if (prog.level < 4 && new Date(prog.next_review) <= now) todo++
          })
        })

        const due = Math.min(remaining, todo + neverSeen)
        total += due
      })

      setDueCount(total)
    })
  }, [profile])

  const loaded  = dueCount !== null
  const allGood = loaded && dueCount === 0

  return (
    <button onClick={onClick}
      className="flex-1 rounded-xl px-3 py-2.5 text-left active:scale-95 transition-all flex items-center gap-2"
      style={{
        background: dark ? '#1a1035' : '#fff',
        borderTop: `0.5px solid ${dark ? '#2d1f5e' : '#ede9fe'}`,
        borderRight: `0.5px solid ${dark ? '#2d1f5e' : '#ede9fe'}`,
        borderBottom: `0.5px solid ${dark ? '#2d1f5e' : '#ede9fe'}`,
        borderLeft: '3px solid #6A9BCC',
      }}>
      <span className="text-xl flex-shrink-0">🐒</span>
      <div className="min-w-0 flex-1">
        {!loaded ? (
          <p className="text-xs" style={{ color: dark ? '#c4b5fd' : '#9ca3af' }}>Chargement…</p>
        ) : allGood ? (
          <p className="text-xs font-semibold" style={{ color: '#22c55e' }}>Tout est à jour ✓</p>
        ) : (
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold leading-none" style={{ color: dark ? '#e9d5ff' : '#1e0a3c' }}>
              {dueCount}
            </span>
            <span className="text-[11px]" style={{ color: dark ? '#c4b5fd' : '#6b7280' }}>
              carte{dueCount > 1 ? 's' : ''} à réviser
            </span>
          </div>
        )}
      </div>
    </button>
  )
}
