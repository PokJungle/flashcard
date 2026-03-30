import { useState, useEffect } from 'react'
import { supabase } from '../../../supabase'

// ─── Zone config helpers ──────────────────────────────────────────────────────

export const DEFAULT_ZONES = [
  { id: 'cave',    name: 'Cave',    emoji: '🏠' },
  { id: 'frigo',   name: 'Frigo',   emoji: '❄️' },
  { id: 'service', name: 'Service', emoji: '🍽️' },
]

export function loadZones() {
  try {
    const s = JSON.parse(localStorage.getItem('canon-zones') || 'null')
    if (Array.isArray(s) && s.length) return s
  } catch { /* ignore */ }
  return DEFAULT_ZONES
}

export function saveZones(zones) {
  localStorage.setItem('canon-zones', JSON.stringify(zones))
}

export function getZoneInfo(zones, zoneId) {
  return zones.find(z => z.id === zoneId) || { id: zoneId, name: zoneId, emoji: '📦' }
}

// ─── Location helpers (exported for use in screens) ──────────────────────────

export function getLocations(bottle) {
  const locs = bottle.locations
  if (Array.isArray(locs) && locs.length > 0) return locs
  // Rétrocompat : lire les anciens champs zone + quantity
  if (bottle.quantity > 0 || bottle.zone) {
    return [{ zone: bottle.zone || 'cave', qty: bottle.quantity || 1 }]
  }
  return []
}

export function getTotalQty(bottle) {
  return getLocations(bottle).reduce((s, l) => s + (l.qty || 0), 0)
}

// ─── Location computation (pure) ─────────────────────────────────────────────

function computeLocations(locations, zone, delta) {
  const updated = (locations || []).map(l =>
    l.zone === zone ? { ...l, qty: Math.max(0, l.qty + delta) } : l
  ).filter(l => l.qty > 0)
  if (delta > 0 && !updated.find(l => l.zone === zone))
    updated.push({ zone, qty: delta })
  return updated
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCanon(profile) {
  const [bottles, setBottles]   = useState([])
  const [tastings, setTastings] = useState([])
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    setLoading(true)
    const [{ data: b }, { data: t }, { data: p }] = await Promise.all([
      supabase.from('canon_bottles').select('*').order('created_at', { ascending: false }),
      supabase.from('canon_tastings').select('*').order('tasted_at', { ascending: false }),
      supabase.from('profiles').select('*'),
    ])
    setBottles(b || [])
    setTastings(t || [])
    setProfiles(p || [])
    setLoading(false)
  }

  // ─── Bottle CRUD ─────────────────────────────────────────────────────────

  const addBottle = async (data) => {
    const { data: row } = await supabase.from('canon_bottles').insert(data).select().single()
    if (row) setBottles(prev => [row, ...prev])
    return row
  }

  const updateBottle = async (id, data) => {
    await supabase.from('canon_bottles').update(data).eq('id', id)
    setBottles(prev => prev.map(b => b.id === id ? { ...b, ...data } : b))
  }

  const deleteBottle = async (id) => {
    await supabase.from('canon_bottles').delete().eq('id', id)
    setBottles(prev => prev.filter(b => b.id !== id))
  }

  // ─── Location operations ──────────────────────────────────────────────────

  const _setLocations = async (id, newLocs) => {
    const qty = newLocs.reduce((s, l) => s + l.qty, 0)
    await updateBottle(id, { locations: newLocs, quantity: qty })
  }

  const addToZone = async (id, zone, qty = 1) => {
    const b = bottles.find(b => b.id === id)
    if (!b) return
    const newLocs = computeLocations(getLocations(b), zone, qty)
    await _setLocations(id, newLocs)
  }

  const transferZone = async (id, fromZone, toZone, qty) => {
    const b = bottles.find(b => b.id === id)
    if (!b) return
    let locs = computeLocations(getLocations(b), fromZone, -qty)
    locs = computeLocations(locs, toZone, qty)
    await _setLocations(id, locs)
  }

  // ─── Tasting operations ───────────────────────────────────────────────────

  const addTasting = async (data) => {
    const { data: row } = await supabase
      .from('canon_tastings')
      .insert({ ...data, profile_id: profile.id })
      .select()
      .single()
    if (row) setTastings(prev => [row, ...prev])
    return row
  }

  const deleteTasting = async (id) => {
    await supabase.from('canon_tastings').delete().eq('id', id)
    setTastings(prev => prev.filter(t => t.id !== id))
  }

  const drinkBottle = async (bottle, zone, tastingData) => {
    const newLocs = computeLocations(getLocations(bottle), zone, -1)
    await _setLocations(bottle.id, newLocs)
    await addTasting({
      bottle_id:   bottle.id,
      name:        bottle.name,
      domain:      bottle.domain,
      appellation: bottle.appellation,
      vintage:     bottle.vintage,
      color:       bottle.color,
      region:      bottle.region,
      grape:       bottle.grape,
      ...tastingData,
    })
  }

  const addReaction = async (tastingId, { rating, is_favorite, note }) => {
    const tasting = tastings.find(t => t.id === tastingId)
    if (!tasting) return
    const existing = Array.isArray(tasting.reactions) ? tasting.reactions : []
    const others = existing.filter(r => r.profile_id !== profile.id)
    const newReactions = [
      ...others,
      { profile_id: profile.id, rating: rating || null, is_favorite: !!is_favorite, note: note || null },
    ]
    await supabase.from('canon_tastings').update({ reactions: newReactions }).eq('id', tastingId)
    setTastings(prev => prev.map(t => t.id === tastingId ? { ...t, reactions: newReactions } : t))
  }

  return {
    bottles, tastings, profiles, loading,
    loadAll,
    addBottle, updateBottle, deleteBottle,
    addToZone, transferZone,
    addTasting, deleteTasting, drinkBottle,
    addReaction,
  }
}
