import { useState } from 'react'
import { ChevronDown, ChevronUp, Plus, Check, Zap, Bell, Pencil, X, Trash2 } from 'lucide-react'
import { getPosterUrl } from '../services/tmdb'
import { useSeriesSync } from '../hooks/useSeriesSync'

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
  green: '#10b981',
  red: '#ef4444',
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
function WatchlistItem({ item, onAdvanceEpisode, onAdvanceSeason, onSetEpisode, onMarkWatched, onDelete, onVeto, vetoAvailable, sync, lastVisitMs }) {
  const [showActions, setShowActions] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmVeto, setConfirmVeto] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editS, setEditS] = useState(item.current_season ?? 1)
  const [editE, setEditE] = useState(item.current_episode ?? 0)

  const poster = getPosterUrl(item.poster_path, 'w92')
  const isSeries = item.media_type === 'tv'

  const episodesInSeason = isSeries ? sync.getEpisodesInSeason(item) : null
  const newEp = isSeries ? sync.hasNewEpisode(item, lastVisitMs) : false
  const nextAir = isSeries ? sync.getNextAirDate(item) : null
  const seriesStatus = isSeries ? sync.getSeriesStatus(item) : null
  const atSeasonEnd = isSeries ? sync.isAtSeasonEnd(item) : false
  const advanceOk = isSeries ? sync.canAdvance(item) : true

  const curSeason = item.current_season ?? 1
  const curEp = item.current_episode ?? 0
  const seasonLabel = `S${String(curSeason).padStart(2, '0')}E${String(curEp).padStart(2, '0')}`
  const episodeLabel = episodesInSeason ? `${seasonLabel} · ${curEp}/${episodesInSeason}` : seasonLabel

  const openEdit = () => {
    setEditS(item.current_season ?? 1)
    setEditE(item.current_episode ?? 0)
    setEditing(true)
  }

  const saveEdit = async () => {
    const s = Math.max(1, parseInt(editS) || 1)
    const e = Math.max(0, parseInt(editE) || 0)
    await onSetEpisode(item.id, s, e)
    setEditing(false)
  }

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return }
    await onDelete(item.id)
  }

  const handleVeto = async () => {
    if (!confirmVeto) { setConfirmVeto(true); return }
    await onVeto(item.id)
    setConfirmVeto(false)
  }

  return (
    <div className="rounded-xl overflow-hidden"
      style={{ background: C.card, border: `0.5px solid ${newEp ? '#ef444460' : C.border}` }}>
      <div className="flex gap-3 p-3">
        {/* Poster */}
        <div className="flex-shrink-0 w-12 rounded-lg overflow-hidden relative"
          style={{ background: '#0d0620', aspectRatio: '2/3' }}>
          {poster
            ? <img src={poster} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
            : <div className="w-full h-full flex items-center justify-center text-xl">{isSeries ? '📺' : '🎬'}</div>
          }
          {newEp && (
            <div className="absolute top-0.5 right-0.5 w-2.5 h-2.5 rounded-full animate-pulse"
              style={{ background: C.red }} />
          )}
        </div>

        {/* Infos */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-1.5">
            <p className="text-sm font-semibold leading-snug flex-1" style={{ color: C.textPri }}>
              {item.title}
            </p>
            {newEp && (
              <span className="flex-shrink-0 flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-md"
                style={{ background: '#ef444420', color: C.red, border: `0.5px solid #ef444450` }}>
                <Bell size={8} />NOUVEAU
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {item.release_year && (
              <span className="text-[11px]" style={{ color: C.textMuted }}>{item.release_year}</span>
            )}
            {item.vote_average > 0 && (
              <span className="text-[11px]" style={{ color: C.amber }}>★ {Number(item.vote_average).toFixed(1)}</span>
            )}
            <StatusBadge status={item.status} />
            {seriesStatus === 'Ended' && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-md"
                style={{ background: '#2d1059', color: C.textMuted }}>Terminée</span>
            )}
            {seriesStatus === 'Canceled' && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-md"
                style={{ background: '#2d1059', color: '#f87171' }}>Annulée</span>
            )}
          </div>

          {/* Suivi épisode */}
          {isSeries && (
            <div className="mt-1.5 space-y-1">
              {editing ? (
                /* ── Mode édition ── */
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px]" style={{ color: C.textMuted }}>S</span>
                  <input
                    type="number" min="1" value={editS}
                    onChange={e => setEditS(e.target.value)}
                    onBlur={e => setEditS(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-10 text-center text-xs rounded-md px-1 py-1 outline-none"
                    style={{ background: '#0d0620', color: C.amber, border: `1px solid ${C.violet}` }}
                  />
                  <span className="text-[11px]" style={{ color: C.textMuted }}>E</span>
                  <input
                    type="number" min="0" value={editE}
                    onChange={e => setEditE(e.target.value)}
                    onBlur={e => setEditE(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-10 text-center text-xs rounded-md px-1 py-1 outline-none"
                    style={{ background: '#0d0620', color: C.amber, border: `1px solid ${C.violet}` }}
                  />
                  <button onClick={saveEdit}
                    className="w-6 h-6 rounded-full flex items-center justify-center active:scale-90"
                    style={{ background: C.green }}>
                    <Check size={11} color="#fff" strokeWidth={3} />
                  </button>
                  <button onClick={() => setEditing(false)}
                    className="w-6 h-6 rounded-full flex items-center justify-center active:scale-90"
                    style={{ background: '#2d1059' }}>
                    <X size={11} color={C.textMuted} />
                  </button>
                </div>
              ) : (
                /* ── Mode lecture ── */
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Label → tap pour éditer */}
                  <button onClick={openEdit}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-md active:scale-95 transition-all"
                    style={{ background: '#0d0620' }}
                    title="Modifier la position">
                    <span className="text-[11px] font-mono" style={{ color: C.amber }}>{episodeLabel}</span>
                    <Pencil size={9} color={C.textMuted} />
                  </button>

                  {/* + avance d'un épisode — bloqué si prochain ep pas encore diffusé */}
                  <button
                    onClick={() => advanceOk && onAdvanceEpisode(item.id, episodesInSeason)}
                    disabled={!advanceOk}
                    title={!advanceOk ? 'Prochain épisode pas encore diffusé' : undefined}
                    className="flex items-center gap-1 h-6 px-2 rounded-full transition-all"
                    style={{
                      background: !advanceOk ? '#2d1059' : atSeasonEnd ? C.violet : C.amber,
                      opacity: !advanceOk ? 0.45 : 1,
                      cursor: !advanceOk ? 'not-allowed' : 'pointer',
                    }}>
                    <Plus size={11} color={!advanceOk ? C.textMuted : '#0d0620'} strokeWidth={3} />
                    {atSeasonEnd && advanceOk && (
                      <span className="text-[9px] font-bold" style={{ color: '#0d0620' }}>S+</span>
                    )}
                  </button>

                  {!atSeasonEnd && (
                    <button onClick={() => onAdvanceSeason(item.id)}
                      className="text-[10px] px-2 py-0.5 rounded-md active:scale-95 transition-all"
                      style={{ background: '#2d1059', color: C.textSec }}>
                      S+
                    </button>
                  )}
                </div>
              )}

              {/* Infos TMDB sous le tracker */}
              {!editing && !advanceOk && !nextAir && (
                <p className="text-[10px]" style={{ color: C.textMuted }}>
                  ⏳ Tu es à jour — prochain épisode non diffusé
                </p>
              )}
              {!editing && newEp && (
                <p className="text-[10px] font-medium" style={{ color: C.red }}>
                  🔴 Nouvel épisode disponible !
                </p>
              )}
              {!editing && nextAir && !newEp && (
                <p className="text-[10px]" style={{ color: C.textMuted }}>
                  📅 Prochain S{String(nextAir.season).padStart(2,'0')}E{String(nextAir.episode).padStart(2,'0')} · {nextAir.label}
                  {nextAir.name ? ` · "${nextAir.name}"` : ''}
                </p>
              )}
              {!editing && seriesStatus === 'Ended' && !newEp && (
                <p className="text-[10px]" style={{ color: C.textMuted }}>Plus d'épisodes à venir</p>
              )}
            </div>
          )}
        </div>

        {/* Bouton actions */}
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
              style={{ background: '#10b98120', color: C.green }}>
              <Check size={12} /> Terminé
            </button>
          )}
          {/* Supprimer — gratuit, hard delete */}
          <button
            onClick={handleDelete}
            className="flex items-center gap-1 text-[11px] px-3 py-1.5 rounded-lg active:scale-95 transition-all"
            style={{
              background: confirmDelete ? '#dc262620' : '#2d1059',
              color: confirmDelete ? '#f87171' : C.textMuted,
            }}>
            <Trash2 size={12} />
            {confirmDelete ? 'Supprimer ?' : 'Supprimer'}
          </button>
          {/* Veto — consomme un jeton */}
          <button
            onClick={handleVeto}
            className="flex items-center gap-1 text-[11px] px-3 py-1.5 rounded-lg active:scale-95 transition-all"
            style={{
              background: confirmVeto ? '#dc262620' : '#2d1059',
              color: confirmVeto ? '#f87171' : C.textMuted,
            }}>
            <Zap size={12} />
            {confirmVeto ? 'Confirmer veto ?' : vetoAvailable ? `Veto (${vetoAvailable})` : 'Veto (0)'}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Groupe collapsible ───────────────────────────────────────────────────────
function Group({ title, emoji, items, onAdvanceEpisode, onAdvanceSeason, onSetEpisode, onMarkWatched, onDelete, onVeto, vetoAvailable, sync, lastVisitMs }) {
  const [open, setOpen] = useState(true)
  if (items.length === 0) return null

  const newEpCount = items.filter(i => i.media_type === 'tv' && sync.hasNewEpisode(i, lastVisitMs)).length

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
          {newEpCount > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: '#ef444420', color: C.red }}>
              {newEpCount} nouveau{newEpCount > 1 ? 'x' : ''}
            </span>
          )}
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
              onSetEpisode={onSetEpisode}
              onMarkWatched={onMarkWatched}
              onDelete={onDelete}
              onVeto={onVeto}
              vetoAvailable={vetoAvailable}
              sync={sync}
              lastVisitMs={lastVisitMs}
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
  onSetEpisode,
  onMarkWatched,
  onDelete,
  vetos,
}) {
  const [tab, setTab] = useState('movies')

  // Timestamp de la DERNIÈRE visite (session précédente) — mis à jour à l'ouverture
  const [lastVisitMs] = useState(() => {
    const key = `tisane-visit-${profile?.id}`
    const stored = localStorage.getItem(key)
    localStorage.setItem(key, String(Date.now()))
    // Première visite : rien n'est "nouveau" (on retourne le timestamp actuel)
    return stored ? parseInt(stored) : Date.now()
  })

  const tvItems = items.filter(i => i.media_type === 'tv')
  const sync = useSeriesSync(tvItems)

  const movies = items.filter(i => i.media_type === 'movie')
  const series = tvItems

  // Watchlist = matched + watching uniquement (to_watch est la queue privée du Match engine)
  const movieGroups = [
    { id: 'matched', title: 'Matchs', emoji: '❤️', items: movies.filter(i => i.status === 'matched') },
    { id: 'watched', title: 'Vus', emoji: '✅', items: movies.filter(i => i.status === 'watched') },
  ]

  const seriesGroups = [
    { id: 'watching', title: 'En cours', emoji: '▶️', items: series.filter(i => i.status === 'watching') },
    { id: 'matched', title: 'Matchs', emoji: '❤️', items: series.filter(i => i.status === 'matched') },
    { id: 'watched', title: 'Terminées', emoji: '✅', items: series.filter(i => i.status === 'watched') },
  ]

  const activeGroups = tab === 'movies' ? movieGroups : seriesGroups
  const activeItems = tab === 'movies'
    ? movies.filter(i => i.status === 'matched' || i.status === 'watching' || i.status === 'watched')
    : series.filter(i => i.status === 'matched' || i.status === 'watching' || i.status === 'watched')
  const totalActive = activeItems.length
  const totalNewEp = series.filter(s => sync.hasNewEpisode(s, lastVisitMs)).length

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
            { id: 'movies', label: '🎬 Films', count: movies.filter(i => i.status === 'matched' || i.status === 'watching').length },
            { id: 'series', label: '📺 Séries', count: series.filter(i => i.status === 'matched' || i.status === 'watching').length, badge: totalNewEp },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex-1 py-2 rounded-lg text-sm font-medium transition-all relative"
              style={{
                background: tab === t.id ? C.violet : 'transparent',
                color: tab === t.id ? '#fff' : C.textMuted,
              }}>
              {t.label}
              {t.count > 0 && <span className="ml-1 text-[10px] opacity-70">({t.count})</span>}
              {t.badge > 0 && (
                <span className="absolute top-1 right-2 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center"
                  style={{ background: C.red, color: '#fff' }}>
                  {t.badge}
                </span>
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
              {tab === 'movies' ? 'Aucun film dans la liste' : 'Aucune série dans la liste'}
            </p>
            <p className="text-sm mt-1" style={{ color: C.textMuted }}>
              Ajoute depuis "Découvrir" ou fais un Match !
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
                onSetEpisode={onSetEpisode}
                onMarkWatched={onMarkWatched}
                onDelete={onDelete}
                onVeto={vetos.useVeto}
                vetoAvailable={vetos.availableTokens}
                sync={sync}
                lastVisitMs={lastVisitMs}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
