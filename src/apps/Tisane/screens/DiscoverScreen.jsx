import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, X, Plus, Check } from 'lucide-react'
import { searchMulti, getTrending, getGenres, discoverByGenre, getPosterUrl, normalizeTmdbItem, getReleaseYear, getTitle } from '../services/tmdb'

const C = {
  bg: '#0d0620',
  card: '#16082e',
  border: '#2d1059',
  amber: '#f59e0b',
  violet: '#7c3aed',
  textPri: '#f5f0ff',
  textSec: '#a78bfa',
  textMuted: '#6b4fa0',
}

// Genres populaires en dur (évite un appel API au démarrage)
const MOVIE_GENRES = [
  { id: 28, name: 'Action' },
  { id: 35, name: 'Comédie' },
  { id: 18, name: 'Drame' },
  { id: 27, name: 'Horreur' },
  { id: 10749, name: 'Romance' },
  { id: 878, name: 'Sci-Fi' },
  { id: 53, name: 'Thriller' },
  { id: 16, name: 'Animation' },
  { id: 14, name: 'Fantastique' },
  { id: 80, name: 'Crime' },
]

const TV_GENRES = [
  { id: 18, name: 'Drame' },
  { id: 35, name: 'Comédie' },
  { id: 10759, name: 'Action/Avent.' },
  { id: 10765, name: 'Sci-Fi/Fantasy' },
  { id: 9648, name: 'Mystère' },
  { id: 80, name: 'Crime' },
  { id: 10768, name: 'Guerre' },
  { id: 10762, name: 'Enfants' },
]

