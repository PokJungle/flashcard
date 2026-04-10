import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, X, Plus, Check, Settings, Zap, Play, Trash2, RefreshCw } from 'lucide-react'
import { searchMulti, getTrending, discoverByGenre, getPosterUrl, normalizeTmdbItem, getReleaseYear, getTitle } from '../services/tmdb'

const C = {
  bg: '#0d0620',
  card: '#16082e',
  border: '#2d1059',
  amber: '#f59e0b',
  violet: '#7c3aed',
  green: '#10b981',
  textPri: '#f5f0ff',
  textSec: '#a78bfa',
  textMuted: '#6b4fa0',
}

const STATUS_LABELS = {
  to_watch: { label: 'À voter', color: C.amber },
  matched: { label: 'Matchée', color: C.green },
  watching: { label: 'En cours', color: C.violet },
  watched: { label: 'Vue', color: '#6b7280' },
  vetoed: { label: 'Veto', color: '#ef4444' },
  conflicted: { label: 'Conflit', color: '#f97316' },
}

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

// ─── Carte media (grille catalogue) ──────────────────────────────────────────
function MediaCard({ item, onAdd, watchlistItem }) {
  const [adding, setAdding] = useState(false)
  const poster = getPosterUrl(item.poster_path, 'w185')
  const year = getReleaseYear(item)
  const title = getTitle(item)

  const isInWatchlist = !!watchlistItem
  const statusInfo = watchlistItem ? STATUS_LABELS[watchlistItem.status] : null

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
        {/* Badge statut DB */}
        {statusInfo && (
          <div className="absolute top-1.5 right-1.5">
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md"
              style={{ background: 'rgba(13,6,32,0.9)', color: statusInfo.color, border: `0.5px solid ${statusInfo.color}40` }}>
              {statusInfo.label}
            </span>
          </div>
        )}
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

// ─── Panneau admin ────────────────────────────────────────────────────────────
const ADMIN_FILTERS = [
  { id: 'all', label: 'Tous' },
  { id: 'to_watch', label: 'À voter' },
  { id: 'matched', label: 'Matchés' },
  { id: 'watching', label: 'En cours' },
  { id: 'watched', label: 'Vus' },
  { id: 'conflicted', label: 'Conflits' },
  { id: 'vetoed', label: 'Vetoed' },
]

function AdminPanel({ watchlist, profile }) {
  const [filter, setFilter] = useState('all')
  const [pendingAction, setPendingAction] = useState(null) // itemId en cours de confirmation delete

  // Exclure uniquement les statuts qui n'ont pas de label (sécurité)
  const filtered = watchlist.items.filter(i =>
    (filter === 'all' || i.status === filter)
  )

  const handleForceMatch = async (itemId) => {
    await watchlist.forceMatch(itemId)
  }

  const handleMarkWatching = async (itemId) => {
    await watchlist.markWatching(itemId)
  }

  const handleDelete = async (itemId) => {
    if (pendingAction === itemId) {
      await watchlist.deleteItem(itemId)
      setPendingAction(null)
    } else {
      setPendingAction(itemId)
      setTimeout(() => setPendingAction(p => p === itemId ? null : p), 3000)
    }
  }

  return (
    <div className="px-4 pb-6">
      <div className="flex items-center gap-2 mb-4">
        <Settings size={16} color={C.textSec} />
        <h3 className="font-semibold" style={{ color: C.textPri }}>Base de données</h3>
        <span className="text-xs px-2 py-0.5 rounded-full ml-auto"
          style={{ background: C.card, color: C.textMuted, border: `0.5px solid ${C.border}` }}>
          {watchlist.items.length} items
        </span>
      </div>

      {/* Filtres */}
      <div className="overflow-x-auto -mx-4 px-4 mb-4">
        <div className="flex gap-2 pb-1" style={{ width: 'max-content' }}>
          {ADMIN_FILTERS.map(f => {
            const count = f.id === 'all'
              ? watchlist.items.length
              : watchlist.items.filter(i => i.status === f.id).length
            return (
              <button key={f.id}
                onClick={() => setFilter(f.id)}
                className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95"
                style={{
                  background: filter === f.id ? C.violet : C.card,
                  color: filter === f.id ? '#fff' : C.textSec,
                  border: `0.5px solid ${filter === f.id ? C.violet : C.border}`,
                }}>
                {f.label}
                <span className="opacity-60">{count}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Liste */}
      {filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-4xl mb-3">📭</p>
          <p className="font-medium" style={{ color: C.textSec }}>Aucun item</p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {filtered.map(item => {
          const statusInfo = STATUS_LABELS[item.status] ?? { label: item.status, color: C.textMuted }
          const poster = getPosterUrl(item.poster_path, 'w92')
          const isDeleting = pendingAction === item.id

          return (
            <div key={item.id} className="flex items-center gap-3 rounded-xl p-3"
              style={{ background: C.card, border: `0.5px solid ${C.border}` }}>
              {/* Poster */}
              <div className="w-10 h-14 rounded-lg overflow-hidden flex-shrink-0"
                style={{ background: '#0d0620' }}>
                {poster
                  ? <img src={poster} alt={item.title} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-lg">
                      {item.media_type === 'tv' ? '📺' : '🎬'}
                    </div>
                }
              </div>

              {/* Infos */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: C.textPri }}>
                  {item.title}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px]" style={{ color: C.textMuted }}>
                    {item.media_type === 'tv' ? 'Série' : 'Film'} {item.release_year && `· ${item.release_year}`}
                  </span>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                    style={{ background: `${statusInfo.color}20`, color: statusInfo.color }}>
                    {statusInfo.label}
                  </span>
                </div>
                {item.status === 'watching' && item.media_type === 'tv' && (
                  <p className="text-[10px] mt-0.5" style={{ color: C.textMuted }}>
                    S{item.current_season ?? 1}E{item.current_episode ?? 0}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {/* Ressusciter (conflit) */}
                {item.status === 'conflicted' && (
                  <button
                    onClick={() => watchlist.resurrectItem(item.id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center active:scale-90 transition-all"
                    title="Ressusciter (reset votes)"
                    style={{ background: '#f9731620', border: '0.5px solid #f9731640' }}>
                    <RefreshCw size={14} color="#f97316" />
                  </button>
                )}
                {/* Force match */}
                {item.status === 'to_watch' && (
                  <button
                    onClick={() => handleForceMatch(item.id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center active:scale-90 transition-all"
                    title="Forcer match"
                    style={{ background: `${C.green}20`, border: `0.5px solid ${C.green}40` }}>
                    <Zap size={14} color={C.green} />
                  </button>
                )}
                {/* Passer en cours */}
                {(item.status === 'to_watch' || item.status === 'matched') && (
                  <button
                    onClick={() => handleMarkWatching(item.id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center active:scale-90 transition-all"
                    title="Passer en cours"
                    style={{ background: `${C.violet}20`, border: `0.5px solid ${C.violet}40` }}>
                    <Play size={14} color={C.violet} />
                  </button>
                )}
                {/* Supprimer */}
                {item.status !== 'vetoed' && (
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center active:scale-90 transition-all"
                    title={isDeleting ? 'Confirmer suppression' : 'Supprimer'}
                    style={{
                      background: isDeleting ? '#ef444430' : '#ef444415',
                      border: `0.5px solid ${isDeleting ? '#ef4444' : '#ef444440'}`,
                    }}>
                    <Trash2 size={14} color={isDeleting ? '#ef4444' : '#ef444490'} />
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── DiscoverScreen ───────────────────────────────────────────────────────────
export default function DiscoverScreen({ profile, onAdd, watchlist }) {
  const [mode, setMode] = useState('catalog') // 'catalog' | 'admin'
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [trending, setTrending] = useState([])
  const [mediaTab, setMediaTab] = useState('movie')
  const [activeGenre, setActiveGenre] = useState(null)
  const [genreResults, setGenreResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingGenre, setLoadingGenre] = useState(false)
  const [noApiKey] = useState(!import.meta.env.VITE_TMDB_API_KEY)
  const searchTimeout = useRef(null)

  // Map tmdb_id-media_type → watchlist item pour lookup rapide
  const watchlistMap = new Map(
    (watchlist?.items ?? []).map(i => [`${i.tmdb_id}-${i.media_type}`, i])
  )

  useEffect(() => {
    if (noApiKey) return
    setLoading(true)
    getTrending('week')
      .then(data => setTrending(data.slice(0, 20)))
      .catch(() => setTrending([]))
      .finally(() => setLoading(false))
  }, [noApiKey])

  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
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

  const handleGenre = useCallback(async (genreId) => {
    if (activeGenre === genreId) { setActiveGenre(null); setGenreResults([]); return }
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

  useEffect(() => {
    setActiveGenre(null)
    setGenreResults([])
  }, [mediaTab])

  const genres = mediaTab === 'movie' ? MOVIE_GENRES : TV_GENRES

  const displayItems = query.trim()
    ? results
    : activeGenre
      ? genreResults
      : trending.filter(i => i.media_type === mediaTab)

  const showEmpty = !loading && !loadingGenre && displayItems.length === 0 && !noApiKey

  return (
    <div className="min-h-full" style={{ background: C.bg }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold" style={{ color: C.textPri }}>Découvrir</h2>
          {/* Toggle Catalogue / Admin */}
          <button
            onClick={() => setMode(m => m === 'catalog' ? 'admin' : 'catalog')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95"
            style={{
              background: mode === 'admin' ? C.violet : C.card,
              color: mode === 'admin' ? '#fff' : C.textMuted,
              border: `0.5px solid ${mode === 'admin' ? C.violet : C.border}`,
            }}>
            <Settings size={13} />
            Admin
          </button>
        </div>

        {mode === 'catalog' && (
          <>
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

            {!query && !noApiKey && (
              <div className="flex rounded-xl p-1 mb-3" style={{ background: C.card, border: `0.5px solid ${C.border}` }}>
                {[{ id: 'movie', label: '🎬 Films' }, { id: 'tv', label: '📺 Séries' }].map(t => (
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

            {!query && !noApiKey && (
              <div className="overflow-x-auto -mx-4 px-4">
                <div className="flex gap-2 pb-1" style={{ width: 'max-content' }}>
                  {genres.map(g => (
                    <button key={g.id} onClick={() => handleGenre(g.id)}
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
          </>
        )}
      </div>

      {/* Contenu */}
      {mode === 'admin' ? (
        <AdminPanel watchlist={watchlist} profile={profile} />
      ) : (
        <div className="px-4 pb-6">
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

          {(loading || loadingGenre) && (
            <div className="flex items-center justify-center py-12">
              <div className="w-7 h-7 rounded-full border-2 animate-spin"
                style={{ borderColor: C.violet, borderTopColor: 'transparent' }} />
            </div>
          )}

          {showEmpty && (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">{query ? '🔍' : '✨'}</p>
              <p className="font-medium" style={{ color: C.textSec }}>
                {query ? 'Aucun résultat' : 'Aucun contenu trouvé'}
              </p>
              {query && (
                <p className="text-sm mt-1" style={{ color: C.textMuted }}>Essaie un autre terme</p>
              )}
            </div>
          )}

          {!loading && !loadingGenre && displayItems.length > 0 && (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {displayItems.map(item => (
                <MediaCard
                  key={`${item.id}-${item.media_type}`}
                  item={item}
                  onAdd={onAdd}
                  watchlistItem={watchlistMap.get(`${item.id}-${item.media_type}`) ?? null}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
