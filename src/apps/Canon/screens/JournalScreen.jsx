import { useState } from 'react'
import { X } from 'lucide-react'
import { useThemeColors } from '../../../hooks/useThemeColors'
import BottomModal from '../../../components/BottomModal'
import Spinner from '../../../components/Spinner'

const COLOR = '#9b1c1c'

const COLORS_LIST = [
  { id: 'rouge',       label: 'Rouge',       emoji: '🍷' },
  { id: 'blanc',       label: 'Blanc',       emoji: '🥂' },
  { id: 'rosé',        label: 'Rosé',        emoji: '🌸' },
  { id: 'effervescent',label: 'Effervescent',emoji: '🍾' },
]

const EMPTY_TASTING = {
  name: '', domain: '', appellation: '', vintage: '',
  color: 'rouge', region: '', grape: '',
  rating: 0, is_favorite: false, note: '',
  tasted_at: new Date().toISOString().slice(0, 10),
}

function StarRating({ value, onChange, dark }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} onClick={() => onChange(value === n ? 0 : n)}
          className="text-[28px] active:scale-90 transition-transform leading-none">
          <span style={{ color: n <= value ? '#f59e0b' : (dark ? '#374151' : '#d1d5db') }}>★</span>
        </button>
      ))}
    </div>
  )
}

function StarDisplay({ value, size = 12 }) {
  return (
    <span style={{ fontSize: size, letterSpacing: 1 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <span key={n} style={{ color: n <= value ? '#f59e0b' : '#d1d5db' }}>★</span>
      ))}
    </span>
  )
}

function ColorDot({ color }) {
  const MAP = { rouge: '#9b1c1c', blanc: '#d97706', rosé: '#db2777', effervescent: '#7c3aed' }
  return (
    <span className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
      style={{ background: MAP[color] || '#9ca3af' }} />
  )
}

