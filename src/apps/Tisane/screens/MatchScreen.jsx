import { useState, useEffect, useRef, useCallback } from 'react'
import { SkipForward, Info, Moon } from 'lucide-react'
import {
  getTrending, discoverCeSoir, getDetails,
  getStreamingProviders, getCast, getPosterUrl, getBackdropUrl,
  normalizeTmdbItem, formatRuntime,
} from '../services/tmdb'

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

const SWIPE_THRESHOLD = 80

// ─── Overlay Match ! ──────────────────────────────────────────────────────────
function MatchOverlay({ item, onClose }) {
  const poster = getPosterUrl(item?.poster_path, 'w342')
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6"
      style={{ background: 'rgba(10,2,30,0.96)' }}
      onClick={onClose}>
      <div className="text-center">
        <div className="text-6xl mb-2 animate-bounce">🎉</div>
        <h2 className="text-3xl font-bold mb-1" style={{ color: C.amber }}>C'est un Match !</h2>
        <p className="text-base mb-6" style={{ color: C.textSec }}>Vous voulez tous les deux voir</p>
        {poster && (
          <div className="w-32 rounded-2xl overflow-hidden mx-auto mb-4 shadow-2xl"
            style={{ border: `2px solid ${C.amber}` }}>
            <img src={poster} alt={item.title} className="w-full" />
          </div>
        )}
        <p className="text-xl font-bold mb-1" style={{ color: C.textPri }}>{item?.title}</p>
        {item?.release_year && (
          <p className="text-sm mb-8" style={{ color: C.textMuted }}>{item.release_year}</p>
        )}
        <button onClick={onClose}
          className="px-8 py-3 rounded-2xl font-bold text-base active:scale-95 transition-all"
          style={{ background: C.amber, color: '#0d0620' }}>
          Super ! ✨
        </button>
      </div>
    </div>
  )
}

