import { useState, useEffect, useRef, useCallback } from 'react'
import { Heart, Clock, SkipForward, Info, X, Moon } from 'lucide-react'
import { getTrending, discoverCeSoir, getDetails, getStreamingProviders, getCast, getPosterUrl, getBackdropUrl, normalizeTmdbItem, formatRuntime } from '../services/tmdb'

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
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6"
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
        <button
          onClick={onClose}
          className="px-8 py-3 rounded-2xl font-bold text-base active:scale-95 transition-all"
          style={{ background: C.amber, color: '#0d0620' }}>
          Super ! ✨
        </button>
        <p className="text-xs mt-4" style={{ color: C.textMuted }}>Appuie n'importe où pour continuer</p>
      </div>
    </div>
  )
}

// ─── Carte swipeable ──────────────────────────────────────────────────────────
function SwipeCard({ item, onVote, flipped, onFlip, details, loadingDetails }) {
  const cardRef = useRef(null)
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
    // Ignorer les scrolls verticaux
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
      ref={cardRef}
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
      <div className="absolute top-6 left-5 z-20 px-3 py-1.5 rounded-xl border-2 font-bold text-lg transition-opacity"
        style={{
          borderColor: '#ef4444',
          color: '#ef4444',
          opacity: swipeOffset < -20 ? Math.min(1, (-swipeOffset - 20) / 60) : 0,
          background: 'rgba(0,0,0,0.4)',
        }}>
        😬
      </div>
      <div className="absolute top-6 right-5 z-20 px-3 py-1.5 rounded-xl border-2 font-bold text-lg transition-opacity"
        style={{
          borderColor: '#10b981',
          color: '#10b981',
          opacity: swipeOffset > 20 ? Math.min(1, (swipeOffset - 20) / 60) : 0,
          background: 'rgba(0,0,0,0.4)',
        }}>
        ❤️
      </div>

      <div className="rounded-3xl overflow-hidden relative"
        style={{ background: C.card, border: `1px solid ${C.border}` }}>

        {/* Face A : visuel */}
        {!flipped && (
          <div onClick={onFlip}>
            {/* Image */}
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
              {/* Gradient overlay */}
              <div className="absolute inset-0"
                style={{ background: 'linear-gradient(to top, rgba(13,6,32,0.95) 0%, rgba(13,6,32,0.3) 50%, transparent 100%)' }} />

              {/* Info en bas */}
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <div className="flex items-end justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-2xl font-bold leading-tight" style={{ color: C.textPri }}>
                      {item.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {item.release_year && (
                        <span className="text-sm" style={{ color: C.textSec }}>{item.release_year}</span>
                      )}
                      {item.vote_average > 0 && (
                        <span className="text-sm font-medium" style={{ color: C.amber }}>
                          ★ {Number(item.vote_average).toFixed(1)}
                        </span>
                      )}
                      {item.runtime && (
                        <span className="text-sm" style={{ color: C.textSec }}>
                          {formatRuntime(item.runtime)}
                        </span>
                      )}
                      {item.seasons_count && (
                        <span className="text-sm" style={{ color: C.textSec }}>
                          {item.seasons_count} saison{item.seasons_count > 1 ? 's' : ''}
                        </span>
                      )}
                      <span className="text-xs px-1.5 py-0.5 rounded-md"
                        style={{ background: 'rgba(124,58,237,0.3)', color: '#c4b5fd' }}>
                        {item.media_type === 'tv' ? 'Série' : 'Film'}
                      </span>
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

            {/* Hint détails */}
            <div className="flex items-center justify-center gap-1.5 py-3"
              style={{ borderTop: `0.5px solid ${C.border}` }}>
              <Info size={13} color={C.textMuted} />
              <span className="text-xs" style={{ color: C.textMuted }}>Touche pour voir les détails</span>
            </div>
          </div>
        )}

        {/* Face B : détails */}
        {flipped && (
          <div onClick={onFlip}>
            <div className="p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-base font-bold" style={{ color: C.textPri }}>{item.title}</p>
                <span className="text-xs" style={{ color: C.textMuted }}>Touche pour retourner</span>
              </div>

              {/* Synopsis */}
              {item.overview ? (
                <p className="text-sm leading-relaxed mb-4" style={{ color: C.textSec }}>
                  {item.overview.length > 280 ? item.overview.substring(0, 280) + '…' : item.overview}
                </p>
              ) : (
                <p className="text-sm mb-4" style={{ color: C.textMuted }}>Pas de synopsis disponible.</p>
              )}

              {/* Casting */}
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

              {/* Plateformes */}
              {providers.length > 0 && (
                <div>
                  <p className="text-[11px] uppercase tracking-widest mb-2" style={{ color: C.textMuted }}>
                    Disponible sur
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {providers.map(p => (
                      <span key={p.id}
                        className="text-[11px] font-medium px-2.5 py-1 rounded-lg"
                        style={{ background: p.color + '30', color: C.textSec, border: `0.5px solid ${p.color}50` }}>
                        {p.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {!loadingDetails && providers.length === 0 && (
                <p className="text-xs" style={{ color: C.textMuted }}>
                  Non disponible en streaming FR
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── MatchScreen ──────────────────────────────────────────────────────────────
export default function MatchScreen({ items, profile, onVote, onAddFromGlobal, vetos }) {
  const [source, setSource] = useState('watchlist') // 'watchlist' | 'catalogue'
  const [toSoirMode, setToSoirMode] = useState(false)
  const [catalogueCards, setCatalogueCards] = useState([])
  const [catalogueIdx, setCatalogueIdx] = useState(0)
  const [watchlistIdx, setWatchlistIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [matchedItem, setMatchedItem] = useState(null)
  const [cardDetails, setCardDetails] = useState(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [loadingCatalogue, setLoadingCatalogue] = useState(false)
  const [voting, setVoting] = useState(false)
  const prevItemsRef = useRef([])

  // Détection de nouveau match via Realtime (items changent)
  useEffect(() => {
    const prevMatched = new Set(prevItemsRef.current.filter(i => i.status === 'matched').map(i => i.id))
    const newlyMatched = items.filter(i => i.status === 'matched' && !prevMatched.has(i.id))
    if (newlyMatched.length > 0) {
      setMatchedItem(newlyMatched[0])
    }
    prevItemsRef.current = items
  }, [items])

  // Charger catalogue TMDB
  const loadCatalogue = useCallback(async () => {
    setLoadingCatalogue(true)
    setCatalogueIdx(0)
    setFlipped(false)
    setCardDetails(null)
    try {
      const cards = toSoirMode ? await discoverCeSoir() : await getTrending('week')
      // Filtrer les contenus déjà dans la watchlist avec un like ou pass
      const watchlistMap = new Map(items.map(i => [`${i.tmdb_id}-${i.media_type}`, i]))
      const filtered = cards.filter(c => {
        const existing = watchlistMap.get(`${c.id}-${c.media_type}`)
        if (!existing) return true
        // Garder si l'utilisateur courant n'a pas encore voté
        return !(existing.liked_by ?? []).includes(profile?.id) && !(existing.passed_by ?? []).includes(profile?.id)
      })
      setCatalogueCards(filtered)
    } catch (e) {
      console.error('TMDB error:', e)
      setCatalogueCards([])
    }
    setLoadingCatalogue(false)
  }, [toSoirMode, items, profile?.id])

  useEffect(() => {
    if (source === 'catalogue') loadCatalogue()
  }, [source, toSoirMode]) // eslint-disable-line react-hooks/exhaustive-deps

  // Charger les détails TMDB quand la carte est retournée
  useEffect(() => {
    if (!flipped) return
    const card = currentCard
    if (!card) return
    setCardDetails(null)
    setLoadingDetails(true)
    getDetails(card.tmdb_id ?? card.id, card.media_type)
      .then(d => setCardDetails(d))
      .catch(() => setCardDetails(null))
      .finally(() => setLoadingDetails(false))
  }, [flipped]) // eslint-disable-line react-hooks/exhaustive-deps

  // Reset flip quand on change de carte
  const goNext = () => {
    setFlipped(false)
    setCardDetails(null)
    if (source === 'watchlist') {
      setWatchlistIdx(i => i + 1)
    } else {
      setCatalogueIdx(i => i + 1)
    }
  }

  // Items watchlist sans vote de l'utilisateur courant
  const pendingWatchlistItems = items.filter(i =>
    i.status === 'to_watch' &&
    !(i.liked_by ?? []).includes(profile?.id) &&
    !(i.passed_by ?? []).includes(profile?.id)
  )

  const currentCard = source === 'watchlist'
    ? pendingWatchlistItems[watchlistIdx]
    : catalogueCards[catalogueIdx]
      ? { ...normalizeTmdbItem(catalogueCards[catalogueIdx]) }
      : null

  const totalCards = source === 'watchlist' ? pendingWatchlistItems.length : catalogueCards.length
  const currentIdx = source === 'watchlist' ? watchlistIdx : catalogueIdx
  const remaining = totalCards - currentIdx

  const handleVote = async (voteType) => {
    if (voting || !currentCard) return
    setVoting(true)
    try {
      if (source === 'watchlist') {
        await onVote(currentCard.id, voteType)
      } else {
        await onAddFromGlobal(currentCard, voteType)
      }
    } finally {
      setVoting(false)
      goNext()
    }
  }

  const handleSkip = () => {
    if (!voting) goNext()
  }

  return (
    <div className="min-h-full" style={{ background: C.bg }}>
      {/* Match overlay */}
      {matchedItem && (
        <MatchOverlay
          item={matchedItem}
          onClose={() => setMatchedItem(null)}
        />
      )}

      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <h2 className="text-xl font-bold mb-3" style={{ color: C.textPri }}>Match</h2>

        {/* Source toggle */}
        <div className="flex rounded-xl p-1 mb-3" style={{ background: C.card, border: `0.5px solid ${C.border}` }}>
          {[
            { id: 'watchlist', label: '📋 Notre liste' },
            { id: 'catalogue', label: '🌍 Catalogue' },
          ].map(s => (
            <button key={s.id} onClick={() => { setSource(s.id); setFlipped(false) }}
              className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: source === s.id ? C.violet : 'transparent',
                color: source === s.id ? '#fff' : C.textMuted,
              }}>
              {s.label}
            </button>
          ))}
        </div>

        {/* Mode Ce soir (catalogue uniquement) */}
        {source === 'catalogue' && (
          <button
            onClick={() => setToSoirMode(v => !v)}
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
                style={{
                  background: '#fff',
                  left: toSoirMode ? 'calc(100% - 18px)' : '2px',
                }} />
            </div>
          </button>
        )}
      </div>

      {/* Zone principale */}
      <div className="px-4 pb-6">

        {/* Loading catalogue */}
        {loadingCatalogue && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 rounded-full border-2 animate-spin"
              style={{ borderColor: C.violet, borderTopColor: 'transparent' }} />
            <p className="text-sm" style={{ color: C.textSec }}>Chargement du catalogue…</p>
          </div>
        )}

        {/* Carte active */}
        {!loadingCatalogue && currentCard && (
          <div>
            {/* Compteur */}
            {remaining > 1 && (
              <p className="text-center text-xs mb-3" style={{ color: C.textMuted }}>
                {remaining} {remaining > 1 ? 'contenus' : 'contenu'} restant{remaining > 1 ? 's' : ''}
              </p>
            )}

            <div className="relative mb-5">
              {/* Carte fantôme derrière */}
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
              {/* 😬 Plus tard */}
              <button
                onClick={() => !voting && handleVote('later')}
                disabled={voting}
                className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all"
                style={{ background: '#1a0836', border: '2px solid #ef444460' }}>
                <span className="text-2xl">😬</span>
              </button>

              {/* ⏭️ Passer */}
              <button
                onClick={handleSkip}
                disabled={voting}
                className="w-12 h-12 rounded-full flex items-center justify-center active:scale-90 transition-all"
                style={{ background: C.card, border: `1.5px solid ${C.border}` }}>
                <SkipForward size={18} color={C.textMuted} />
              </button>

              {/* ❤️ Match */}
              <button
                onClick={() => !voting && handleVote('heart')}
                disabled={voting}
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

        {/* Plus de cartes — watchlist */}
        {!loadingCatalogue && !currentCard && source === 'watchlist' && (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">🎉</p>
            <p className="font-bold text-lg mb-2" style={{ color: C.textPri }}>
              {pendingWatchlistItems.length === 0
                ? 'Liste vide'
                : 'Tout vu !'}
            </p>
            <p className="text-sm mb-6" style={{ color: C.textSec }}>
              {pendingWatchlistItems.length === 0
                ? 'Ajoute des films via "Découvrir"'
                : 'Tu as voté sur tous les contenus de ta liste'}
            </p>
            <button
              onClick={() => setSource('catalogue')}
              className="px-6 py-3 rounded-2xl font-bold text-sm active:scale-95 transition-all"
              style={{ background: C.amber, color: '#0d0620' }}>
              Découvrir le catalogue →
            </button>
          </div>
        )}

        {/* Plus de cartes — catalogue */}
        {!loadingCatalogue && !currentCard && source === 'catalogue' && (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">✨</p>
            <p className="font-bold text-lg mb-2" style={{ color: C.textPri }}>Tout exploré !</p>
            <p className="text-sm mb-6" style={{ color: C.textSec }}>
              Rechargeons le catalogue
            </p>
            <button
              onClick={loadCatalogue}
              className="px-6 py-3 rounded-2xl font-bold text-sm active:scale-95 transition-all"
              style={{ background: C.violet, color: '#fff' }}>
              Recharger
            </button>
          </div>
        )}

        {/* Pas de clé API TMDB */}
        {!loadingCatalogue && !currentCard && source === 'catalogue' && catalogueCards.length === 0 && !import.meta.env.VITE_TMDB_API_KEY && (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">🔑</p>
            <p className="font-medium mb-2" style={{ color: C.textSec }}>Clé TMDB manquante</p>
            <p className="text-sm" style={{ color: C.textMuted }}>
              Ajoute <code className="px-1 rounded" style={{ background: '#2d1059', color: C.amber }}>VITE_TMDB_API_KEY</code> dans Vercel
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
