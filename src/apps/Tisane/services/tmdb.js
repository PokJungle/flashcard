const BASE = 'https://api.themoviedb.org/3'
const KEY = import.meta.env.VITE_TMDB_API_KEY
export const IMG_BASE = 'https://image.tmdb.org/t/p/'

// Fournisseurs de streaming en France
export const FR_PROVIDERS = {
  8: { name: 'Netflix', color: '#E50914' },
  119: { name: 'Prime', color: '#00A8E0' },
  337: { name: 'Disney+', color: '#1A3F8B' },
  381: { name: 'Canal+', color: '#000000' },
  56: { name: 'OCS', color: '#FF6600' },
  350: { name: 'Apple TV+', color: '#555555' },
  1899: { name: 'Max', color: '#002BE7' },
}

async function get(path, params = {}) {
  if (!KEY) return null
  const url = new URL(`${BASE}${path}`)
  url.searchParams.set('api_key', KEY)
  url.searchParams.set('language', 'fr-FR')
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, String(v))
  }
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`TMDB ${res.status}: ${path}`)
  return res.json()
}

export async function searchMulti(query, page = 1) {
  const data = await get('/search/multi', { query, page, include_adult: false })
  if (!data) return []
  return (data.results ?? []).filter(r => r.media_type === 'movie' || r.media_type === 'tv')
}

export async function getTrending(timeWindow = 'week') {
  const data = await get(`/trending/all/${timeWindow}`)
  if (!data) return []
  return (data.results ?? []).filter(r => r.media_type === 'movie' || r.media_type === 'tv')
}

export async function getPopular(mediaType = 'movie', page = 1) {
  const data = await get(`/${mediaType}/popular`, { page })
  if (!data) return []
  return (data.results ?? []).map(r => ({ ...r, media_type: mediaType }))
}

export async function getDetails(tmdbId, mediaType) {
  return get(`/${mediaType}/${tmdbId}`, { append_to_response: 'credits,watch/providers' })
}

export async function discoverByGenre(mediaType, genreId, page = 1, maxRuntime = null) {
  const params = {
    with_genres: genreId,
    page,
    sort_by: 'popularity.desc',
    'vote_count.gte': 50,
  }
  if (maxRuntime) params['with_runtime.lte'] = maxRuntime
  const data = await get(`/discover/${mediaType}`, params)
  if (!data) return []
  return (data.results ?? []).map(r => ({ ...r, media_type: mediaType }))
}

export async function discoverCeSoir() {
  // Films populaires < 100 min
  const data = await get('/discover/movie', {
    sort_by: 'popularity.desc',
    'with_runtime.lte': 100,
    'with_runtime.gte': 60,
    'vote_count.gte': 100,
  })
  if (!data) return []
  return (data.results ?? []).map(r => ({ ...r, media_type: 'movie' }))
}

export async function getGenres(mediaType) {
  const data = await get(`/genre/${mediaType}/list`)
  return data?.genres ?? []
}

// Helpers images
export function getPosterUrl(path, size = 'w342') {
  return path ? `${IMG_BASE}${size}${path}` : null
}

export function getBackdropUrl(path, size = 'w780') {
  return path ? `${IMG_BASE}${size}${path}` : null
}

export function getLogoUrl(path, size = 'w45') {
  return path ? `${IMG_BASE}${size}${path}` : null
}

// Extraire les plateformes FR disponibles en streaming
export function getStreamingProviders(details) {
  const fr = details?.['watch/providers']?.results?.FR
  if (!fr) return []
  const providers = fr.flatrate ?? []
  return providers
    .filter(p => FR_PROVIDERS[p.provider_id])
    .map(p => ({
      id: p.provider_id,
      name: FR_PROVIDERS[p.provider_id].name,
      color: FR_PROVIDERS[p.provider_id].color,
      logo: getLogoUrl(p.logo_path),
    }))
}

// Extraire les acteurs principaux (max 4)
export function getCast(details) {
  return (details?.credits?.cast ?? []).slice(0, 4).map(a => a.name)
}

export function formatRuntime(minutes) {
  if (!minutes) return null
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}min`
  return m > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`
}

export function getReleaseYear(item) {
  const date = item?.release_date || item?.first_air_date
  return date ? parseInt(date.substring(0, 4)) : null
}

export function getTitle(item) {
  return item?.title || item?.name || ''
}

// Normalise un résultat TMDB vers le format watchlist
export function normalizeTmdbItem(item) {
  return {
    tmdb_id: item.id,
    media_type: item.media_type || 'movie',
    title: getTitle(item),
    poster_path: item.poster_path ?? null,
    backdrop_path: item.backdrop_path ?? null,
    overview: (item.overview ?? '').substring(0, 500),
    vote_average: item.vote_average ?? 0,
    release_year: getReleaseYear(item),
    runtime: item.runtime ?? null,
    seasons_count: item.number_of_seasons ?? null,
  }
}
