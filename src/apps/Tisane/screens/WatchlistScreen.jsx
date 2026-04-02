import { useState } from 'react'
import { ChevronDown, ChevronUp, Plus, Check, Zap } from 'lucide-react'
import { getPosterUrl } from '../services/tmdb'

// ─── Couleurs thème cinéma ─────────────────────────────────────────────────────
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

// ─── Petit badge de statut ────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    matched: { label: 'Match ❤️', bg: '#7c3aed22', color: '#a78bfa' },
    watching: { label: 'En cours', bg: '#f59e0b22', color: '#f59e0b' },
    watched: { label: 'Vu ✓', bg: '#10b98122', color: '#10b981' },
    to_watch: { label: 'À voir', bg: '#1e1b4b', color: '#6b4fa0' },
  }
  const s = map[status] ?? map.to_watch
  return (
    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md" style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  )
}

// ─── Carte d'un item watchlist ────────────────────────────────────────────────
function WatchlistItem({ item, onAdvanceEpisode, onAdvanceSeason, onMarkWatched, onVeto, vetoAvailable }) {
  const [showActions, setShowActions] = useState(false)
  const [confirmVeto, setConfirmVeto] = useState(false)

  const poster = getPosterUrl(item.poster_path, 'w92')
  const isSeries = item.media_type === 'tv'
  const isWatching = item.status === 'watching'
  const seasonLabel = isSeries ? `S${String(item.current_season ?? 1).padStart(2, '0')}E${String(item.current_episode ?? 0).padStart(2, '0')}` : null

  const handleVeto = async () => {
    if (!confirmVeto) { setConfirmVeto(true); return }
    await onVeto(item.id)
    setConfirmVeto(false)
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: C.card, border: `0.5px solid ${C.border}` }}>
      <div className="flex gap-3 p-3">
        {/* Poster */}
        <div className="flex-shrink-0 w-12 rounded-lg overflow-hidden"
          style={{ background: '#0d0620', aspectRatio: '2/3' }}>
          {poster
            ? <img src={poster} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
            : <div className="w-full h-full flex items-center justify-center text-xl">{isSeries ? '📺' : '🎬'}</div>
          }
        </div>

        {/* Infos */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-snug truncate" style={{ color: C.textPri }}>
            {item.title}
          </p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {item.release_year && (
              <span className="text-[11px]" style={{ color: C.textMuted }}>{item.release_year}</span>
            )}
            {item.vote_average > 0 && (
              <span className="text-[11px]" style={{ color: '#f59e0b' }}>★ {Number(item.vote_average).toFixed(1)}</span>
            )}
            <StatusBadge status={item.status} />
          </div>

          {/* Suivi épisode */}
          {isSeries && (isWatching || item.status === 'matched') && (
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-md"
                style={{ background: '#0d0620', color: C.amber }}>
                {seasonLabel}
              </span>
              <button
                onClick={() => onAdvanceEpisode(item.id)}
                className="w-6 h-6 rounded-full flex items-center justify-center active:scale-90 transition-all"
                style={{ background: C.amber }}>
                <Plus size={12} color="#0d0620" strokeWidth={3} />
              </button>
              <button
                onClick={() => onAdvanceSeason(item.id)}
                className="text-[10px] px-2 py-0.5 rounded-md active:scale-95 transition-all"
                style={{ background: '#2d1059', color: C.textSec }}>
                S+
              </button>
            </div>
          )}
        </div>

        {/* Actions rapides */}
        <button
          onClick={() => setShowActions(v => !v)}
          className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all active:scale-90"
          style={{ background: '#2d1059', color: C.textSec }}>
          {showActions ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Panneau d'actions */}
      {showActions && (
        <div className="px-3 pb-3 flex gap-2 flex-wrap" style={{ borderTop: `0.5px solid ${C.border}` }}>
          {item.status !== 'watched' && (
            <button
              onClick={() => { onMarkWatched(item.id); setShowActions(false) }}
              className="flex items-center gap-1 text-[11px] px-3 py-1.5 rounded-lg active:scale-95 transition-all"
              style={{ background: '#10b98120', color: '#10b981' }}>
              <Check size={12} /> Terminé
            </button>
          )}
          <button
            onClick={handleVeto}
            className="flex items-center gap-1 text-[11px] px-3 py-1.5 rounded-lg active:scale-95 transition-all"
            style={{
              background: confirmVeto ? '#dc262620' : '#2d1059',
              color: confirmVeto ? '#f87171' : C.textMuted,
            }}>
            <Zap size={12} />
            {confirmVeto ? 'Confirmer veto ?' : vetoAvailable ? 'Veto' : 'Veto (0)'}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Groupe collapsible ───────────────────────────────────────────────────────
function Group({ title, emoji, items, onAdvanceEpisode, onAdvanceSeason, onMarkWatched, onVeto, vetoAvailable }) {
  const [open, setOpen] = useState(true)
  if (items.length === 0) return null

  return (
    <div>
      <button
        className="w-full flex items-center justify-between py-2 px-1 active:opacity-70"
        onClick={() => setOpen(v => !v)}>
        <div className="flex items-center gap-2">
          <span className="text-base">{emoji}</span>
          <span className="text-[13px] font-semibold" style={{ color: C.textSec }}>{title}</span>
          <span className="text-[11px] px-1.5 py-0.5 rounded-full"
            style={{ background: '#2d1059', color: C.textMuted }}>
            {items.length}
          </span>
        </div>
        {open ? <ChevronUp size={14} color={C.textMuted} /> : <ChevronDown size={14} color={C.textMuted} />}
      </button>
      {open && (
        <div className="space-y-2">
          {items.map(item => (
            <WatchlistItem
              key={item.id}
              item={item}
              onAdvanceEpisode={onAdvanceEpisode}
              onAdvanceSeason={onAdvanceSeason}
              onMarkWatched={onMarkWatched}
              onVeto={onVeto}
              vetoAvailable={vetoAvailable}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── WatchlistScreen ──────────────────────────────────────────────────────────
export default function WatchlistScreen({
  items,
  loading,
  profile,
  onAdvanceEpisode,
  onAdvanceSeason,
  onMarkWatched,
  vetos,
}) {
  const [tab, setTab] = useState('movies') // 'movies' | 'series'

  const movies = items.filter(i => i.media_type === 'movie')
  const series = items.filter(i => i.media_type === 'tv')

  const movieGroups = [
    { id: 'matched', title: 'Matchs', emoji: '❤️', items: movies.filter(i => i.status === 'matched') },
    { id: 'to_watch', title: 'À voir', emoji: '🎬', items: movies.filter(i => i.status === 'to_watch') },
    { id: 'watched', title: 'Vus', emoji: '✅', items: movies.filter(i => i.status === 'watched') },
  ]

  const seriesGroups = [
    { id: 'watching', title: 'En cours', emoji: '▶️', items: series.filter(i => i.status === 'watching') },
    { id: 'matched', title: 'Matchs', emoji: '❤️', items: series.filter(i => i.status === 'matched') },
    { id: 'to_watch', title: 'À voir', emoji: '📺', items: series.filter(i => i.status === 'to_watch') },
    { id: 'watched', title: 'Terminées', emoji: '✅', items: series.filter(i => i.status === 'watched') },
  ]

  const activeGroups = tab === 'movies' ? movieGroups : seriesGroups
  const totalActive = tab === 'movies' ? movies.length : series.length

  return (
    <div className="min-h-full" style={{ background: C.bg }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <h2 className="text-xl font-bold" style={{ color: C.textPri }}>Ma Watchlist</h2>
        {vetos.availableTokens < 3 && (
          <p className="text-[11px] mt-0.5" style={{ color: C.textMuted }}>
            ⚡ {vetos.availableTokens}/3 vetos disponibles
            {vetos.nextRegen && ` · rechargement ${vetos.nextRegen}`}
          </p>
        )}
      </div>

      {/* Toggle Films / Séries */}
      <div className="px-4 mb-4">
        <div className="flex rounded-xl p-1" style={{ background: C.card, border: `0.5px solid ${C.border}` }}>
          {[
            { id: 'movies', label: '🎬 Films', count: movies.length },
            { id: 'series', label: '📺 Séries', count: series.length },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: tab === t.id ? C.violet : 'transparent',
                color: tab === t.id ? '#fff' : C.textMuted,
              }}>
              {t.label}
              {t.count > 0 && (
                <span className="ml-1 text-[10px] opacity-70">({t.count})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Contenu */}
      <div className="px-4 pb-6">
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 rounded-full border-2 animate-spin"
              style={{ borderColor: C.violet, borderTopColor: 'transparent' }} />
          </div>
        )}

        {!loading && totalActive === 0 && (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">{tab === 'movies' ? '🎬' : '📺'}</p>
            <p className="font-medium" style={{ color: C.textSec }}>
              {tab === 'movies' ? 'Aucun film' : 'Aucune série'}
            </p>
            <p className="text-sm mt-1" style={{ color: C.textMuted }}>
              Cherche dans "Découvrir" ou lance un Match !
            </p>
          </div>
        )}

        {!loading && (
          <div className="space-y-4">
            {activeGroups.map(g => (
              <Group
                key={g.id}
                title={g.title}
                emoji={g.emoji}
                items={g.items}
                onAdvanceEpisode={onAdvanceEpisode}
                onAdvanceSeason={onAdvanceSeason}
                onMarkWatched={onMarkWatched}
                onVeto={vetos.useVeto}
                vetoAvailable={vetos.availableTokens > 0}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
