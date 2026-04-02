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

  const [tvRes, seasonRes] = await Promise.all([
    fetch(`${base}/tv/${tmdbId}?${auth}&${lang}`).then(r => r.ok ? r.json() : null),
    fetch(`${base}/tv/${tmdbId}/season/${currentSeason}?${auth}&${lang}`).then(r => r.ok ? r.json() : null),
  ])

  if (!tvRes) return null

  return {
    fetchedAt: Date.now(),
    // Statut de la série (Returning Series, Ended, Canceled…)
    seriesStatus: tvRes.status ?? null,
    totalSeasons: tvRes.number_of_seasons ?? null,
    // Dernier épisode diffusé (peut être en avance sur la position de l'utilisateur)
    lastEpisode: tvRes.last_episode_to_air ?? null,
    // Prochain épisode (date de diffusion future)
    nextEpisode: tvRes.next_episode_to_air ?? null,
    // Nombre d'épisodes dans la saison actuelle
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

  // Vrai si un épisode est sorti après la position courante
  function hasNewEpisode(item) {
    const info = getInfo(item.tmdb_id, item.current_season)
    if (!info?.lastEpisode) return false
    const { season_number: lSeason, episode_number: lEp } = info.lastEpisode
    const curSeason = item.current_season ?? 1
    const curEp = item.current_episode ?? 0
    return lSeason > curSeason || (lSeason === curSeason && lEp > curEp)
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

  // true si l'utilisateur est au dernier épisode de sa saison
  function isAtSeasonEnd(item) {
    const total = getEpisodesInSeason(item)
    if (!total) return false
    return (item.current_episode ?? 0) >= total
  }

  return { getInfo, hasNewEpisode, getNextAirDate, getEpisodesInSeason, getSeriesStatus, isAtSeasonEnd }
}