// ─── Carte swipeable ──────────────────────────────────────────────────────────
function SwipeCard({ item, onVote, flipped, onFlip, details, loadingDetails }) {
  const touchStartX = useRef(null)
  const touchStartY = useRef(null)
  const [swipeOffset, setSwipeOffset] = useState(0)

  const backdrop = getBackdropUrl(item.backdrop_path) || getPosterUrl(item.poster_path, 'w500')
  const poster = getPosterUrl(item.poster_path, 'w342')
  const providers = details ? getStreamingProviders(details) : []
  const cast = details ? getCast(details) : []

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    setSwipeOffset(0)
  }

  const handleTouchMove = (e) => {
    if (touchStartX.current === null) return
    const dx = e.touches[0].clientX - touchStartX.current
    const dy = e.touches[0].clientY - touchStartY.current
    if (Math.abs(dy) > Math.abs(dx) * 1.5) return
    setSwipeOffset(dx)
  }

  const handleTouchEnd = () => {
    if (Math.abs(swipeOffset) >= SWIPE_THRESHOLD) {
      onVote(swipeOffset > 0 ? 'heart' : 'later')
    }
    setSwipeOffset(0)
    touchStartX.current = null
    touchStartY.current = null
  }

  const rotation = swipeOffset * 0.04
  const opacity = Math.max(0.6, 1 - Math.abs(swipeOffset) / 300)

  return (
    <div
      style={{
        transform: `translateX(${swipeOffset}px) rotate(${rotation}deg)`,
        transition: swipeOffset === 0 ? 'transform 0.3s ease' : 'none',
        opacity,
        cursor: 'grab',
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="w-full select-none">

      {/* Indicateurs swipe */}
      <div className="absolute top-6 left-5 z-20 px-3 py-1.5 rounded-xl border-2 font-bold text-lg"
        style={{
          borderColor: '#ef4444', color: '#ef4444',
          opacity: swipeOffset < -20 ? Math.min(1, (-swipeOffset - 20) / 60) : 0,
          background: 'rgba(0,0,0,0.4)',
        }}>😬</div>
      <div className="absolute top-6 right-5 z-20 px-3 py-1.5 rounded-xl border-2 font-bold text-lg"
        style={{
          borderColor: '#10b981', color: '#10b981',
          opacity: swipeOffset > 20 ? Math.min(1, (swipeOffset - 20) / 60) : 0,
          background: 'rgba(0,0,0,0.4)',
        }}>❤️</div>

      <div className="rounded-3xl overflow-hidden relative"
        style={{ background: C.card, border: `1px solid ${C.border}` }}>

        {/* ── Face A ── */}
        {!flipped && (
          <div onClick={onFlip}>
            <div className="relative" style={{ aspectRatio: '16/10' }}>
              {backdrop
                ? <img src={backdrop} alt={item.title} className="w-full h-full object-cover" />
                : (
                  <div className="w-full h-full flex items-center justify-center"
                    style={{ background: '#1a0836' }}>
                    <span className="text-6xl">{item.media_type === 'tv' ? '📺' : '🎬'}</span>
                  </div>
                )
              }
              <div className="absolute inset-0"
                style={{ background: 'linear-gradient(to top, rgba(13,6,32,0.95) 0%, rgba(13,6,32,0.3) 50%, transparent 100%)' }} />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <div className="flex items-end justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-2xl font-bold leading-tight" style={{ color: C.textPri }}>
                      {item.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {item.release_year && <span className="text-sm" style={{ color: C.textSec }}>{item.release_year}</span>}
                      {item.vote_average > 0 && (
                        <span className="text-sm font-medium" style={{ color: C.amber }}>★ {Number(item.vote_average).toFixed(1)}</span>
                      )}
                      {item.runtime && <span className="text-sm" style={{ color: C.textSec }}>{formatRuntime(item.runtime)}</span>}
                      {item.seasons_count && (
                        <span className="text-sm" style={{ color: C.textSec }}>{item.seasons_count} saison{item.seasons_count > 1 ? 's' : ''}</span>
                      )}
                      <span className="text-xs px-1.5 py-0.5 rounded-md"
                        style={{ background: 'rgba(124,58,237,0.3)', color: '#c4b5fd' }}>
                        {item.media_type === 'tv' ? 'Série' : 'Film'}
                      </span>
                      {/* Badge "Ton partenaire a aimé" */}
                      {item._partnerLiked && (
                        <span className="text-xs px-1.5 py-0.5 rounded-md font-bold"
                          style={{ background: '#f59e0b30', color: C.amber, border: `0.5px solid ${C.amber}60` }}>
                          ❤️ partenaire
                        </span>
                      )}
                    </div>
                  </div>
                  {poster && (
                    <div className="flex-shrink-0 w-14 rounded-xl overflow-hidden shadow-lg"
                      style={{ border: '1.5px solid rgba(255,255,255,0.15)' }}>
                      <img src={poster} alt={item.title} className="w-full" />
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-1.5 py-3"
              style={{ borderTop: `0.5px solid ${C.border}` }}>
              <Info size={13} color={C.textMuted} />
              <span className="text-xs" style={{ color: C.textMuted }}>Touche pour voir les détails</span>
            </div>
          </div>
        )}

        {/* ── Face B ── */}
        {flipped && (
          <div onClick={onFlip} className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-base font-bold" style={{ color: C.textPri }}>{item.title}</p>
              <span className="text-xs" style={{ color: C.textMuted }}>Touche pour retourner</span>
            </div>
            {item.overview ? (
              <p className="text-sm leading-relaxed mb-4" style={{ color: C.textSec }}>
                {item.overview.length > 280 ? item.overview.substring(0, 280) + '…' : item.overview}
              </p>
            ) : (
              <p className="text-sm mb-4" style={{ color: C.textMuted }}>Pas de synopsis disponible.</p>
            )}
            {loadingDetails && (
              <div className="flex items-center gap-2 mb-3">
                <div className="w-4 h-4 rounded-full border-2 animate-spin"
                  style={{ borderColor: C.violet, borderTopColor: 'transparent' }} />
                <span className="text-xs" style={{ color: C.textMuted }}>Chargement des détails…</span>
              </div>
            )}
            {cast.length > 0 && (
              <div className="mb-3">
                <p className="text-[11px] uppercase tracking-widest mb-1.5" style={{ color: C.textMuted }}>Avec</p>
                <p className="text-sm" style={{ color: C.textSec }}>{cast.join(', ')}</p>
              </div>
            )}
            {providers.length > 0 && (
              <div>
                <p className="text-[11px] uppercase tracking-widest mb-2" style={{ color: C.textMuted }}>Disponible sur</p>
                <div className="flex flex-wrap gap-2">
                  {providers.map(p => (
                    <span key={p.id} className="text-[11px] font-medium px-2.5 py-1 rounded-lg"
                      style={{ background: p.color + '30', color: C.textSec, border: `0.5px solid ${p.color}50` }}>
                      {p.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {!loadingDetails && providers.length === 0 && (
              <p className="text-xs" style={{ color: C.textMuted }}>Non disponible en streaming FR</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── MatchScreen ──────────────────────────────────────────────────────────────
export default function MatchScreen({ items, profile, onVote, onAddFromGlobal }) {
  const [toSoirMode, setToSoirMode] = useState(false)
  const [trendingCards, setTrendingCards] = useState([])
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [matchedItem, setMatchedItem] = useState(null)
  const [cardDetails, setCardDetails] = useState(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [loadingTrending, setLoadingTrending] = useState(false)
  const [voting, setVoting] = useState(false)
  const prevItemsRef = useRef([])

  // Détection nouveau match via Realtime
  useEffect(() => {
    const prevMatched = new Set(prevItemsRef.current.filter(i => i.status === 'matched').map(i => i.id))
    const newlyMatched = items.filter(i => i.status === 'matched' && !prevMatched.has(i.id))
    if (newlyMatched.length > 0) setMatchedItem(newlyMatched[0])
    prevItemsRef.current = items
  }, [items])

  // ── Priority 1 : items que le partenaire a likés mais que je n'ai pas encore vus
  const priority1 = items
    .filter(i =>
      i.status === 'to_watch' &&
      (i.liked_by ?? []).length > 0 &&
      !(i.liked_by ?? []).includes(profile?.id)
    )
    .map(i => ({ ...i, _source: 'watchlist', _partnerLiked: true }))

  // ── Priority 2 : trending TMDB filtré (items non encore votés par moi)
  const votedIds = new Set(
    items
      .filter(i => (i.liked_by ?? []).includes(profile?.id) || (i.passed_by ?? []).includes(profile?.id))
      .map(i => `${i.tmdb_id}-${i.media_type}`)
  )

  const loadTrending = useCallback(async () => {
    setLoadingTrending(true)
    try {
      const raw = toSoirMode ? await discoverCeSoir() : await getTrending('week')
      const filtered = raw.filter(c => !votedIds.has(`${c.id}-${c.media_type}`))
      setTrendingCards(filtered)
    } catch { setTrendingCards([]) }
    setLoadingTrending(false)
  }, [toSoirMode, votedIds.size]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadTrending() }, [toSoirMode]) // eslint-disable-line react-hooks/exhaustive-deps

  const priority2 = trendingCards.map(c => ({ ...normalizeTmdbItem(c), _source: 'catalogue', _partnerLiked: false }))

  // Queue unifiée : Priority 1 d'abord, puis Priority 2
  const queue = [...priority1, ...priority2]
  const currentCard = queue[idx] ?? null
  const remaining = queue.length - idx

  // Reset flip + détails quand la carte change
  useEffect(() => {
    setFlipped(false)
    setCardDetails(null)
  }, [idx])

  // Charger les détails TMDB quand la carte est retournée
  useEffect(() => {
    if (!flipped || !currentCard) return
    setCardDetails(null)
    setLoadingDetails(true)
    const tmdbId = currentCard.tmdb_id ?? currentCard.id
    getDetails(tmdbId, currentCard.media_type)
      .then(d => setCardDetails(d))
      .catch(() => setCardDetails(null))
      .finally(() => setLoadingDetails(false))
  }, [flipped]) // eslint-disable-line react-hooks/exhaustive-deps

  const goNext = () => setIdx(i => i + 1)

  const handleVote = async (voteType) => {
    if (voting || !currentCard) return
    setVoting(true)
    try {
      if (currentCard._source === 'watchlist') {
        await onVote(currentCard.id, voteType)
      } else {
        if (voteType !== 'skip') await onAddFromGlobal(currentCard, voteType)
      }
    } finally {
      setVoting(false)
      goNext()
    }
  }

  // Indicateur de section en cours
  const inPriority1 = idx < priority1.length
  const showP1Banner = priority1.length > 0 && inPriority1

  return (
    <div className="min-h-full" style={{ background: C.bg }}>
      {matchedItem && <MatchOverlay item={matchedItem} onClose={() => setMatchedItem(null)} />}

      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <h2 className="text-xl font-bold mb-3" style={{ color: C.textPri }}>Match</h2>

        {/* Mode Ce soir */}
        <button
          onClick={() => { setToSoirMode(v => !v); setIdx(0) }}
          className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all active:scale-95"
          style={{
            background: toSoirMode ? '#f59e0b20' : C.card,
            border: `0.5px solid ${toSoirMode ? C.amber : C.border}`,
          }}>
          <div className="flex items-center gap-2">
            <Moon size={15} color={toSoirMode ? C.amber : C.textMuted} />
            <span className="text-sm font-medium" style={{ color: toSoirMode ? C.amber : C.textMuted }}>
              Mode "Ce soir"
            </span>
            <span className="text-[10px]" style={{ color: C.textMuted }}>· films &lt; 1h40</span>
          </div>
          <div className="w-9 h-5 rounded-full transition-all relative"
            style={{ background: toSoirMode ? C.amber : '#2d1059' }}>
            <div className="absolute top-0.5 w-4 h-4 rounded-full transition-all"
              style={{ background: '#fff', left: toSoirMode ? 'calc(100% - 18px)' : '2px' }} />
          </div>
        </button>
      </div>

      {/* Zone principale */}
      <div className="px-4 pb-6">

        {/* Banner Priority 1 */}
        {showP1Banner && (
          <div className="mb-3 px-3 py-2 rounded-xl flex items-center gap-2"
            style={{ background: '#f59e0b15', border: `0.5px solid ${C.amber}40` }}>
            <span className="text-sm">❤️</span>
            <p className="text-xs font-medium" style={{ color: C.amber }}>
              Ton partenaire a aimé {priority1.length} contenu{priority1.length > 1 ? 's' : ''} — à toi de voter !
            </p>
          </div>
        )}

        {loadingTrending && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 rounded-full border-2 animate-spin"
              style={{ borderColor: C.violet, borderTopColor: 'transparent' }} />
            <p className="text-sm" style={{ color: C.textSec }}>Chargement du catalogue…</p>
          </div>
        )}

        {/* Carte active */}
        {!loadingTrending && currentCard && (
          <div>
            {remaining > 1 && (
              <p className="text-center text-xs mb-3" style={{ color: C.textMuted }}>
                {remaining} contenu{remaining > 1 ? 's' : ''} restant{remaining > 1 ? 's' : ''}
              </p>
            )}

            <div className="relative mb-5">
              {remaining > 1 && (
                <div className="absolute inset-x-0 top-2 mx-4 rounded-3xl"
                  style={{ background: C.card, border: `1px solid ${C.border}`, height: 60, zIndex: 0 }} />
              )}
              <div className="relative" style={{ zIndex: 1 }}>
                <SwipeCard
                  item={currentCard}
                  onVote={handleVote}
                  flipped={flipped}
                  onFlip={() => setFlipped(v => !v)}
                  details={cardDetails}
                  loadingDetails={loadingDetails}
                />
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex items-center justify-center gap-5">
              <button onClick={() => !voting && handleVote('later')} disabled={voting}
                className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all"
                style={{ background: '#1a0836', border: '2px solid #ef444460' }}>
                <span className="text-2xl">😬</span>
              </button>
              <button onClick={() => !voting && goNext()} disabled={voting}
                className="w-12 h-12 rounded-full flex items-center justify-center active:scale-90 transition-all"
                style={{ background: C.card, border: `1.5px solid ${C.border}` }}>
                <SkipForward size={18} color={C.textMuted} />
              </button>
              <button onClick={() => !voting && handleVote('heart')} disabled={voting}
                className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all"
                style={{ background: '#7c3aed20', border: '2px solid #7c3aed80' }}>
                <span className="text-2xl">❤️</span>
              </button>
            </div>
            <p className="text-center text-[11px] mt-3" style={{ color: C.textMuted }}>
              Swipe ← 😬  ·  ⏭️ passer  ·  ❤️ swipe →
            </p>
          </div>
        )}

        {/* Plus de cartes */}
        {!loadingTrending && !currentCard && (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">✨</p>
            <p className="font-bold text-lg mb-2" style={{ color: C.textPri }}>Tout exploré !</p>
            <p className="text-sm mb-6" style={{ color: C.textSec }}>Plus de contenus à voter pour le moment</p>
            <button onClick={() => { setIdx(0); loadTrending() }}
              className="px-6 py-3 rounded-2xl font-bold text-sm active:scale-95 transition-all"
              style={{ background: C.violet, color: '#fff' }}>
              Recharger
            </button>
          </div>
        )}

        {!import.meta.env.VITE_TMDB_API_KEY && !currentCard && (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">🔑</p>
            <p className="font-medium mb-1" style={{ color: C.textSec }}>Clé TMDB manquante</p>
            <p className="text-sm" style={{ color: C.textMuted }}>
              Ajoute <code className="px-1 rounded"
                style={{ background: '#2d1059', color: C.amber }}>VITE_TMDB_API_KEY</code> dans Vercel
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