// ─── Carte media (grille) ─────────────────────────────────────────────────────
function MediaCard({ item, onAdd, isInWatchlist }) {
  const [adding, setAdding] = useState(false)
  const poster = getPosterUrl(item.poster_path, 'w185')
  const year = getReleaseYear(item)
  const title = getTitle(item)

  const handleAdd = async (e) => {
    e.stopPropagation()
    if (isInWatchlist || adding) return
    setAdding(true)
    await onAdd(normalizeTmdbItem(item))
    setAdding(false)
  }

  return (
    <div className="rounded-xl overflow-hidden relative"
      style={{ background: C.card, border: `0.5px solid ${C.border}` }}>
      {/* Poster */}
      <div className="relative" style={{ aspectRatio: '2/3', background: '#0d0620' }}>
        {poster
          ? <img src={poster} alt={title} className="w-full h-full object-cover" loading="lazy" />
          : (
            <div className="w-full h-full flex items-center justify-center text-3xl">
              {item.media_type === 'tv' ? '📺' : '🎬'}
            </div>
          )
        }
        {/* Badge type */}
        <div className="absolute top-1.5 left-1.5">
          <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-md"
            style={{ background: 'rgba(13,6,32,0.85)', color: C.textSec }}>
            {item.media_type === 'tv' ? 'Série' : 'Film'}
          </span>
        </div>
        {/* Bouton ajout */}
        <button
          onClick={handleAdd}
          className="absolute bottom-1.5 right-1.5 w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-90"
          style={{
            background: isInWatchlist ? '#10b98190' : adding ? C.violet : C.amber,
            opacity: isInWatchlist ? 0.7 : 1,
          }}>
          {isInWatchlist
            ? <Check size={13} color="#fff" strokeWidth={3} />
            : adding
              ? <div className="w-3 h-3 rounded-full border animate-spin"
                  style={{ borderColor: '#fff', borderTopColor: 'transparent' }} />
              : <Plus size={13} color="#0d0620" strokeWidth={3} />
          }
        </button>
      </div>
      {/* Infos */}
      <div className="px-2 py-1.5">
        <p className="text-[11px] font-medium leading-snug" style={{ color: C.textPri }}
          title={title}>
          {title.length > 22 ? title.substring(0, 22) + '…' : title}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          {year && <span className="text-[10px]" style={{ color: C.textMuted }}>{year}</span>}
          {item.vote_average > 0 && (
            <span className="text-[10px]" style={{ color: C.amber }}>★ {Number(item.vote_average).toFixed(1)}</span>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── DiscoverScreen ───────────────────────────────────────────────────────────
export default function DiscoverScreen({ profile, onAdd, watchlistIds }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [trending, setTrending] = useState([])
  const [mediaTab, setMediaTab] = useState('movie') // 'movie' | 'tv'
  const [activeGenre, setActiveGenre] = useState(null)
  const [genreResults, setGenreResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingGenre, setLoadingGenre] = useState(false)
  const [noApiKey] = useState(!import.meta.env.VITE_TMDB_API_KEY)
  const searchTimeout = useRef(null)

  // Charger trending au montage
  useEffect(() => {
    if (noApiKey) return
    setLoading(true)
    getTrending('week')
      .then(data => setTrending(data.slice(0, 20)))
      .catch(() => setTrending([]))
      .finally(() => setLoading(false))
  }, [noApiKey])

  // Recherche avec debounce
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }
    clearTimeout(searchTimeout.current)
    setLoading(true)
    searchTimeout.current = setTimeout(async () => {
      try {
        const data = await searchMulti(query.trim())
        setResults(data.slice(0, 20))
      } catch {
        setResults([])
      }
      setLoading(false)
    }, 400)
    return () => clearTimeout(searchTimeout.current)
  }, [query])

  // Charger par genre
  const handleGenre = useCallback(async (genreId) => {
    if (activeGenre === genreId) {
      setActiveGenre(null)
      setGenreResults([])
      return
    }
    setActiveGenre(genreId)
    setLoadingGenre(true)
    try {
      const data = await discoverByGenre(mediaTab, genreId)
      setGenreResults(data.slice(0, 20))
    } catch {
      setGenreResults([])
    }
    setLoadingGenre(false)
  }, [activeGenre, mediaTab])

  // Reset genre quand on change media tab
  useEffect(() => {
    setActiveGenre(null)
    setGenreResults([])
  }, [mediaTab])

  const genres = mediaTab === 'movie' ? MOVIE_GENRES : TV_GENRES
  const watchlistSet = new Set(watchlistIds)

  // Items à afficher (par priorité : recherche > genre > trending)
  const displayItems = query.trim()
    ? results
    : activeGenre
      ? genreResults
      : trending.filter(i => i.media_type === mediaTab || !mediaTab)

  const showEmpty = !loading && !loadingGenre && displayItems.length === 0 && !noApiKey

  return (
    <div className="min-h-full" style={{ background: C.bg }}>
      {/* Header + recherche */}
      <div className="px-4 pt-4 pb-3">
        <h2 className="text-xl font-bold mb-3" style={{ color: C.textPri }}>Découvrir</h2>

        {/* Barre de recherche */}
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-4"
          style={{ background: C.card, border: `0.5px solid ${C.border}` }}>
          <Search size={16} color={C.textMuted} className="flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Rechercher un film ou une série…"
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: C.textPri }}
          />
          {query && (
            <button onClick={() => setQuery('')} className="flex-shrink-0 active:scale-90 transition-all">
              <X size={15} color={C.textMuted} />
            </button>
          )}
        </div>

        {/* Pas de clé API */}
        {noApiKey && (
          <div className="rounded-xl p-4 text-center"
            style={{ background: C.card, border: `0.5px solid ${C.border}` }}>
            <p className="text-3xl mb-2">🔑</p>
            <p className="font-medium mb-1" style={{ color: C.textSec }}>Clé TMDB manquante</p>
            <p className="text-sm" style={{ color: C.textMuted }}>
              Ajoute <code className="px-1 py-0.5 rounded text-xs"
                style={{ background: '#2d1059', color: C.amber }}>VITE_TMDB_API_KEY</code> dans Vercel pour activer la découverte
            </p>
          </div>
        )}

        {/* Toggle Films / Séries (uniquement si pas de recherche) */}
        {!query && !noApiKey && (
          <div className="flex rounded-xl p-1 mb-3" style={{ background: C.card, border: `0.5px solid ${C.border}` }}>
            {[
              { id: 'movie', label: '🎬 Films' },
              { id: 'tv', label: '📺 Séries' },
            ].map(t => (
              <button key={t.id} onClick={() => setMediaTab(t.id)}
                className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: mediaTab === t.id ? C.violet : 'transparent',
                  color: mediaTab === t.id ? '#fff' : C.textMuted,
                }}>
                {t.label}
              </button>
            ))}
          </div>
        )}

        {/* Genres (si pas de recherche) */}
        {!query && !noApiKey && (
          <div className="overflow-x-auto -mx-4 px-4">
            <div className="flex gap-2 pb-1" style={{ width: 'max-content' }}>
              {genres.map(g => (
                <button key={g.id}
                  onClick={() => handleGenre(g.id)}
                  className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95"
                  style={{
                    background: activeGenre === g.id ? C.amber : C.card,
                    color: activeGenre === g.id ? '#0d0620' : C.textSec,
                    border: `0.5px solid ${activeGenre === g.id ? C.amber : C.border}`,
                  }}>
                  {g.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Résultats */}
      <div className="px-4 pb-6">
        {/* Titre de section */}
        {!query && !activeGenre && !loading && (
          <p className="text-[11px] uppercase tracking-widest mb-3" style={{ color: C.textMuted }}>
            Tendances de la semaine
          </p>
        )}
        {activeGenre && !loading && (
          <p className="text-[11px] uppercase tracking-widest mb-3" style={{ color: C.textMuted }}>
            {genres.find(g => g.id === activeGenre)?.name ?? 'Genre'}
          </p>
        )}
        {query && !loading && results.length > 0 && (
          <p className="text-[11px] uppercase tracking-widest mb-3" style={{ color: C.textMuted }}>
            {results.length} résultat{results.length > 1 ? 's' : ''}
          </p>
        )}

        {/* Spinner */}
        {(loading || loadingGenre) && (
          <div className="flex items-center justify-center py-12">
            <div className="w-7 h-7 rounded-full border-2 animate-spin"
              style={{ borderColor: C.violet, borderTopColor: 'transparent' }} />
          </div>
        )}

        {/* Empty state */}
        {showEmpty && (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">{query ? '🔍' : '✨'}</p>
            <p className="font-medium" style={{ color: C.textSec }}>
              {query ? 'Aucun résultat' : 'Aucun contenu trouvé'}
            </p>
            {query && (
              <p className="text-sm mt-1" style={{ color: C.textMuted }}>
                Essaie un autre terme
              </p>
            )}
          </div>
        )}

        {/* Grille */}
        {!loading && !loadingGenre && displayItems.length > 0 && (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {displayItems.map(item => (
              <MediaCard
                key={`${item.id}-${item.media_type}`}
                item={item}
                onAdd={onAdd}
                isInWatchlist={watchlistSet.has(`${item.id}-${item.media_type}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
