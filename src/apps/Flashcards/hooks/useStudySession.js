import { useState, useCallback } from 'react'
import { supabase } from '../../../supabase'

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

function sortByPriority(items) {
  const now = Date.now()
  return [...items].sort((a, b) => {
    const aScore = a.next_review === null ? Infinity : (now - new Date(a.next_review).getTime())
    const bScore = b.next_review === null ? Infinity : (now - new Date(b.next_review).getTime())
    if (Math.abs(aScore - bScore) > 3600000) return bScore - aScore
    return Math.random() - 0.5
  })
}

export function useStudySession(profile) {
  const [session, setSession]           = useState(null)
  const [sessionReady, setSessionReady] = useState(false)
  const [idx, setIdx]                   = useState(0)
  const [loading, setLoading]           = useState(false)
  const [sessionStats, setSessionStats] = useState({ easy: 0, medium: 0, hard: 0 })

  const startSession = useCallback(async (deck) => {
    console.log('startSession deck:', deck)
    setLoading(true)
    setSessionReady(false)
    setSession(null)

    const { data: criteria } = await supabase
      .from('deck_criteria')
      .select('*')
      .eq('deck_id', deck.id)
      .order('position')

    const activeCriteria = (criteria || []).filter(c => c.interrogeable !== false)
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

    for (const card of cards) {
      for (const crit of activeCriteria) {
        const key  = `${card.id}|${crit.id}`
        const prog = progressMap[key]
        const isDue = !prog || new Date(prog.next_review) <= now
        if (isDue) {
          dueItems.push({
            cardId:      card.id,
            criterionId: crit.id,
            criterion:   crit,
            level:       prog?.level ?? 0,
            next_review: prog?.next_review ?? null,
            progressId:  prog?.id ?? null,
          })
        }
      }
    }

    // Si rien de dû, prendre tous les items
    const pool = dueItems.length > 0 ? dueItems : cards.flatMap(card =>
      activeCriteria.map(crit => {
        const key  = `${card.id}|${crit.id}`
        const prog = progressMap[key]
        return {
          cardId: card.id, criterionId: crit.id, criterion: crit,
          level: prog?.level ?? 0, next_review: prog?.next_review ?? null, progressId: prog?.id ?? null,
        }
      })
    )

    const sorted = sortByPriority(pool)
    console.log('items à réviser:', sorted.length)

    const uniqueCardIds = [...new Set(sorted.map(i => i.cardId))]
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

    setSession({ deck, criteria: activeCriteria, allCriteria: criteria || [], items: sorted, progressMap, valuesMap })
    setIdx(0)
    setSessionStats({ easy: 0, medium: 0, hard: 0 })
    setSessionReady(true)
    setLoading(false)
  }, [profile])

  const rateItem = useCallback(async (rating) => {
    if (!session) return
    const item = session.items[idx]
    const { newLevel, next } = computeNextReview(item.level, rating)

    if (item.progressId) {
      await supabase.from('card_progress')
        .update({ level: newLevel, next_review: next.toISOString(), last_reviewed: new Date().toISOString() })
        .eq('id', item.progressId)
    } else {
      await supabase.from('card_progress')
        .insert({
          profile_id:    profile.id,
          card_id:       item.cardId,
          criterion_id:  item.criterionId,
          level:         newLevel,
          next_review:   next.toISOString(),
          last_reviewed: new Date().toISOString(),
        })
    }

    setSessionStats(s => ({ ...s, [rating]: s[rating] + 1 }))
    goNextInner()
  }, [session, idx, profile])

  const goNextInner = useCallback(() => {
    setIdx(i => {
      if (!session) return i
      return i < session.items.length - 1 ? i + 1 : -1
    })
  }, [session])

  const goNext = useCallback(() => { goNextInner() }, [goNextInner])

  const isFinished    = idx === -1
  const currentItem   = session && idx >= 0 ? session.items[idx] : null

  return {
    session, currentItem, idx,
    loading, sessionReady, isFinished, sessionStats,
    startSession, rateItem, goNext,
  }
}