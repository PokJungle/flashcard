import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../../supabase'

const NEW_PER_DAY_KEY     = (deckId) => `memoire-new-per-day-${deckId}`
const NEW_SEEN_KEY        = (deckId) => `memoire-new-seen-${deckId}-${new Date().toISOString().slice(0,10)}`
const NEW_PER_DAY_DEFAULT = 10

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

      // Quota journalier
      const newPerDay     = parseInt(localStorage.getItem(NEW_PER_DAY_KEY(deck.id)) || NEW_PER_DAY_DEFAULT)
      const newSeenKey    = NEW_SEEN_KEY(deck.id)
      const doneTodayKey  = `memoire-done-today-${deck.id}-${new Date().toISOString().slice(0,10)}`
      const doneToday     = parseInt(localStorage.getItem(doneTodayKey) || '0')
      const newSeenToday  = parseInt(localStorage.getItem(newSeenKey) || '0')
      const quota         = newPerDay === 999 ? Infinity : newPerDay

      // Compter en QUESTIONS (items = carte × critère), pas en cartes
      let todoCount      = 0  // questions en retard
      let neverSeenCount = 0  // questions jamais vues
      let aheadCount     = 0  // questions en avance

      for (const cardId of cards) {
        for (const crit of activeCriteria) {
          const prog = progMap[`${cardId}|${crit.id}`]
          if (!prog) {
            neverSeenCount++
          } else if (new Date(prog.next_review) <= now) {
            todoCount++
          } else {
            aheadCount++
          }
        }
      }

      // Badge = min(quota - doneToday, questions à faire + jamais vues)
      const remaining = Math.max(0, quota - doneToday)
      const available = todoCount + neverSeenCount
      const due       = Math.min(remaining, available)

      // Stats par critère (barres de progression)
      const criteriaStats = activeCriteria.map(crit => {
        let total = 0, mastered = 0
        for (const cardId of cards) {
          const prog = progMap[`${cardId}|${crit.id}`]
          total++
          if (prog && prog.level >= MASTERED_LEVEL) mastered++
        }
        return {
          criterionId: crit.id, name: crit.name, type: crit.type,
          total, mastered,
          pct: total > 0 ? Math.round((mastered / total) * 100) : 0,
        }
      })

      // Stocker les stats détaillées pour le modal (en questions)
      newDueMap[deck.id] = {
        badge:     due,
        todo:      todoCount,
        neverSeen: neverSeenCount,
        ahead:     aheadCount,
        total:     cards.length * activeCriteria.length,
        quota,
        doneToday,
      }
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