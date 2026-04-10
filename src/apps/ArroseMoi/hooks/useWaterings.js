import { useState, useEffect, useCallback, startTransition } from 'react'
import { supabase } from '../../../supabase'

// Coefficient saisonnier — mois basé sur l'hémisphère nord (France)
export function getSaison() {
  const month = new Date().getMonth() + 1 // 1–12
  if (month >= 6 && month <= 8) return { coeff: 0.75, icon: '☀️', message: "C'est l'été, j'ai rapproché vos arrosages pour compenser la chaleur." }
  if (month === 12 || month <= 2) return { coeff: 1.5, icon: '❄️', message: "C'est l'hiver, j'ai espacé vos rappels pour laisser vos plantes se reposer." }
  return { coeff: 1.0, icon: null, message: null }
}

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

  // urgenceMap : { [plante_id]: 'ok'|'bientot'|'retard' } — fréquence ajustée par saison
  const saison = getSaison()
  const now = new Date()
  const urgenceMap = {}
  for (const p of plantes) {
    const last = lastWateredMap[p.id]
    if (!last) { urgenceMap[p.id] = 'retard'; continue }
    const jours = (now - last) / 86_400_000
    const ratio = jours / (p.frequence_j * saison.coeff)
    urgenceMap[p.id] = ratio >= 1 ? 'retard' : ratio >= 0.75 ? 'bientot' : 'ok'
  }

  const arroser = async (plante_id, profile_id) => {
    setWateringInProgress(prev => new Set([...prev, plante_id]))
    await supabase.from('arrose_waterings').insert({ plante_id, arrose_par: profile_id })
    setWateringInProgress(prev => { const s = new Set(prev); s.delete(plante_id); return s })
  }

  return { waterings, lastWateredMap, urgenceMap, arroser, wateringInProgress, allProfiles, saison }
}
