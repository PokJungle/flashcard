import { useState, useEffect, useRef } from 'react'

const CACHE_KEY = 'tisane-series-sync-v1'
const CACHE_TTL = 4 * 60 * 60 * 1000 // 4 heures

function readCache() {
  try { return JSON.parse(sessionStorage.getItem(CACHE_KEY) ?? '{}') } catch { return {} }
}

function writeCache(data) {
  try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(data)) } catch {}
}

async function fetchSeriesInfo(tmdbId, currentSeason) {
  const KEY = import.meta.env.VITE_TMDB_API_KEY
  if (!KEY) return null

  const base = 'https://api.themoviedb.org/3'
  const lang = 'language=fr-FR'
  const auth = `api_key=${KEY}`

  // Fetch la série d'abord pour connaître le nombre réel de saisons
  const tvRes = await fetch(`${base}/tv/${tmdbId}?${auth}&${lang}`)
    .then(r => r.ok ? r.json() : null)

  if (!tvRes) return null

  // Clamp la saison demandée pour éviter un 404
  const totalSeasons = tvRes.number_of_seasons ?? 1
  const validSeason = Math.min(currentSeason, totalSeasons)

  const seasonRes = await fetch(`${base}/tv/${tmdbId}/season/${validSeason}?${auth}&${lang}`)
    .then(r => r.ok ? r.json() : null)

  return {
    fetchedAt: Date.now(),
    seriesStatus: tvRes.status ?? null,
    totalSeasons,
    lastEpisode: tvRes.last_episode_to_air ?? null,
    nextEpisode: tvRes.next_episode_to_air ?? null,
    episodesInSeason: seasonRes?.episodes?.length ?? null,
  }
}

export function useSeriesSync(series) {
  const [syncData, setSyncData] = useState(readCache)
  const inFlight = useRef(new Set())

  // Clé de dépendance stable basée sur tmdb_id + saison courante
  const depKey = series
    .filter(s => s.media_type === 'tv')
    .map(s => `${s.tmdb_id}:${s.current_season ?? 1}`)
    .join(',')

  useEffect(() => {
    const tvSeries = series.filter(s => s.media_type === 'tv')
    if (!tvSeries.length) return

    const cache = readCache()
    const now = Date.now()

    const toSync = tvSeries.filter(s => {
      const cacheKey = `${s.tmdb_id}:${s.current_season ?? 1}`
      if (inFlight.current.has(cacheKey)) return false
      const cached = cache[cacheKey]
      return !cached || (now - cached.fetchedAt) > CACHE_TTL
    })

    if (!toSync.length) return

    toSync.forEach(s => inFlight.current.add(`${s.tmdb_id}:${s.current_season ?? 1}`))

    Promise.all(
      toSync.map(s =>
        fetchSeriesInfo(s.tmdb_id, s.current_season ?? 1)
          .then(data => ({ cacheKey: `${s.tmdb_id}:${s.current_season ?? 1}`, data }))
          .catch(() => null)
      )
    ).then(results => {
      const newCache = { ...readCache() }
      results.forEach(r => {
        if (r?.data) newCache[r.cacheKey] = r.data
        if (r) inFlight.current.delete(r.cacheKey)
      })
      writeCache(newCache)
      setSyncData({ ...newCache })
    })
  }, [depKey]) // eslint-disable-line react-hooks/exhaustive-deps

  // Données TMDB pour un item donné
  function getInfo(tmdbId, currentSeason) {
    return syncData[`${tmdbId}:${currentSeason ?? 1}`] ?? null
  }

  // Vrai si un épisode est sorti après la position courante ET après la dernière visite du profil
  // lastVisitMs : timestamp de la dernière visite (depuis localStorage)
  function hasNewEpisode(item, lastVisitMs) {
    const info = getInfo(item.tmdb_id, item.current_season)
    if (!info?.lastEpisode) return false
    const { season_number: lSeason, episode_number: lEp, air_date } = info.lastEpisode
    const curSeason = item.current_season ?? 1
    const curEp = item.current_episode ?? 0

    // L'épisode doit être en avance sur la position courante
    const isAhead = lSeason > curSeason || (lSeason === curSeason && lEp > curEp)
    if (!isAhead) return false

    // S'il y a une date de diffusion, vérifier qu'elle est postérieure à la dernière visite
    if (air_date && lastVisitMs != null) {
      return new Date(air_date).getTime() > lastVisitMs
    }

    return true
  }

  // Date du prochain épisode formatée en FR
  function getNextAirDate(item) {
    const info = getInfo(item.tmdb_id, item.current_season)
    if (!info?.nextEpisode?.air_date) return null
    const d = new Date(info.nextEpisode.air_date)
    // Vérifier que la date est dans le futur
    if (d < new Date()) return null
    return {
      label: d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }),
      season: info.nextEpisode.season_number,
      episode: info.nextEpisode.episode_number,
      name: info.nextEpisode.name,
    }
  }

  // Nombre total d'épisodes dans la saison courante
  function getEpisodesInSeason(item) {
    return getInfo(item.tmdb_id, item.current_season)?.episodesInSeason ?? null
  }

  // Statut de la série
  function getSeriesStatus(item) {
    return getInfo(item.tmdb_id, item.current_season)?.seriesStatus ?? null
  }

  // true si l'utilisateur est au dernier épisode de sa saison courante
  function isAtSeasonEnd(item) {
    const total = getEpisodesInSeason(item)
    if (!total) return false
    return (item.current_episode ?? 0) >= total
  }

  // true si le prochain épisode est disponible (a déjà été diffusé)
  // Bloque le bouton + si l'utilisateur est à jour ou en avance sur les diffusions
  function canAdvance(item) {
    const info = getInfo(item.tmdb_id, item.current_season)
    // Pas de données TMDB → on laisse avancer (pas de blocage par défaut)
    if (!info?.lastEpisode) return true

    const { season_number: lSeason, episode_number: lEp } = info.lastEpisode
    const curSeason = item.current_season ?? 1
    const curEp = item.current_episode ?? 0

    // Peut avancer si le dernier épisode diffusé est en avance sur la position courante
    return lSeason > curSeason || (lSeason === curSeason && lEp > curEp)
  }

  return { getInfo, hasNewEpisode, getNextAirDate, getEpisodesInSeason, getSeriesStatus, isAtSeasonEnd, canAdvance }
}
