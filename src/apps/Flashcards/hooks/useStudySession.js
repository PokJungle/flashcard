import { useState, useCallback } from 'react'
import { supabase } from '../../../supabase'
import { getActiveCriteria } from '../utils/criteriaUtils'
import { getNewPerDay, getNewSeenToday, markCardSeenToday, incrementDoneToday } from '../services/progressStorage'

function computeNextReview(currentLevel, rating) {
  let newLevel, daysUntilNext
  if (rating === 'hard') {
    newLevel = Math.max(0, currentLevel - 1)
    daysUntilNext = 0.25
  } else if (rating === 'medium') {
    newLevel = currentLevel + 1
    daysUntilNext = newLevel + 1
  } else {
    newLevel = currentLevel + 2
    daysUntilNext = Math.pow(2, newLevel)
  }
  const next = new Date()
  next.setTime(next.getTime() + daysUntilNext * 24 * 60 * 60 * 1000)
  return { newLevel, next }
}


export function useStudySession(profile) {
  const [session, setSession]           = useState(null)
  const [sessionReady, setSessionReady] = useState(false)
  const [idx, setIdx]                   = useState(0)
  const [loading, setLoading]           = useState(false)
  const [sessionStats, setSessionStats] = useState({ easy: 0, medium: 0, hard: 0 })

  const startSession = useCallback(async (deck, limit = null) => {
    console.log('startSession deck:', deck)
    setLoading(true)
    setSessionReady(false)
    setSession(null)

    const { data: criteria } = await supabase
      .from('deck_criteria')
      .select('*')
      .eq('deck_id', deck.id)
      .order('position')

    const activeCriteria = getActiveCriteria(criteria)
    console.log('activeCriteria:', activeCriteria)

    const { data: cards } = await supabase
      .from('cards')
      .select('id')
      .eq('deck_id', deck.id)

    console.log('cards:', cards?.length)

    if (!cards?.length || !activeCriteria.length) {
      setLoading(false)
      return
    }

    const cardIds     = cards.map(c => c.id)
    const criteriaIds = activeCriteria.map(c => c.id)

    const { data: progress } = await supabase
      .from('card_progress')
      .select('card_id, criterion_id, level, next_review, id')
      .eq('profile_id', profile.id)
      .in('card_id', cardIds)
      .in('criterion_id', criteriaIds)

    const progressMap = {}
    for (const p of (progress || [])) {
      progressMap[`${p.card_id}|${p.criterion_id}`] = p
    }

    const now = new Date()
    const dueItems = []
    const neverSeenItems = []

    for (const card of cards) {
      for (const crit of activeCriteria) {
        const key  = `${card.id}|${crit.id}`
        const prog = progressMap[key]
        if (!prog) {
          // Jamais vu — toujours inclure
          neverSeenItems.push({
            cardId:      card.id,
            criterionId: crit.id,
            criterion:   crit,
            level:       0,
            next_review: null,
            progressId:  null,
          })
        } else if (new Date(prog.next_review) <= now) {
          // Déjà vu et dû
          dueItems.push({
            cardId:      card.id,
            criterionId: crit.id,
            criterion:   crit,
            level:       prog.level ?? 0,
            next_review: prog.next_review ?? null,
            progressId:  prog.id ?? null,
          })
        }
      }
    }

    // Limite nouvelles cartes/jour — la limite est en CARTES, pas en items
    // Une carte avec 3 critères = 1 nouvelle carte, pas 3
    const newPerDay    = getNewPerDay(deck.id)
    const newSeenToday = getNewSeenToday(deck.id)
    const newRemaining = newPerDay === 999 ? Infinity : Math.max(0, newPerDay - newSeenToday)

    // Grouper les jamais vus par cardId pour compter en cartes
    const neverSeenByCard = {}
    for (const item of neverSeenItems) {
      if (!neverSeenByCard[item.cardId]) neverSeenByCard[item.cardId] = []
      neverSeenByCard[item.cardId].push(item)
    }
    // Prendre seulement X cartes nouvelles
    const allowedCardIds = new Set(Object.keys(neverSeenByCard).slice(0, newRemaining))
    const allowedNew = neverSeenItems.filter(item => allowedCardIds.has(item.cardId))

    // Pool = dues en retard + nouvelles autorisées aujourd'hui
    const pool = (dueItems.length + allowedNew.length) > 0
      ? [...dueItems, ...allowedNew]
      : cards.flatMap(card =>
          activeCriteria.map(crit => {
            const key  = `${card.id}|${crit.id}`
            const prog = progressMap[key]
            return {
              cardId: card.id, criterionId: crit.id, criterion: crit,
              level: prog?.level ?? 0, next_review: prog?.next_review ?? null, progressId: prog?.id ?? null,
            }
          })
        )

    // 1 item par carte maximum — critère choisi aléatoirement parmi ceux disponibles
    // (pour mixer symboles, noms, numéros dans la même session)
    const itemsByCard = {}
    for (const item of pool) {
      if (!itemsByCard[item.cardId]) itemsByCard[item.cardId] = []
      itemsByCard[item.cardId].push(item)
    }

    // Pour chaque carte, prendre 1 critère au hasard
    const onePerCard = Object.values(itemsByCard).map(items => {
      const i = Math.floor(Math.random() * items.length)
      return items[i]
    })

    // Trier par priorité (jamais vu > en retard > récent) puis shuffle léger
    const sorted = onePerCard.sort((a, b) => {
      const aScore = a.next_review === null ? Infinity : (Date.now() - new Date(a.next_review).getTime())
      const bScore = b.next_review === null ? Infinity : (Date.now() - new Date(b.next_review).getTime())
      if (Math.abs(aScore - bScore) > 3600000) return bScore - aScore
      return Math.random() - 0.5
    })

    const limited = limit ? sorted.slice(0, limit) : sorted
    console.log('questions:', limited.length, '(1 critère aléatoire par carte)')

    const uniqueCardIds = [...new Set(limited.map(i => i.cardId))]
    const { data: allValues } = await supabase
      .from('card_values')
      .select('card_id, criterion_id, value')
      .in('card_id', uniqueCardIds)

    console.log('card_values chargés:', allValues?.length)

    const valuesMap = {}
    for (const v of (allValues || [])) {
      if (!valuesMap[v.card_id]) valuesMap[v.card_id] = {}
      valuesMap[v.card_id][v.criterion_id] = v.value
    }

    setSession({ deck, criteria: activeCriteria, allCriteria: criteria || [], items: limited, progressMap, valuesMap })
    setIdx(0)
    setSessionStats({ easy: 0, medium: 0, hard: 0 })
    setSessionReady(true)
    setLoading(false)
  }, [profile])

  const advanceIdx = useCallback((currentSession) => {
    setIdx(i => i < currentSession.items.length - 1 ? i + 1 : -1)
  }, [])

  const rateItem = useCallback(async (rating) => {
    if (!session) return
    const item = session.items[idx]
    console.log('rateItem idx:', idx, 'cardId:', item?.cardId, 'criterionId:', item?.criterionId, 'progressId:', item?.progressId)
    const { newLevel, next } = computeNextReview(item.level, rating)

    if (item.progressId) {
      console.log('→ UPDATE', item.progressId)
      await supabase.from('card_progress')
        .update({ level: newLevel, next_review: next.toISOString(), last_reviewed: new Date().toISOString() })
        .eq('id', item.progressId)
    } else {
      await supabase.from('card_progress')
        .upsert({
          profile_id:    profile.id,
          card_id:       item.cardId,
          criterion_id:  item.criterionId,
          level:         newLevel,
          next_review:   next.toISOString(),
          last_reviewed: new Date().toISOString(),
        }, { onConflict: 'profile_id,card_id,criterion_id' })
      // Incrémenter le compteur de nouvelles cartes vues aujourd'hui
      // On ne compte qu'une fois par cardId (pas par critère)
      if (session?.deck?.id) {
        markCardSeenToday(session.deck.id, item.cardId)
      }
    }

    // Incrémenter le compteur de questions faites aujourd'hui
    if (session?.deck?.id) {
      incrementDoneToday(session.deck.id)
    }
    setSessionStats(s => ({ ...s, [rating]: s[rating] + 1 }))
    advanceIdx(session)
  }, [session, idx, profile, advanceIdx])

  const goNext = useCallback(() => {
    if (session) advanceIdx(session)
  }, [session, advanceIdx])

  const isFinished    = idx === -1
  const currentItem   = session && idx >= 0 ? session.items[idx] : null

  return {
    session, currentItem, idx,
    loading, sessionReady, isFinished, sessionStats,
    startSession, rateItem, goNext,
  }
}