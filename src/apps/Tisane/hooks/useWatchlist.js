import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../../../supabase'

export function useWatchlist(profile) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const loadingRef = useRef(false)

  const load = useCallback(async () => {
    if (loadingRef.current) return
    loadingRef.current = true
    const { data } = await supabase
      .from('tisane_watchlist')
      .select('*')
      .neq('status', 'vetoed')
      .order('created_at', { ascending: false })
    setItems(data ?? [])
    setLoading(false)
    loadingRef.current = false
  }, [])

  useEffect(() => { load() }, [load])

  // Realtime : rechargement sur tout changement de la watchlist
  useEffect(() => {
    const channel = supabase
      .channel('tisane_watchlist_rt')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tisane_watchlist' },
        () => load()
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [load])

  // Ajouter ou mettre à jour un item (upsert sur tmdb_id+media_type)
  const addItem = useCallback(async (tmdbItem) => {
    if (!profile?.id) return false
    const { error } = await supabase
      .from('tisane_watchlist')
      .upsert(
        {
          tmdb_id: tmdbItem.tmdb_id,
          media_type: tmdbItem.media_type,
          title: tmdbItem.title,
          poster_path: tmdbItem.poster_path ?? null,
          backdrop_path: tmdbItem.backdrop_path ?? null,
          overview: tmdbItem.overview ?? null,
          vote_average: tmdbItem.vote_average ?? 0,
          release_year: tmdbItem.release_year ?? null,
          runtime: tmdbItem.runtime ?? null,
          seasons_count: tmdbItem.seasons_count ?? null,
          added_by: profile.id,
          status: 'to_watch',
        },
        { onConflict: 'tmdb_id,media_type', ignoreDuplicates: true }
      )
    if (!error) await load()
    return !error
  }, [profile, load])

  // Voter sur un item (heart | later | skip)
  // Retourne true si le vote crée un match
  const vote = useCallback(async (itemId, voteType) => {
    if (!profile?.id || voteType === 'skip') return false

    const item = items.find(i => i.id === itemId)
    if (!item) return false

    const liked = [...new Set([...(item.liked_by ?? [])])]
    const passed = [...new Set([...(item.passed_by ?? [])])]

    if (voteType === 'heart') {
      if (!liked.includes(profile.id)) liked.push(profile.id)
      const idx = passed.indexOf(profile.id)
      if (idx > -1) passed.splice(idx, 1)
    } else if (voteType === 'later') {
      if (!passed.includes(profile.id)) passed.push(profile.id)
      const idx = liked.indexOf(profile.id)
      if (idx > -1) liked.splice(idx, 1)
    }

    // Match si au moins 2 profils distincts ont liké
    const isMatch = liked.length >= 2

    const updates = {
      liked_by: liked,
      passed_by: passed,
      ...(isMatch ? { status: 'matched' } : {}),
    }

    await supabase.from('tisane_watchlist').update(updates).eq('id', itemId)
    await load()
    return isMatch
  }, [items, profile, load])

  // Ajouter depuis catalogue puis voter (pour le mode "Catalogue Global")
  const addAndVote = useCallback(async (tmdbItem, voteType) => {
    if (!profile?.id || voteType === 'skip') return false
    if (!tmdbItem.tmdb_id) return false

    // Upsert l'item
    await supabase
      .from('tisane_watchlist')
      .upsert(
        {
          tmdb_id: tmdbItem.tmdb_id,
          media_type: tmdbItem.media_type,
          title: tmdbItem.title,
          poster_path: tmdbItem.poster_path ?? null,
          backdrop_path: tmdbItem.backdrop_path ?? null,
          overview: tmdbItem.overview ?? null,
          vote_average: tmdbItem.vote_average ?? 0,
          release_year: tmdbItem.release_year ?? null,
          runtime: tmdbItem.runtime ?? null,
          seasons_count: tmdbItem.seasons_count ?? null,
          added_by: profile.id,
          status: 'to_watch',
        },
        { onConflict: 'tmdb_id,media_type', ignoreDuplicates: false }
      )

    // Recharger pour obtenir l'id réel
    const { data } = await supabase
      .from('tisane_watchlist')
      .select('*')
      .eq('tmdb_id', tmdbItem.tmdb_id)
      .eq('media_type', tmdbItem.media_type)
      .single()

    if (!data) return false

    // Voter
    const liked = [...new Set([...(data.liked_by ?? [])])]
    const passed = [...new Set([...(data.passed_by ?? [])])]

    if (voteType === 'heart') {
      if (!liked.includes(profile.id)) liked.push(profile.id)
      const idx = passed.indexOf(profile.id)
      if (idx > -1) passed.splice(idx, 1)
    } else if (voteType === 'later') {
      if (!passed.includes(profile.id)) passed.push(profile.id)
      const idx = liked.indexOf(profile.id)
      if (idx > -1) liked.splice(idx, 1)
    }

    const isMatch = liked.length >= 2
    const updates = {
      liked_by: liked,
      passed_by: passed,
      ...(isMatch ? { status: 'matched' } : {}),
    }

    await supabase.from('tisane_watchlist').update(updates).eq('id', data.id)
    await load()
    return isMatch
  }, [profile, load])

  // Avancer d'un épisode (passe en "watching" si c'était "matched")
  // episodesInSeason : si fourni, déclenche l'auto-avancement de saison au dernier épisode
  const advanceEpisode = useCallback(async (itemId, episodesInSeason = null) => {
    const item = items.find(i => i.id === itemId)
    if (!item) return

    const curEp = item.current_episode ?? 0

    // Si on connaît le total d'épisodes de la saison et qu'on est au dernier → passer à la saison suivante
    if (episodesInSeason && curEp >= episodesInSeason) {
      await supabase.from('tisane_watchlist').update({
        current_season: (item.current_season ?? 1) + 1,
        current_episode: 1,
        status: 'watching',
      }).eq('id', itemId)
    } else {
      const updates = {
        current_episode: curEp + 1,
        ...(['matched', 'to_watch'].includes(item.status) ? { status: 'watching' } : {}),
      }
      await supabase.from('tisane_watchlist').update(updates).eq('id', itemId)
    }
    await load()
  }, [items, load])

  // Avancer la saison (+1 saison, reset épisode à 1)
  const advanceSeason = useCallback(async (itemId) => {
    const item = items.find(i => i.id === itemId)
    if (!item) return
    await supabase.from('tisane_watchlist').update({
      current_season: (item.current_season ?? 1) + 1,
      current_episode: 1,
    }).eq('id', itemId)
    await load()
  }, [items, load])

  // Marquer comme terminé
  const markWatched = useCallback(async (itemId) => {
    await supabase.from('tisane_watchlist').update({ status: 'watched' }).eq('id', itemId)
    await load()
  }, [load])

  // Retirer de la watchlist (soft delete via status vetoed)
  const removeItem = useCallback(async (itemId) => {
    await supabase.from('tisane_watchlist').update({ status: 'vetoed' }).eq('id', itemId)
    await load()
  }, [load])

  return {
    items,
    loading,
    addItem,
    addAndVote,
    vote,
    advanceEpisode,
    advanceSeason,
    markWatched,
    removeItem,
    reload: load,
  }
}
