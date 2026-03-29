import { useState } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
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

const EMPTY_BOTTLE = {
  name: '', domain: '', appellation: '', vintage: '',
  color: 'rouge', region: '', grape: '',
  quantity: 1, zone: '', purchase_note: '',
}
const EMPTY_DRINK = {
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

function ColorDot({ color }) {
  const MAP = { rouge: '#9b1c1c', blanc: '#d97706', rosé: '#db2777', effervescent: '#7c3aed' }
  return (
    <span className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
      style={{ background: MAP[color] || '#9ca3af' }} />
  )
}

function BottleForm({ form, setForm, dark, inputStyle, labelStyle }) {
  return (
    <>
      <div className="mb-3">
        <p className="text-xs mb-1.5 font-medium" style={labelStyle}>Nom *</p>
        <input value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          placeholder="Ex : Château Margaux 2015"
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
          <p className="text-xs mb-1.5 font-medium" style={labelStyle}>Appellation</p>
          <input value={form.appellation}
            onChange={e => setForm(f => ({ ...f, appellation: e.target.value }))}
            placeholder="Appellation…"
            className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
            style={inputStyle} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div>
          <p className="text-xs mb-1.5 font-medium" style={labelStyle}>Région</p>
          <input value={form.region}
            onChange={e => setForm(f => ({ ...f, region: e.target.value }))}
            placeholder="Bordeaux, Bourgogne…"
            className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
            style={inputStyle} />
        </div>
        <div>
          <p className="text-xs mb-1.5 font-medium" style={labelStyle}>Cépage</p>
          <input value={form.grape}
            onChange={e => setForm(f => ({ ...f, grape: e.target.value }))}
            placeholder="Merlot, Syrah…"
            className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
            style={inputStyle} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <div>
          <p className="text-xs mb-1.5 font-medium" style={labelStyle}>Millésime</p>
          <input value={form.vintage} type="number"
            onChange={e => setForm(f => ({ ...f, vintage: e.target.value }))}
            placeholder="2020"
            className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
            style={inputStyle} />
        </div>
        <div>
          <p className="text-xs mb-1.5 font-medium" style={labelStyle}>Qté</p>
          <input value={form.quantity} type="number" min="1"
            onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
            className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
            style={inputStyle} />
        </div>
        <div>
          <p className="text-xs mb-1.5 font-medium" style={labelStyle}>Zone</p>
          <input value={form.zone}
            onChange={e => setForm(f => ({ ...f, zone: e.target.value }))}
            placeholder="Étagère A"
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
                border: `1.5px solid ${form.color === c.id ? COLOR : (dark ? '#374151' : '#e5e7eb')}`,
                color: form.color === c.id ? COLOR : (dark ? '#9ca3af' : '#6b7280'),
              }}>
              {c.emoji} {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <p className="text-xs mb-1.5 font-medium" style={labelStyle}>Note d'achat</p>
        <input value={form.purchase_note}
          onChange={e => setForm(f => ({ ...f, purchase_note: e.target.value }))}
          placeholder="Cadeau, cave coopérative…"
          className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
          style={inputStyle} />
      </div>
    </>
  )
}

