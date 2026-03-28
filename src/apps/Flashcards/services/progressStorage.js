// Service d'accès au localStorage pour la progression Mémoire de Singe.
// Source unique de vérité pour toutes les clés — useMemoire, useStudySession et ManageDeck l'importent ici.

import { ls } from '../../../utils/localStorage'
import { getTodayKey } from '../../../utils/dateUtils'

export const NEW_PER_DAY_DEFAULT = 10

// ── Clés ─────────────────────────────────────────────────────

const newPerDayKey    = (deckId) => `memoire-new-per-day-${deckId}`
const newSeenKey      = (deckId) => `memoire-new-seen-${deckId}-${getTodayKey()}`
const newSeenIdsKey   = (deckId) => `memoire-new-seen-${deckId}-${getTodayKey()}_ids`
const doneTodayKey    = (deckId) => `memoire-done-today-${deckId}-${getTodayKey()}`
const sessionModeKey  = (deckId) => `memoire-session-mode-${deckId}`

// ── Quota nouvelles cartes / jour ─────────────────────────────

export function getNewPerDay(deckId) {
  return ls.get(newPerDayKey(deckId), NEW_PER_DAY_DEFAULT)
}

export function setNewPerDay(deckId, value) {
  ls.set(newPerDayKey(deckId), value)
}

// ── Nouvelles cartes vues aujourd'hui ─────────────────────────

export function getNewSeenToday(deckId) {
  return ls.get(newSeenKey(deckId), 0)
}

/** Enregistre un cardId comme "vu aujourd'hui" (une seule fois par carte). */
export function markCardSeenToday(deckId, cardId) {
  const ids = ls.get(newSeenIdsKey(deckId), [])
  if (ids.includes(cardId)) return
  ids.push(cardId)
  ls.set(newSeenIdsKey(deckId), ids)
  ls.set(newSeenKey(deckId), ids.length)
}

// ── Questions faites aujourd'hui ──────────────────────────────

export function getDoneToday(deckId) {
  return ls.get(doneTodayKey(deckId), 0)
}

export function incrementDoneToday(deckId) {
  ls.set(doneTodayKey(deckId), getDoneToday(deckId) + 1)
}

// ── Dernier mode de session choisi ───────────────────────────

export function getSessionMode(deckId) {
  return ls.getRaw(sessionModeKey(deckId)) || 'normal'
}

export function setSessionMode(deckId, mode) {
  ls.setRaw(sessionModeKey(deckId), mode)
}
