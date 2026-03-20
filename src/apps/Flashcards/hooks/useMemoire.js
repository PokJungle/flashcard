import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../../supabase'

/**
 * Charge les decks avec le nombre de critères dus par deck pour le profil courant.
 * Un "critère dû" = (card_id, criterion_id) dont next_review <= now OU jamais vu.
 */
export function useMemoire(profile) {
  const [decks, setDecks]         = useState([])
  const [dueMap, setDueMap]       = useState({})   // { deck_id: count }
  const [totalDue, setTotalDue]   = useState(0)
  const [loading, setLoading]     = useState(true)

  const loadDecks = useCallback(async () => {
    if (!profile) return
    setLoading(true)

    // 1. Charger tous les decks
    const { data: decksData } = await supabase
      .from('decks')
      .select('*')
      .order('created_at')

    if (!decksData) { setLoading(false); return }

    // 2. Charger tous les critères
    const { data: criteriaData } = await supabase
      .from('deck_criteria')
      .select('id, deck_id')

    // 3. Charger la progression du profil
    const { data: progressData } = await supabase
      .from('card_progress')
      .select('card_id, criterion_id, next_review')
      .eq('profile_id', profile.id)

    // 4. Charger toutes les cartes (juste les ids par deck)
    const { data: cardsData } = await supabase
      .from('cards')
      .select('id, deck_id')

    const now = new Date()

    // Map progress : clé = "card_id|criterion_id" → next_review
    const progressMap = {}
    for (const p of (progressData || [])) {
      progressMap[`${p.card_id}|${p.criterion_id}`] = new Date(p.next_review)
    }

    // Critères par deck
    const criteriaByDeck = {}
    for (const c of (criteriaData || [])) {
      if (!criteriaByDeck[c.deck_id]) criteriaByDeck[c.deck_id] = []
      criteriaByDeck[c.deck_id].push(c.id)
    }

    // Cartes par deck
    const cardsByDeck = {}
    for (const c of (cardsData || [])) {
      if (!cardsByDeck[c.deck_id]) cardsByDeck[c.deck_id] = []
      cardsByDeck[c.deck_id].push(c.id)
    }

    // Calculer les dues par deck
    const newDueMap = {}
    let total = 0

    for (const deck of decksData) {
      const cards    = cardsByDeck[deck.id]    || []
      const criteria = criteriaByDeck[deck.id] || []
      let count = 0

      for (const cardId of cards) {
        for (const critId of criteria) {
          // Ignorer le critère "verso" (position 1, nom 'verso') — jamais interrogé seul
          const key = `${cardId}|${critId}`
          const nr  = progressMap[key]
          // Dû si jamais vu OU next_review dépassé
          if (!nr || nr <= now) count++
        }
      }

      newDueMap[deck.id] = count
      total += count
    }

    setDecks(decksData)
    setDueMap(newDueMap)
    setTotalDue(total)
    setLoading(false)
  }, [profile])

  useEffect(() => { loadDecks() }, [loadDecks])

  return { decks, dueMap, totalDue, loading, reload: loadDecks }
}