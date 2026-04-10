import { useState, useEffect, useCallback, startTransition } from 'react'
import { supabase } from '../../../supabase'

export function useWaterings(plantes) {
  const [waterings, setWaterings] = useState([])
  const [wateringInProgress, setWateringInProgress] = useState(new Set())
  const [allProfiles, setAllProfiles] = useState([])

  const load = useCallback(async () => {
    const [{ data: w }, { data: p }] = await Promise.all([
      supabase.from('arrose_waterings').select('*').order('arrose_le', { ascending: false }).limit(100),
      supabase.from('profiles').select('*'),
    ])
    startTransition(() => {
      setWaterings(w || [])
      setAllProfiles(p || [])
    })
  }, [])

  useEffect(() => {
    load()
    const sub = supabase.channel('arrose_waterings_rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'arrose_waterings' }, load)
      .subscribe()
    return () => supabase.removeChannel(sub)
  }, [load])

  // lastWateredMap : { [plante_id]: Date }
  const lastWateredMap = {}
  for (const w of waterings) {
    if (!lastWateredMap[w.plante_id] || new Date(w.arrose_le) > lastWateredMap[w.plante_id]) {
      lastWateredMap[w.plante_id] = new Date(w.arrose_le)
    }
  }

  // urgenceMap : { [plante_id]: 'ok'|'bientot'|'retard' }
  const now = new Date()
  const urgenceMap = {}
  for (const p of plantes) {
    const last = lastWateredMap[p.id]
    if (!last) { urgenceMap[p.id] = 'retard'; continue }
    const jours = (now - last) / 86_400_000
    const ratio = jours / p.frequence_j
    urgenceMap[p.id] = ratio >= 1 ? 'retard' : ratio >= 0.75 ? 'bientot' : 'ok'
  }

  const arroser = async (plante_id, profile_id) => {
    setWateringInProgress(prev => new Set([...prev, plante_id]))
    await supabase.from('arrose_waterings').insert({ plante_id, arrose_par: profile_id })
    setWateringInProgress(prev => { const s = new Set(prev); s.delete(plante_id); return s })
  }

  return { waterings, lastWateredMap, urgenceMap, arroser, wateringInProgress, allProfiles }
}