function formatDate(str) {
  if (!str) return ''
  const d = new Date(str + 'T00:00:00')
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

// Palmares component
function Palmares({ tastings, profiles, profile, dark }) {
  const { card, border, textPri, textSec } = useThemeColors(dark)
  const [scope, setScope] = useState('all') // 'all' | 'me'

  const filtered = scope === 'me'
    ? tastings.filter(t => t.profile_id === profile.id)
    : tastings

  const rated = filtered.filter(t => t.rating)

  // Top par couleur
  const byColor = COLORS_LIST.map(c => {
    const group = rated.filter(t => t.color === c.id)
    const avg = group.length ? group.reduce((s, t) => s + t.rating, 0) / group.length : null
    return { ...c, count: group.length, avg }
  }).filter(c => c.count > 0).sort((a, b) => b.avg - a.avg)

  // Top par région
  const regionMap = {}
  rated.forEach(t => {
    if (!t.region) return
    if (!regionMap[t.region]) regionMap[t.region] = { total: 0, count: 0 }
    regionMap[t.region].total += t.rating
    regionMap[t.region].count++
  })
  const byRegion = Object.entries(regionMap)
    .map(([r, d]) => ({ region: r, avg: d.total / d.count, count: d.count }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 5)

  // Coups de cœur
  const favorites = filtered.filter(t => t.is_favorite)
    .sort((a, b) => new Date(b.tasted_at) - new Date(a.tasted_at))
    .slice(0, 5)

  return (
    <div>
      {/* Toggle scope */}
      <div className="flex rounded-xl overflow-hidden mb-4"
        style={{ border: `1px solid ${border}` }}>
        {[{ id: 'all', label: '👫 Ensemble' }, { id: 'me', label: `${profile.avatar} Moi` }].map(s => (
          <button key={s.id} onClick={() => setScope(s.id)}
            className="flex-1 py-2 text-xs font-medium transition-all"
            style={{
              background: scope === s.id ? COLOR : 'transparent',
              color: scope === s.id ? '#fff' : textSec,
            }}>
            {s.label}
          </button>
        ))}
      </div>

      {rated.length === 0 && (
        <p className="text-center text-sm py-8" style={{ color: textSec }}>
          Pas encore de vins notés
        </p>
      )}

      {byColor.length > 0 && (
        <div className="mb-5">
          <p className="text-[11px] uppercase tracking-widest mb-2.5" style={{ color: textSec }}>
            Par couleur
          </p>
          <div className="space-y-2">
            {byColor.map(c => (
              <div key={c.id} className="flex items-center gap-3 rounded-xl px-4 py-3"
                style={{ background: card, border: `0.5px solid ${border}` }}>
                <span className="text-lg">{c.emoji}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: textPri }}>{c.label}</p>
                  <p className="text-xs" style={{ color: textSec }}>{c.count} dégustation{c.count > 1 ? 's' : ''}</p>
                </div>
                <StarDisplay value={Math.round(c.avg)} />
                <span className="text-sm font-bold ml-1" style={{ color: COLOR }}>
                  {c.avg.toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {byRegion.length > 0 && (
        <div className="mb-5">
          <p className="text-[11px] uppercase tracking-widest mb-2.5" style={{ color: textSec }}>
            Top régions
          </p>
          <div className="space-y-2">
            {byRegion.map((r, i) => (
              <div key={r.region} className="flex items-center gap-3 rounded-xl px-4 py-3"
                style={{ background: card, border: `0.5px solid ${border}` }}>
                <span className="text-sm font-bold w-5 text-center" style={{ color: textSec }}>
                  {i + 1}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: textPri }}>{r.region}</p>
                  <p className="text-xs" style={{ color: textSec }}>{r.count} vin{r.count > 1 ? 's' : ''}</p>
                </div>
                <span className="text-sm font-bold" style={{ color: COLOR }}>{r.avg.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {favorites.length > 0 && (
        <div>
          <p className="text-[11px] uppercase tracking-widest mb-2.5" style={{ color: textSec }}>
            Coups de cœur ❤️
          </p>
          <div className="space-y-2">
            {favorites.map(t => {
              const author = profiles.find(p => p.id === t.profile_id)
              return (
                <div key={t.id} className="flex items-center gap-3 rounded-xl px-4 py-3"
                  style={{
                    background: dark ? '#1a0a0a' : '#fff5f5',
                    border: `1px solid ${dark ? '#7f1d1d44' : '#fecaca'}`,
                  }}>
                  <span className="text-lg">❤️</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: textPri }}>{t.name}</p>
                    {t.vintage && <p className="text-xs" style={{ color: textSec }}>{t.vintage}</p>}
                  </div>
                  {author && <span className="text-sm flex-shrink-0">{author.avatar}</span>}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default function JournalScreen({ hook, dark, profile }) {
  const { tastings, profiles, loading } = hook
  const { bg, card, border, border2, textPri, textSec, textMed } = useThemeColors(dark)

  const inputStyle = {
    background: dark ? '#0f0a1e' : '#ffffff',
    border: `1px solid ${border2}`,
    color: textPri,
  }
  const labelStyle = { color: textSec }

  const [tab, setTab] = useState('liste') // 'liste' | 'palmares'
  const [filterColor, setFilterColor] = useState(null)

  const [addModal, setAddModal]     = useState(false)
  const [form, setForm]             = useState(EMPTY_TASTING)
  const [saving, setSaving]         = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const visibleTastings = tastings
    .filter(t => !filterColor || t.color === filterColor)

  const openAdd = () => {
    setForm({ ...EMPTY_TASTING, tasted_at: new Date().toISOString().slice(0, 10) })
    setAddModal(true)
  }

  const saveTasting = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    await hook.addTasting({
      name:        form.name.trim(),
      domain:      form.domain.trim() || null,
      appellation: form.appellation.trim() || null,
      vintage:     form.vintage ? parseInt(form.vintage) : null,
      color:       form.color || 'rouge',
      region:      form.region.trim() || null,
      grape:       form.grape.trim() || null,
      rating:      form.rating || null,
      is_favorite: form.is_favorite,
      note:        form.note.trim() || null,
      tasted_at:   form.tasted_at,
    })
    setSaving(false)
    setAddModal(false)
  }

  if (loading) return (
    <div className="flex justify-center py-20" style={{ background: bg }}>
      <Spinner color={COLOR} />
    </div>
  )

  const totalFavorites = tastings.filter(t => t.is_favorite).length

  return (
    <div style={{ background: bg, minHeight: '100%' }}>
      <div className="px-4 pt-4 pb-28 max-w-lg mx-auto">

        {/* Stats */}
        <div className="flex gap-2 mb-4">
          {[
            { label: 'Dégustations', value: tastings.length },
            { label: 'Coups de cœur', value: totalFavorites },
          ].map(s => (
            <div key={s.label} className="flex-1 rounded-xl py-2.5 px-3 text-center"
              style={{ background: card, border: `0.5px solid ${border}` }}>
              <p className="text-lg font-bold" style={{ color: COLOR }}>{s.value}</p>
              <p className="text-[10px] uppercase tracking-wide" style={{ color: textSec }}>{s.label}</p>
            </div>
          ))}
          <button onClick={openAdd}
            className="flex-1 rounded-xl py-2.5 px-3 flex flex-col items-center justify-center active:scale-95 transition-all"
            style={{ background: `${COLOR}18`, border: `1px solid ${COLOR}44` }}>
            <span className="text-lg">＋</span>
            <span className="text-[10px] uppercase tracking-wide" style={{ color: COLOR }}>Ajouter</span>
          </button>
        </div>

        {/* Onglets Liste / Palmarès */}
        <div className="flex rounded-xl overflow-hidden mb-4"
          style={{ border: `1px solid ${border2}` }}>
          {[{ id: 'liste', label: '📓 Liste' }, { id: 'palmares', label: '🏆 Palmarès' }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex-1 py-2 text-xs font-medium transition-all"
              style={{
                background: tab === t.id ? COLOR : 'transparent',
                color: tab === t.id ? '#fff' : textSec,
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'palmares' && (
          <Palmares tastings={tastings} profiles={profiles} profile={profile} dark={dark} />
        )}

        {tab === 'liste' && (
          <>
            {/* Filtres couleur */}
            <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
              <button onClick={() => setFilterColor(null)}
                className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium"
                style={{
                  background: !filterColor ? COLOR : (dark ? '#1a1035' : '#f3f4f6'),
                  color: !filterColor ? '#fff' : textSec,
                  border: `1px solid ${!filterColor ? COLOR : border2}`,
                }}>
                Tous
              </button>
              {COLORS_LIST.map(c => (
                <button key={c.id} onClick={() => setFilterColor(filterColor === c.id ? null : c.id)}
                  className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium"
                  style={{
                    background: filterColor === c.id ? `${COLOR}22` : (dark ? '#1a1035' : '#f3f4f6'),
                    color: filterColor === c.id ? COLOR : textSec,
                    border: `1px solid ${filterColor === c.id ? COLOR : border2}`,
                  }}>
                  {c.emoji} {c.label}
                </button>
              ))}
            </div>

            {visibleTastings.length === 0 && (
              <div className="text-center py-16">
                <div className="text-5xl mb-3">📓</div>
                <p className="font-medium mb-1" style={{ color: textMed }}>Aucune dégustation</p>
                <p className="text-sm" style={{ color: textSec }}>
                  Les vins bus depuis la cave apparaissent ici
                </p>
              </div>
            )}

            <div className="space-y-2">
              {visibleTastings.map(tasting => {
                const author = profiles.find(p => p.id === tasting.profile_id)
                return (
                  <div key={tasting.id} className="rounded-2xl p-4"
                    style={{
                      background: tasting.is_favorite ? (dark ? '#1a0a0a' : '#fff5f5') : card,
                      border: `0.5px solid ${tasting.is_favorite ? (dark ? '#7f1d1d66' : '#fecaca') : border}`,
                    }}>
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <ColorDot color={tasting.color} />
                          <p className="text-sm font-semibold truncate" style={{ color: textPri }}>
                            {tasting.name}
                          </p>
                          {tasting.is_favorite && <span className="text-sm flex-shrink-0">❤️</span>}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {tasting.vintage && (
                            <span className="text-xs" style={{ color: textSec }}>{tasting.vintage}</span>
                          )}
                          {tasting.appellation && (
                            <span className="text-xs" style={{ color: textSec }}>· {tasting.appellation}</span>
                          )}
                          {tasting.region && (
                            <span className="text-xs" style={{ color: textSec }}>· {tasting.region}</span>
                          )}
                        </div>
                        {tasting.note && (
                          <p className="text-xs mt-1.5 leading-relaxed" style={{ color: textSec }}>
                            {tasting.note}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1.5">
                          <p className="text-[11px]" style={{ color: textSec }}>
                            {formatDate(tasting.tasted_at)}
                          </p>
                          {author && (
                            <span className="text-xs">{author.avatar}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        {tasting.rating > 0 && (
                          <div className="flex items-center gap-1">
                            <span className="text-base font-bold" style={{ color: COLOR }}>
                              {tasting.rating}
                            </span>
                            <span style={{ color: '#f59e0b', fontSize: 14 }}>★</span>
                          </div>
                        )}
                        <button onClick={() => setDeleteConfirm(tasting.id)}
                          className="text-xs px-2 py-1 rounded-lg active:scale-95"
                          style={{ background: dark ? '#1f2937' : '#f3f4f6', color: textSec }}>
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Modal ajout dégustation hors cave */}
      <BottomModal open={addModal} onClose={() => setAddModal(false)} cardBg={dark ? '#1a1035' : '#fff'} maxHeight="90vh">
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="font-bold text-base" style={{ color: textPri }}>📓 Nouvelle dégustation</p>
            <button onClick={() => setAddModal(false)}>
              <X size={20} style={{ color: textSec }} />
            </button>
          </div>

          <div className="mb-3">
            <p className="text-xs mb-1.5 font-medium" style={labelStyle}>Nom *</p>
            <input value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Ex : Pouilly-Fumé 2022"
              autoFocus
              className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
              style={inputStyle} />
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3">
            <div>
              <p className="text-xs mb-1.5 font-medium" style={labelStyle}>Domaine</p>
              <input value={form.domain}
                onChange={e => setForm(f => ({ ...f, domain: e.target.value }))}
                placeholder="Domaine…"
                className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                style={inputStyle} />
            </div>
            <div>
              <p className="text-xs mb-1.5 font-medium" style={labelStyle}>Millésime</p>
              <input value={form.vintage} type="number"
                onChange={e => setForm(f => ({ ...f, vintage: e.target.value }))}
                placeholder="2022"
                className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                style={inputStyle} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3">
            <div>
              <p className="text-xs mb-1.5 font-medium" style={labelStyle}>Région</p>
              <input value={form.region}
                onChange={e => setForm(f => ({ ...f, region: e.target.value }))}
                placeholder="Loire, Alsace…"
                className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                style={inputStyle} />
            </div>
            <div>
              <p className="text-xs mb-1.5 font-medium" style={labelStyle}>Cépage</p>
              <input value={form.grape}
                onChange={e => setForm(f => ({ ...f, grape: e.target.value }))}
                placeholder="Sauvignon…"
                className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                style={inputStyle} />
            </div>
          </div>

          <div className="mb-3">
            <p className="text-xs mb-2 font-medium" style={labelStyle}>Couleur</p>
            <div className="flex gap-2">
              {COLORS_LIST.map(c => (
                <button key={c.id} onClick={() => setForm(f => ({ ...f, color: c.id }))}
                  className="flex-1 py-2 rounded-xl text-xs font-medium transition-all active:scale-95"
                  style={{
                    background: form.color === c.id ? `${COLOR}22` : 'transparent',
                    border: `1.5px solid ${form.color === c.id ? COLOR : border2}`,
                    color: form.color === c.id ? COLOR : textSec,
                  }}>
                  {c.emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-3">
            <p className="text-xs mb-1.5 font-medium" style={labelStyle}>Date</p>
            <input type="date" value={form.tasted_at}
              onChange={e => setForm(f => ({ ...f, tasted_at: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
              style={inputStyle} />
          </div>

          <div className="mb-3">
            <p className="text-xs mb-2 font-medium" style={labelStyle}>Note ⭐</p>
            <StarRating value={form.rating} onChange={v => setForm(f => ({ ...f, rating: v }))} dark={dark} />
          </div>

          <div className="mb-3">
            <button onClick={() => setForm(f => ({ ...f, is_favorite: !f.is_favorite }))}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all active:scale-95"
              style={{
                background: form.is_favorite ? '#fce7f333' : (dark ? '#1f2937' : '#f9fafb'),
                border: `1.5px solid ${form.is_favorite ? '#ec4899' : border2}`,
              }}>
              <span className="text-xl">{form.is_favorite ? '❤️' : '🤍'}</span>
              <span className="text-sm font-medium"
                style={{ color: form.is_favorite ? '#ec4899' : textSec }}>
                Coup de cœur
              </span>
            </button>
          </div>

          <div className="mb-5">
            <p className="text-xs mb-1.5 font-medium" style={labelStyle}>Note de dégustation</p>
            <textarea value={form.note}
              onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
              placeholder="Robe, nez, bouche, finale…"
              rows={3}
              className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none resize-none"
              style={inputStyle} />
          </div>

          <button onClick={saveTasting} disabled={!form.name.trim() || saving}
            className="w-full py-3.5 rounded-full text-white font-semibold disabled:opacity-30 active:scale-95 transition-transform"
            style={{ background: COLOR }}>
            {saving ? 'Sauvegarde…' : 'Ajouter au journal'}
          </button>
        </div>
      </BottomModal>

      {/* Confirmation suppression */}
      <BottomModal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} cardBg={dark ? '#1a1035' : '#fff'}>
        <div className="p-5">
          <p className="font-bold text-base mb-2" style={{ color: textPri }}>Supprimer cette dégustation ?</p>
          <p className="text-sm mb-5" style={{ color: textSec }}>Cette action est irréversible.</p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteConfirm(null)}
              className="flex-1 py-3 rounded-full font-medium"
              style={{ background: dark ? '#1f2937' : '#f3f4f6', color: textSec }}>
              Annuler
            </button>
            <button onClick={async () => { await hook.deleteTasting(deleteConfirm); setDeleteConfirm(null) }}
              className="flex-1 py-3 rounded-full text-white font-semibold"
              style={{ background: '#dc2626' }}>
              Supprimer
            </button>
          </div>
        </div>
      </BottomModal>
    </div>
  )
}
