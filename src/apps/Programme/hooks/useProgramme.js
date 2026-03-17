import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../../supabase'

// Retourne la prochaine occurrence d'un événement (annuel ou non)
// sous forme de Date JS, à partir d'aujourd'hui
export function getNextOccurrence(event) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [year, month, day] = event.event_date.split('-').map(Number)

  if (!event.is_annual) {
    return new Date(year, month - 1, day)
  }

  // Récurrence annuelle : on cherche cette année ou l'an prochain
  const thisYear = new Date(today.getFullYear(), month - 1, day)
  if (thisYear >= today) return thisYear

  return new Date(today.getFullYear() + 1, month - 1, day)
}

// Nombre de jours jusqu'à la prochaine occurrence
export function daysUntil(event) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const next = getNextOccurrence(event)
  const diff = next - today
  return Math.round(diff / (1000 * 60 * 60 * 24))
}

// Est-ce que l'événement est passé (et non annuel) ?
export function isPast(event) {
  if (event.is_annual) return false
  return daysUntil(event) < 0
}

export default function useProgramme() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('programme_events')
      .select('*')
      .order('event_date', { ascending: true })

    if (error) {
      setError(error.message)
    } else {
      // Filtrer les événements passés (non annuels)
      const filtered = (data || []).filter(e => !isPast(e))
      // Trier par prochaine occurrence
      filtered.sort((a, b) => getNextOccurrence(a) - getNextOccurrence(b))
      setEvents(filtered)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const addEvent = async ({ title, emoji, event_date, event_time, note, is_annual, profile_id }) => {
    const { error } = await supabase.from('programme_events').insert([{
      title,
      emoji: emoji || '📅',
      event_date,
      event_time: event_time || null,
      note: note || null,
      is_annual: is_annual || false,
      created_by: profile_id,
    }])
    if (error) throw error
    await fetchEvents()
  }

  const updateEvent = async (id, { title, emoji, event_date, event_time, note, is_annual }) => {
    const { error } = await supabase.from('programme_events').update({
      title,
      emoji: emoji || '📅',
      event_date,
      event_time: event_time || null,
      note: note || null,
      is_annual: is_annual || false,
    }).eq('id', id)
    if (error) throw error
    await fetchEvents()
  }

  const deleteEvent = async (id) => {
    const { error } = await supabase.from('programme_events').delete().eq('id', id)
    if (error) throw error
    await fetchEvents()
  }

  // Prochain événement absolu (pour le widget hub)
  const nextEvent = events[0] || null

  return { events, loading, error, addEvent, updateEvent, deleteEvent, nextEvent, refresh: fetchEvents }
}