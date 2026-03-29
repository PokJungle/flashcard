import { useState, useEffect } from 'react'
import { supabase } from '../../../supabase'

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

  const drinkBottle = async (bottle, tastingData) => {
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
    const newQty = Math.max(0, (bottle.quantity || 1) - 1)
    await updateBottle(bottle.id, { quantity: newQty })
  }

  const zones = [...new Set(bottles.filter(b => b.zone).map(b => b.zone))].sort()

  return {
    bottles, tastings, profiles, loading, zones,
    loadAll, addBottle, updateBottle, deleteBottle,
    addTasting, deleteTasting, drinkBottle,
  }
}