export default function CaveScreen({ hook, dark, profile }) {
  const { bottles, loading, zones } = hook
  const { bg, card, border, border2, textPri, textSec, textMed } = useThemeColors(dark)

  const inputStyle = {
    background: dark ? '#0f0a1e' : '#ffffff',
    border: `1px solid ${border2}`,
    color: textPri,
  }
  const labelStyle = { color: textSec }

  const [filterColor, setFilterColor] = useState(null)
  const [filterZone, setFilterZone]   = useState(null)
  const [viewMode, setViewMode]       = useState('list') // 'list' | 'zones'
  const [showEmpty, setShowEmpty]     = useState(false)

  const [addModal, setAddModal]       = useState(false)
  const [editBottle, setEditBottle]   = useState(null)
  const [form, setForm]               = useState(EMPTY_BOTTLE)
  const [saving, setSaving]           = useState(false)

  const [drinkBottle, setDrinkBottle] = useState(null)
  const [drinkForm, setDrinkForm]     = useState(EMPTY_DRINK)
  const [drinking, setDrinking]       = useState(false)

  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const visibleBottles = bottles
    .filter(b => showEmpty ? true : b.quantity > 0)
    .filter(b => !filterColor || b.color === filterColor)
    .filter(b => !filterZone || b.zone === filterZone)

  const totalInCave = bottles.reduce((sum, b) => sum + (b.quantity || 0), 0)
  const totalBottles = bottles.filter(b => b.quantity > 0).length

  const openAdd = () => {
    setForm(EMPTY_BOTTLE)
    setEditBottle(null)
    setAddModal(true)
  }
  const openEdit = (bottle) => {
    setForm({
      name:          bottle.name || '',
      domain:        bottle.domain || '',
      appellation:   bottle.appellation || '',
      vintage:       bottle.vintage || '',
      color:         bottle.color || 'rouge',
      region:        bottle.region || '',
      grape:         bottle.grape || '',
      quantity:      bottle.quantity || 1,
      zone:          bottle.zone || '',
      purchase_note: bottle.purchase_note || '',
    })
    setEditBottle(bottle)
    setAddModal(true)
  }
  const closeAdd = () => { setAddModal(false); setEditBottle(null) }

  const saveBottle = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    const payload = {
      name:          form.name.trim(),
      domain:        form.domain.trim() || null,
      appellation:   form.appellation.trim() || null,
      vintage:       form.vintage ? parseInt(form.vintage) : null,
      color:         form.color || 'rouge',
      region:        form.region.trim() || null,
      grape:         form.grape.trim() || null,
      quantity:      Math.max(1, parseInt(form.quantity) || 1),
      zone:          form.zone.trim() || null,
      purchase_note: form.purchase_note.trim() || null,
    }
    if (editBottle) {
      await hook.updateBottle(editBottle.id, payload)
    } else {
      await hook.addBottle(payload)
    }
    setSaving(false)
    closeAdd()
  }

  const openDrink = (bottle) => {
    setDrinkBottle(bottle)
    setDrinkForm({ ...EMPTY_DRINK, tasted_at: new Date().toISOString().slice(0, 10) })
  }
  const closeDrink = () => { setDrinkBottle(null) }

  const confirmDrink = async () => {
    if (!drinkBottle) return
    setDrinking(true)
    await hook.drinkBottle(drinkBottle, {
      rating:      drinkForm.rating || null,
      is_favorite: drinkForm.is_favorite,
      note:        drinkForm.note.trim() || null,
      tasted_at:   drinkForm.tasted_at,
    })
    setDrinking(false)
    closeDrink()
  }

  const confirmDelete = async (id) => {
    await hook.deleteBottle(id)
    setDeleteConfirm(null)
  }

  // Zones view: group bottles by zone
  const zoneGroups = zones.map(z => ({
    name: z,
    bottles: bottles.filter(b => b.zone === z && b.quantity > 0),
    total: bottles.filter(b => b.zone === z).reduce((s, b) => s + (b.quantity || 0), 0),
  }))
  const noZone = bottles.filter(b => !b.zone && b.quantity > 0)

  if (loading) return (
    <div className="flex justify-center py-20" style={{ background: bg }}>
      <Spinner color={COLOR} />
    </div>
  )

  return (
    <div style={{ background: bg, minHeight: '100%' }}>
      <div className="px-4 pt-4 pb-28 max-w-lg mx-auto">

        {/* Stats */}
        <div className="flex gap-2 mb-4">
          {[
            { label: 'Références', value: totalBottles },
            { label: 'Bouteilles', value: totalInCave },
            { label: 'Zones', value: zones.length },
          ].map(s => (
            <div key={s.label} className="flex-1 rounded-xl py-2.5 px-3 text-center"
              style={{ background: card, border: `0.5px solid ${border}` }}>
              <p className="text-lg font-bold" style={{ color: COLOR }}>{s.value}</p>
              <p className="text-[10px] uppercase tracking-wide" style={{ color: textSec }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filtres couleur */}
        <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1">
          <button onClick={() => setFilterColor(null)}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
            style={{
              background: !filterColor ? COLOR : (dark ? '#1a1035' : '#f3f4f6'),
              color: !filterColor ? '#fff' : textSec,
              border: `1px solid ${!filterColor ? COLOR : border2}`,
            }}>
            Tous
          </button>
          {COLORS_LIST.map(c => (
            <button key={c.id} onClick={() => setFilterColor(filterColor === c.id ? null : c.id)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
              style={{
                background: filterColor === c.id ? `${COLOR}22` : (dark ? '#1a1035' : '#f3f4f6'),
                color: filterColor === c.id ? COLOR : textSec,
                border: `1px solid ${filterColor === c.id ? COLOR : border2}`,
              }}>
              {c.emoji} {c.label}
            </button>
          ))}
        </div>

        {/* Filtres zone + vue */}
        {zones.length > 0 && (
          <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1">
            <button onClick={() => setFilterZone(null)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs transition-all"
              style={{
                background: !filterZone ? `${COLOR}18` : 'transparent',
                color: !filterZone ? COLOR : textSec,
                border: `1px solid ${!filterZone ? COLOR : border2}`,
              }}>
              🏚️ Toutes zones
            </button>
            {zones.map(z => (
              <button key={z} onClick={() => setFilterZone(filterZone === z ? null : z)}
                className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs transition-all"
                style={{
                  background: filterZone === z ? `${COLOR}18` : 'transparent',
                  color: filterZone === z ? COLOR : textSec,
                  border: `1px solid ${filterZone === z ? COLOR : border2}`,
                }}>
                {z}
              </button>
            ))}
          </div>
        )}

        {/* Toggle vue liste / zones */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex rounded-xl overflow-hidden"
            style={{ border: `1px solid ${border2}` }}>
            {[{ id: 'list', label: '📋 Liste' }, { id: 'zones', label: '🏚️ Zones' }].map(v => (
              <button key={v.id} onClick={() => setViewMode(v.id)}
                className="px-3 py-1.5 text-xs font-medium transition-all"
                style={{
                  background: viewMode === v.id ? COLOR : 'transparent',
                  color: viewMode === v.id ? '#fff' : textSec,
                }}>
                {v.label}
              </button>
            ))}
          </div>
          <button onClick={() => setShowEmpty(e => !e)}
            className="text-xs px-3 py-1.5 rounded-xl transition-all"
            style={{
              background: showEmpty ? `${COLOR}18` : 'transparent',
              color: showEmpty ? COLOR : textSec,
              border: `1px solid ${showEmpty ? COLOR : border2}`,
            }}>
            {showEmpty ? 'Masquer vides' : 'Voir vides'}
          </button>
        </div>

        {/* Vue Zones */}
        {viewMode === 'zones' && (
          <div className="space-y-3">
            {zoneGroups.map(z => (
              <div key={z.name} className="rounded-2xl p-4"
                style={{ background: card, border: `0.5px solid ${border}` }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="font-semibold text-sm" style={{ color: textPri }}>📦 {z.name}</p>
                  <p className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{ background: `${COLOR}18`, color: COLOR }}>
                    {z.total} bouteille{z.total > 1 ? 's' : ''}
                  </p>
                </div>
                <div className="space-y-1.5">
                  {z.bottles.map(b => (
                    <div key={b.id} className="flex items-center gap-2">
                      <ColorDot color={b.color} />
                      <p className="text-sm flex-1 truncate" style={{ color: textPri }}>{b.name}</p>
                      {b.vintage && <span className="text-xs" style={{ color: textSec }}>{b.vintage}</span>}
                      <span className="text-xs font-medium" style={{ color: COLOR }}>×{b.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {noZone.length > 0 && (
              <div className="rounded-2xl p-4"
                style={{ background: card, border: `0.5px dashed ${border}` }}>
                <p className="font-medium text-sm mb-2" style={{ color: textSec }}>Sans zone</p>
                <div className="space-y-1.5">
                  {noZone.map(b => (
                    <div key={b.id} className="flex items-center gap-2">
                      <ColorDot color={b.color} />
                      <p className="text-sm flex-1 truncate" style={{ color: textPri }}>{b.name}</p>
                      <span className="text-xs font-medium" style={{ color: COLOR }}>×{b.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {zones.length === 0 && bottles.filter(b => b.quantity > 0).length === 0 && (
              <p className="text-center py-12 text-sm" style={{ color: textSec }}>
                La cave est vide 🍾
              </p>
            )}
          </div>
        )}

        {/* Vue Liste */}
        {viewMode === 'list' && (
          <>
            {visibleBottles.length === 0 && (
              <div className="text-center py-16">
                <div className="text-5xl mb-3">🍷</div>
                <p className="font-medium mb-1" style={{ color: textMed }}>La cave est vide</p>
                <p className="text-sm" style={{ color: textSec }}>Ajoute ta première bouteille ↓</p>
              </div>
            )}
            <div className="space-y-2">
              {visibleBottles.map(bottle => (
                <div key={bottle.id} className="rounded-2xl p-4"
                  style={{
                    background: card,
                    border: `0.5px solid ${bottle.quantity === 1 ? '#f59e0b' : border}`,
                    opacity: bottle.quantity === 0 ? 0.5 : 1,
                  }}>
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <ColorDot color={bottle.color} />
                        <p className="text-sm font-semibold truncate" style={{ color: textPri }}>
                          {bottle.name}
                        </p>
                        {bottle.quantity === 1 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0"
                            style={{ background: '#fef3c7', color: '#92400e' }}>
                            Dernière !
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {bottle.vintage && (
                          <span className="text-xs" style={{ color: textSec }}>{bottle.vintage}</span>
                        )}
                        {bottle.appellation && (
                          <span className="text-xs" style={{ color: textSec }}>· {bottle.appellation}</span>
                        )}
                        {bottle.region && (
                          <span className="text-xs" style={{ color: textSec }}>· {bottle.region}</span>
                        )}
                      </div>
                      {bottle.zone && (
                        <p className="text-[11px] mt-1" style={{ color: textSec }}>📦 {bottle.zone}</p>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <div className="flex items-center gap-1">
                        <span className="text-lg font-bold" style={{ color: COLOR }}>×{bottle.quantity}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => openEdit(bottle)}
                          className="text-xs px-2 py-1 rounded-lg active:scale-95 transition-all"
                          style={{ background: dark ? '#1f2937' : '#f3f4f6', color: textSec }}>
                          ✏️
                        </button>
                        <button onClick={() => setDeleteConfirm(bottle.id)}
                          className="text-xs px-2 py-1 rounded-lg active:scale-95 transition-all"
                          style={{ background: dark ? '#1f2937' : '#f3f4f6', color: textSec }}>
                          <Trash2 size={12} />
                        </button>
                        {bottle.quantity > 0 && (
                          <button onClick={() => openDrink(bottle)}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white active:scale-95 transition-all"
                            style={{ background: COLOR }}>
                            Bu 🍷
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* FAB */}
      <button onClick={openAdd}
        className="fixed bottom-20 right-4 w-14 h-14 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform z-10"
        style={{ background: COLOR }}>
        <Plus size={24} color="white" />
      </button>

      {/* Modal Ajouter / Modifier bouteille */}
      <BottomModal open={addModal} onClose={closeAdd} cardBg={dark ? '#1a1035' : '#fff'} maxHeight="90vh">
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="font-bold text-base" style={{ color: textPri }}>
              {editBottle ? '✏️ Modifier la bouteille' : '🍷 Ajouter une bouteille'}
            </p>
            <button onClick={closeAdd}>
              <X size={20} style={{ color: textSec }} />
            </button>
          </div>

          <BottleForm form={form} setForm={setForm} dark={dark}
            inputStyle={inputStyle} labelStyle={labelStyle} />

          <button onClick={saveBottle} disabled={!form.name.trim() || saving}
            className="w-full py-3.5 rounded-full text-white font-semibold disabled:opacity-30 active:scale-95 transition-transform"
            style={{ background: COLOR }}>
            {saving ? 'Sauvegarde…' : editBottle ? 'Modifier' : 'Ajouter à la cave'}
          </button>
        </div>
      </BottomModal>

      {/* Modal Bu 🍷 */}
      <BottomModal open={!!drinkBottle} onClose={closeDrink} cardBg={dark ? '#1a1035' : '#fff'}>
        {drinkBottle && (
          <div className="p-5">
            <div className="flex items-center justify-between mb-1">
              <p className="font-bold text-base" style={{ color: textPri }}>🍷 Bu !</p>
              <button onClick={closeDrink}><X size={20} style={{ color: textSec }} /></button>
            </div>
            <p className="text-sm mb-4" style={{ color: textSec }}>
              {drinkBottle.name} {drinkBottle.vintage && `· ${drinkBottle.vintage}`}
            </p>

            <div className="mb-4">
              <p className="text-xs mb-2 font-medium" style={{ color: textSec }}>Date</p>
              <input type="date" value={drinkForm.tasted_at}
                onChange={e => setDrinkForm(f => ({ ...f, tasted_at: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
                style={inputStyle} />
            </div>

            <div className="mb-4">
              <p className="text-xs mb-2 font-medium" style={{ color: textSec }}>Note ⭐</p>
              <StarRating value={drinkForm.rating} onChange={v => setDrinkForm(f => ({ ...f, rating: v }))} dark={dark} />
            </div>

            <div className="mb-4">
              <button onClick={() => setDrinkForm(f => ({ ...f, is_favorite: !f.is_favorite }))}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all active:scale-95"
                style={{
                  background: drinkForm.is_favorite ? '#fce7f333' : (dark ? '#1f2937' : '#f9fafb'),
                  border: `1.5px solid ${drinkForm.is_favorite ? '#ec4899' : border2}`,
                }}>
                <span className="text-xl">{drinkForm.is_favorite ? '❤️' : '🤍'}</span>
                <span className="text-sm font-medium" style={{ color: drinkForm.is_favorite ? '#ec4899' : textMed }}>
                  Coup de cœur
                </span>
              </button>
            </div>

            <div className="mb-5">
              <p className="text-xs mb-2 font-medium" style={{ color: textSec }}>Note de dégustation</p>
              <textarea value={drinkForm.note}
                onChange={e => setDrinkForm(f => ({ ...f, note: e.target.value }))}
                placeholder="Robe, nez, bouche, finale…"
                rows={3}
                className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none resize-none"
                style={inputStyle} />
            </div>

            <button onClick={confirmDrink} disabled={drinking}
              className="w-full py-3.5 rounded-full text-white font-semibold disabled:opacity-30 active:scale-95 transition-transform"
              style={{ background: COLOR }}>
              {drinking ? 'Enregistrement…' : 'Confirmer → Journal'}
            </button>
          </div>
        )}
      </BottomModal>

      {/* Confirmation suppression */}
      <BottomModal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} cardBg={dark ? '#1a1035' : '#fff'}>
        <div className="p-5">
          <p className="font-bold text-base mb-2" style={{ color: textPri }}>Supprimer cette bouteille ?</p>
          <p className="text-sm mb-5" style={{ color: textSec }}>Cette action est irréversible.</p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteConfirm(null)}
              className="flex-1 py-3 rounded-full font-medium"
              style={{ background: dark ? '#1f2937' : '#f3f4f6', color: textSec }}>
              Annuler
            </button>
            <button onClick={() => confirmDelete(deleteConfirm)}
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
