import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../../supabase'

const MAX_VETOS = 3
const REGEN_DAYS = 7

export function useVetos(profile) {
  const [vetos, setVetos] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!profile?.id) return
    const { data } = await supabase
      .from('tisane_vetos')
      .select('*')
      .eq('profile_id', profile.id)
      .order('used_at', { ascending: false })
    setVetos(data ?? [])
    setLoading(false)
  }, [profile?.id])

  useEffect(() => { load() }, [load])

  // Vetos utilisés dans les 7 derniers jours
  const recentVetos = vetos.filter(v => {
    const diffMs = Date.now() - new Date(v.used_at).getTime()
    return diffMs < REGEN_DAYS * 24 * 60 * 60 * 1000
  })

  const availableTokens = MAX_VETOS - recentVetos.length

  // Date de prochain rechargement (le plus ancien veto récent + 7j)
  const nextRegen = recentVetos.length > 0
    ? new Date(
        new Date(recentVetos[recentVetos.length - 1].used_at).getTime()
        + REGEN_DAYS * 24 * 60 * 60 * 1000
      )
    : null

  const useVeto = useCallback(async (watchlistId) => {
    if (!profile?.id || availableTokens <= 0) return false

    await supabase.from('tisane_vetos').insert({
      profile_id: profile.id,
      watchlist_id: watchlistId,
    })
    await supabase.from('tisane_watchlist')
      .update({ status: 'vetoed' })
      .eq('id', watchlistId)

    await load()
    return true
  }, [profile, availableTokens, load])

  function formatRegen(date) {
    if (!date) return null
    const diff = date.getTime() - Date.now()
    if (diff <= 0) return 'bientôt'
    const days = Math.ceil(diff / (24 * 60 * 60 * 1000))
    return `dans ${days}j`
  }

  return {
    availableTokens,
    loading,
    useVeto,
    nextRegen: nextRegen ? formatRegen(nextRegen) : null,
  }
}
