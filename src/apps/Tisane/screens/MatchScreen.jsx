import { useState, useEffect, useRef, useCallback } from 'react'
import { SkipForward, Info, Moon, Film, Tv, Clapperboard } from 'lucide-react'
import {
  getStreamingMovies, getNowPlaying, getStreamingSeries, discoverCeSoir,
  getDetails, getStreamingProviders, getCast,
  getPosterUrl, getBackdropUrl, normalizeTmdbItem, formatRuntime,
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
      style={{ background: 'rgba(10,2,30,0.96)' }} onClick={onClose}>
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
        {item?.release_year && <p className="text-sm mb-8" style={{ color: C.textMuted }}>{item.release_year}</p>}
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

  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    setSwipeOffset(0)
  }
  const onTouchMove = (e) => {
    if (touchStartX.current === null) return
    const dx = e.touches[0].clientX - touchStartX.current
    const dy = e.touches[0].clientY - touchStartY.current
    if (Math.abs(dy) > Math.abs(dx) * 1.5) return
    setSwipeOffset(dx)
  }
  const onTouchEnd = () => {
    if (Math.abs(swipeOffset) >= SWIPE_THRESHOLD) onVote(swipeOffset > 0 ? 'heart' : 'later')
    setSwipeOffset(0)
    touchStartX.current = null
  }

  return (
    <div
      style={{
        transform: `translateX(${swipeOffset}px) rotate(${swipeOffset * 0.04}deg)`,
        transition: swipeOffset === 0 ? 'transform 0.3s ease' : 'none',
        opacity: Math.max(0.6, 1 - Math.abs(swipeOffset) / 300),
        cursor: 'grab',
      }}
      onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
      className="w-full select-none">

      {/* Indicateurs directionnels */}
      <div className="absolute top-6 left-5 z-20 px-3 py-1.5 rounded-xl border-2 font-bold text-lg"
        style={{ borderColor:'#ef4444', color:'#ef4444', background:'rgba(0,0,0,0.4)',
          opacity: swipeOffset < -20 ? Math.min(1, (-swipeOffset-20)/60) : 0 }}>😬</div>
      <div className="absolute top-6 right-5 z-20 px-3 py-1.5 rounded-xl border-2 font-bold text-lg"
        style={{ borderColor:'#10b981', color:'#10b981', background:'rgba(0,0,0,0.4)',
          opacity: swipeOffset > 20 ? Math.min(1, (swipeOffset-20)/60) : 0 }}>❤️</div>

      <div className="rounded-3xl overflow-hidden relative"
        style={{ background: C.card, border: `1px solid ${C.border}` }}>

        {/* ── Face A ── */}
        {!flipped && (
          <div onClick={onFlip}>
            <div className="relative" style={{ aspectRatio: '16/10' }}>
              {backdrop
                ? <img src={backdrop} alt={item.title} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center" style={{ background:'#1a0836' }}>
                    <span className="text-6xl">{item.media_type === 'tv' ? '📺' : '🎬'}</span>
                  </div>
              }
              <div className="absolute inset-0"
                style={{ background:'linear-gradient(to top,rgba(13,6,32,0.95) 0%,rgba(13,6,32,0.3) 50%,transparent 100%)' }} />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <div className="flex items-end justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-2xl font-bold leading-tight" style={{ color: C.textPri }}>{item.title}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {item.release_year && <span className="text-sm" style={{ color:C.textSec }}>{item.release_year}</span>}
                      {item.vote_average > 0 && <span className="text-sm font-medium" style={{ color:C.amber }}>★ {Number(item.vote_average).toFixed(1)}</span>}
                      {item.runtime && <span className="text-sm" style={{ color:C.textSec }}>{formatRuntime(item.runtime)}</span>}
                      {item.seasons_count && <span className="text-sm" style={{ color:C.textSec }}>{item.seasons_count} saison{item.seasons_count>1?'s':''}</span>}
                      <span className="text-xs px-1.5 py-0.5 rounded-md"
                        style={{ background:'rgba(124,58,237,0.3)', color:'#c4b5fd' }}>
                        {item.media_type === 'tv' ? 'Série' : 'Film'}
                      </span>
                      {item._partnerLiked && (
                        <span className="text-xs px-1.5 py-0.5 rounded-md font-bold"
                          style={{ background:'#f59e0b30', color:C.amber, border:`0.5px solid ${C.amber}60` }}>
                          ❤️ partenaire
                        </span>
                      )}
                    </div>
                  </div>
                  {poster && (
                    <div className="flex-shrink-0 w-14 rounded-xl overflow-hidden shadow-lg"
                      style={{ border:'1.5px solid rgba(255,255,255,0.15)' }}>
                      <img src={poster} alt={item.title} className="w-full" />
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-1.5 py-3"
              style={{ borderTop:`0.5px solid ${C.border}` }}>
              <Info size={13} color={C.textMuted} />
              <span className="text-xs" style={{ color:C.textMuted }}>Touche pour voir les détails</span>
            </div>
          </div>
        )}

        {/* ── Face B ── */}
        {flipped && (
          <div onClick={onFlip} className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-base font-bold" style={{ color:C.textPri }}>{item.title}</p>
              <span className="text-xs" style={{ color:C.textMuted }}>Touche pour retourner</span>
            </div>
            {item.overview
              ? <p className="text-sm leading-relaxed mb-4" style={{ color:C.textSec }}>
                  {item.overview.length > 280 ? item.overview.substring(0,280)+'…' : item.overview}
                </p>
              : <p className="text-sm mb-4" style={{ color:C.textMuted }}>Pas de synopsis disponible.</p>
            }
            {loadingDetails && (
              <div className="flex items-center gap-2 mb-3">
                <div className="w-4 h-4 rounded-full border-2 animate-spin"
                  style={{ borderColor:C.violet, borderTopColor:'transparent' }} />
                <span className="text-xs" style={{ color:C.textMuted }}>Chargement…</span>
              </div>
            )}
            {cast.length > 0 && (
              <div className="mb-3">
                <p className="text-[11px] uppercase tracking-widest mb-1.5" style={{ color:C.textMuted }}>Avec</p>
                <p className="text-sm" style={{ color:C.textSec }}>{cast.join(', ')}</p>
              </div>
            )}
            {providers.length > 0 && (
              <div>
                <p className="text-[11px] uppercase tracking-widest mb-2" style={{ color:C.textMuted }}>Disponible sur</p>
                <div className="flex flex-wrap gap-2">
                  {providers.map(p => (
                    <span key={p.id} className="text-[11px] font-medium px-2.5 py-1 rounded-lg"
                      style={{ background:p.color+'30', color:C.textSec, border:`0.5px solid ${p.color}50` }}>
                      {p.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {!loadingDetails && providers.length === 0 && (
              <p className="text-xs" style={{ color:C.textMuted }}>Non disponible en streaming FR</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── MatchScreen ──────────────────────────────────────────────────────────────
export default function MatchScreen({ items, profile, onVote, onAddFromGlobal }) {
  const [mediaType, setMediaType] = useState('movie') // 'movie' | 'tv'
  const [inTheaters, setInTheaters] = useState(false)  // films en salle (movies only)
  const [toSoirMode, setToSoirMode] = useState(false)  // < 1h40 (movies only)
  const [catalogCards, setCatalogCards] = useState([])
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [matchedItem, setMatchedItem] = useState(null)
  const [cardDetails, setCardDetails] = useState(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [loadingCatalog, setLoadingCatalog] = useState(false)
  const [voting, setVoting] = useState(false)
  const prevItemsRef = useRef([])

  // Détection nouveau match via Realtime
  useEffect(() => {
    const prevMatched = new Set(prevItemsRef.current.filter(i => i.status === 'matched').map(i => i.id))
    const newlyMatched = items.filter(i => i.status === 'matched' && !prevMatched.has(i.id))
    if (newlyMatched.length > 0) setMatchedItem(newlyMatched[0])
    prevItemsRef.current = items
  }, [items])

  // ── Priority 1 : partenaire a liké, je n'ai pas encore voté — filtré par mediaType
  const priority1 = items
    .filter(i =>
      i.status === 'to_watch' &&
      i.media_type === mediaType &&
      (i.liked_by ?? []).length > 0 &&
      !(i.liked_by ?? []).includes(profile?.id)
    )
    .map(i => ({ ...i, _source: 'watchlist', _partnerLiked: true }))

  // IDs déjà votés par moi
  const votedIds = new Set(
    items
      .filter(i => (i.liked_by ?? []).includes(profile?.id) || (i.passed_by ?? []).includes(profile?.id))
      .map(i => `${i.tmdb_id}-${i.media_type}`)
  )

  const loadCatalog = useCallback(async () => {
    setLoadingCatalog(true)
    try {
      let raw = []
      if (mediaType === 'movie') {
        if (toSoirMode) raw = await discoverCeSoir()
        else if (inTheaters) raw = await getNowPlaying()
        else raw = await getStreamingMovies()
      } else {
        raw = await getStreamingSeries()
      }
      setCatalogCards(raw.filter(c => !votedIds.has(`${c.id}-${c.media_type}`)))
    } catch { setCatalogCards([]) }
    setLoadingCatalog(false)
  }, [mediaType, inTheaters, toSoirMode, votedIds.size]) // eslint-disable-line react-hooks/exhaustive-deps

  // Recharger le catalogue quand le type ou les filtres changent
  useEffect(() => {
    setIdx(0)
    setFlipped(false)
    loadCatalog()
  }, [mediaType, inTheaters, toSoirMode]) // eslint-disable-line react-hooks/exhaustive-deps

  const priority2 = catalogCards.map(c => ({ ...normalizeTmdbItem(c), _source: 'catalogue', _partnerLiked: false }))
  const queue = [...priority1, ...priority2]
  const currentCard = queue[idx] ?? null
  const remaining = queue.length - idx

  // Reset flip quand idx change
  useEffect(() => { setFlipped(false); setCardDetails(null) }, [idx])

  // Fetch détails TMDB quand la carte est retournée
  useEffect(() => {
    if (!flipped || !currentCard) return
    setCardDetails(null)
    setLoadingDetails(true)
    getDetails(currentCard.tmdb_id ?? currentCard.id, currentCard.media_type)
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
      } else if (voteType !== 'skip') {
        await onAddFromGlobal(currentCard, voteType)
      }
    } finally { setVoting(false); goNext() }
  }

  const inP1 = idx < priority1.length

  return (
    <div className="min-h-full" style={{ background: C.bg }}>
      {matchedItem && <MatchOverlay item={matchedItem} onClose={() => setMatchedItem(null)} />}

      {/* Header */}
      <div className="px-4 pt-4 pb-2 space-y-3">
        <h2 className="text-xl font-bold" style={{ color: C.textPri }}>Match</h2>

        {/* Toggle Films / Séries */}
        <div className="flex rounded-xl p-1" style={{ background: C.card, border:`0.5px solid ${C.border}` }}>
          {[
            { id: 'movie', label: 'Films', Icon: Film },
            { id: 'tv', label: 'Séries', Icon: Tv },
          ].map(({ id, label, Icon }) => (
            <button key={id}
              onClick={() => { setMediaType(id); setInTheaters(false); setToSoirMode(false) }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all"
              style={{ background: mediaType === id ? C.violet : 'transparent', color: mediaType === id ? '#fff' : C.textMuted }}>
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* Filtres — Films uniquement */}
        {mediaType === 'movie' && (
          <div className="flex gap-2">
            {/* Ce soir */}
            <button
              onClick={() => { setToSoirMode(v => !v); setInTheaters(false) }}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl transition-all active:scale-95"
              style={{
                background: toSoirMode ? '#f59e0b20' : C.card,
                border: `0.5px solid ${toSoirMode ? C.amber : C.border}`,
              }}>
              <Moon size={13} color={toSoirMode ? C.amber : C.textMuted} />
              <span className="text-xs font-medium" style={{ color: toSoirMode ? C.amber : C.textMuted }}>Ce soir &lt;1h40</span>
            </button>
            {/* En salle */}
            <button
              onClick={() => { setInTheaters(v => !v); setToSoirMode(false) }}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl transition-all active:scale-95"
              style={{
                background: inTheaters ? '#7c3aed20' : C.card,
                border: `0.5px solid ${inTheaters ? C.violet : C.border}`,
              }}>
              <Clapperboard size={13} color={inTheaters ? C.violet : C.textMuted} />
              <span className="text-xs font-medium" style={{ color: inTheaters ? C.violet : C.textMuted }}>En salle</span>
            </button>
          </div>
        )}
      </div>

      {/* Zone principale */}
      <div className="px-4 pb-6 pt-2">

        {/* Banner Priority 1 */}
        {priority1.length > 0 && inP1 && (
          <div className="mb-3 px-3 py-2 rounded-xl flex items-center gap-2"
            style={{ background: '#f59e0b15', border:`0.5px solid ${C.amber}40` }}>
            <span className="text-sm">❤️</span>
            <p className="text-xs font-medium" style={{ color: C.amber }}>
              Ton partenaire a aimé {priority1.length} {mediaType === 'tv' ? 'série' : 'film'}{priority1.length > 1 ? 's' : ''} — à toi !
            </p>
          </div>
        )}

        {loadingCatalog && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 rounded-full border-2 animate-spin"
              style={{ borderColor: C.violet, borderTopColor:'transparent' }} />
            <p className="text-sm" style={{ color: C.textSec }}>Chargement…</p>
          </div>
        )}

        {!loadingCatalog && currentCard && (
          <div>
            {remaining > 1 && (
              <p className="text-center text-xs mb-3" style={{ color: C.textMuted }}>
                {remaining} contenu{remaining > 1 ? 's' : ''} restant{remaining > 1 ? 's' : ''}
              </p>
            )}
            <div className="relative mb-5">
              {remaining > 1 && (
                <div className="absolute inset-x-0 top-2 mx-4 rounded-3xl"
                  style={{ background: C.card, border:`1px solid ${C.border}`, height: 60, zIndex: 0 }} />
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
            <div className="flex items-center justify-center gap-5">
              <button onClick={() => !voting && handleVote('later')} disabled={voting}
                className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all"
                style={{ background:'#1a0836', border:'2px solid #ef444460' }}>
                <span className="text-2xl">😬</span>
              </button>
              <button onClick={() => !voting && goNext()} disabled={voting}
                className="w-12 h-12 rounded-full flex items-center justify-center active:scale-90 transition-all"
                style={{ background: C.card, border:`1.5px solid ${C.border}` }}>
                <SkipForward size={18} color={C.textMuted} />
              </button>
              <button onClick={() => !voting && handleVote('heart')} disabled={voting}
                className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all"
                style={{ background:'#7c3aed20', border:'2px solid #7c3aed80' }}>
                <span className="text-2xl">❤️</span>
              </button>
            </div>
            <p className="text-center text-[11px] mt-3" style={{ color: C.textMuted }}>
              Swipe ← 😬  ·  ⏭️ passer  ·  ❤️ swipe →
            </p>
          </div>
        )}

        {!loadingCatalog && !currentCard && (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">✨</p>
            <p className="font-bold text-lg mb-2" style={{ color: C.textPri }}>Tout exploré !</p>
            <p className="text-sm mb-6" style={{ color: C.textSec }}>Plus de contenus à voter pour le moment</p>
            <button onClick={() => { setIdx(0); loadCatalog() }}
              className="px-6 py-3 rounded-2xl font-bold text-sm active:scale-95 transition-all"
              style={{ background: C.violet, color: '#fff' }}>
              Recharger
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
