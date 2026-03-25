import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../../supabase'

const MASTERED_LEVEL = 4  // 2× Facile minimum

export function useMemoire(profile) {
  const [decks, setDecks]             = useState([])
  const [dueMap, setDueMap]           = useState({})
  const [progressMap, setProgressMap] = useState({})
  // progressMap[deck_id] = [
  //   { criterionId, name, total, mastered, pct },
  //   ...
  // ]
  const [totalDue, setTotalDue]       = useState(0)
  const [loading, setLoading]         = useState(true)

  const loadDecks = useCallback(async () => {
    if (!profile) return
    setLoading(true)

    const [
      { data: decksData },
      { data: criteriaData },
      { data: progressData },
      { data: cardsData },
    ] = await Promise.all([
      supabase.from('decks').select('*').order('created_at'),
      supabase.from('deck_criteria').select('id, deck_id, name, type, interrogeable, position').order('position'),
      supabase.from('card_progress').select('card_id, criterion_id, next_review, level').eq('profile_id', profile.id),
      supabase.from('cards').select('id, deck_id'),
    ])

    if (!decksData) { setLoading(false); return }

    const now = new Date()

    // Map progress : "card_id|criterion_id" → { next_review, level }
    const progMap = {}
    for (const p of (progressData || [])) {
      progMap[`${p.card_id}|${p.criterion_id}`] = p
    }

    // Critères par deck — séparés en interrogeables et tous
    const criteriaByDeck = {}
    for (const c of (criteriaData || [])) {
      if (!criteriaByDeck[c.deck_id]) criteriaByDeck[c.deck_id] = []
      criteriaByDeck[c.deck_id].push(c)
    }

    // Cartes par deck
    const cardsByDeck = {}
    for (const c of (cardsData || [])) {
      if (!cardsByDeck[c.deck_id]) cardsByDeck[c.deck_id] = []
      cardsByDeck[c.deck_id].push(c.id)
    }

    const newDueMap      = {}
    const newProgressMap = {}
    let totalDueCount    = 0

    for (const deck of decksData) {
      const cards    = cardsByDeck[deck.id]    || []
      const criteria = criteriaByDeck[deck.id] || []

      // Critères interrogeables uniquement (exclure verso et interrogeable=false)
      const activeCriteria = criteria.filter(
        c => c.name !== 'verso' && c.interrogeable !== false
      )

      let due = 0

      // Stats par critère interrogeable
      const criteriaStats = activeCriteria.map(crit => {
        let total    = 0
        let mastered = 0
        let critDue  = 0

        for (const cardId of cards) {
          const key  = `${cardId}|${crit.id}`
          const prog = progMap[key]
          total++
          if (!prog || new Date(prog.next_review) <= now) critDue++
          if (prog && prog.level >= MASTERED_LEVEL) mastered++
        }

        due += critDue

        return {
          criterionId: crit.id,
          name:        crit.name,
          type:        crit.type,
          total,
          mastered,
          pct: total > 0 ? Math.round((mastered / total) * 100) : 0,
        }
      })

      newDueMap[deck.id]      = due
      totalDueCount          += due
      newProgressMap[deck.id] = criteriaStats
    }

    setDecks(decksData)
    setDueMap(newDueMap)
    setProgressMap(newProgressMap)
    setTotalDue(totalDueCount)
    setLoading(false)
  }, [profile])

  useEffect(() => { loadDecks() }, [loadDecks])

  return { decks, dueMap, progressMap, totalDue, loading, reload: loadDecks }
}