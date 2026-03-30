import { useState } from 'react'
import { Plus, Trash2, X, ArrowRightLeft, Settings } from 'lucide-react'
import { useThemeColors } from '../../../hooks/useThemeColors'
import BottomModal from '../../../components/BottomModal'
import Spinner from '../../../components/Spinner'
import { loadZones, saveZones, getZoneInfo, getLocations, getTotalQty, DEFAULT_ZONES } from '../hooks/useCanon'

const COLOR = '#9b1c1c'

const COLORS_LIST = [
  { id: 'rouge',        label: 'Rouge',        emoji: '🍷' },
  { id: 'blanc',        label: 'Blanc',        emoji: '🥂' },
  { id: 'rosé',         label: 'Rosé',         emoji: '🌸' },
  { id: 'effervescent', label: 'Effervescent', emoji: '🍾' },
]

const COLOR_MAP = { rouge: '#9b1c1c', blanc: '#d97706', rosé: '#db2777', effervescent: '#7c3aed' }

const EMPTY_BOTTLE = {
  name: '', domain: '', appellation: '', vintage: '',
  color: 'rouge', region: '', grape: '', quantity: 1,
  zone: 'cave', purchase_note: '',
}
const EMPTY_DRINK = { rating: 0, is_favorite: false, note: '', tasted_at: new Date().toISOString().slice(0, 10) }

function StarRating({ value, onChange, dark }) {
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(n => (
        <button key={n} onClick={() => onChange(value === n ? 0 : n)}
          className="text-[26px] active:scale-90 transition-transform leading-none">
          <span style={{ color: n <= value ? '#f59e0b' : (dark ? '#374151' : '#d1d5db') }}>★</span>
        </button>
      ))}
    </div>
  )
}

export default function CaveScreen({ hook, dark, profile }) {
  const { bottles, loading } = hook
  const { bg, card, border, border2, textPri, textSec, textMed } = useThemeColors(dark)
  const inp = { background: dark ? '#0f0a1e' : '#fff', border: `1px solid ${border2}`, color: textPri }

  const [zones, setZones]           = useState(() => loadZones())
  const [search, setSearch]         = useState('')
  const [filterColor, setFilterColor] = useState(null)
  const [showEmpty, setShowEmpty]   = useState(false)

  // Modals
  const [addModal, setAddModal]     = useState(false)
  const [editBottle, setEditBottle] = useState(null)
  const [form, setForm]             = useState(EMPTY_BOTTLE)
  const [saving, setSaving]         = useState(false)

  const [drinkBottle, setDrinkBottle]   = useState(null)
  const [drinkZone, setDrinkZone]       = useState(null)
  const [drinkForm, setDrinkForm]       = useState(EMPTY_DRINK)
  const [drinking, setDrinking]         = useState(false)

  const [addZoneModal, setAddZoneModal] = useState(null) // bottle id
  const [addZonePick, setAddZonePick]   = useState('cave')
  const [addZoneQty, setAddZoneQty]     = useState(1)

  const [transferModal, setTransferModal] = useState(null) // bottle
  const [tfFrom, setTfFrom]           = useState('')
  const [tfTo, setTfTo]               = useState('')
  const [tfQty, setTfQty]             = useState(1)
  const [transferring, setTransferring] = useState(false)

  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [zoneSettings, setZoneSettings] = useState(false)
  const [newZoneName, setNewZoneName]   = useState('')
  const [newZoneEmoji, setNewZoneEmoji] = useState('📦')

  const filtered = bottles
    .filter(b => showEmpty ? true : getTotalQty(b) > 0)
    .filter(b => !filterColor || b.color === filterColor)
    .filter(b => !search || [b.name, b.domain, b.appellation, b.region]
      .some(v => v?.toLowerCase().includes(search.toLowerCase())))

  const totalBottles = bottles.filter(b => getTotalQty(b) > 0).length
  const totalQty     = bottles.reduce((s, b) => s + getTotalQty(b), 0)

  // ── Bottle add/edit ──
  const openAdd = () => { setForm(EMPTY_BOTTLE); setEditBottle(null); setAddModal(true) }
  const openEdit = (b) => {
    setForm({ name: b.name||'', domain: b.domain||'', appellation: b.appellation||'',
      vintage: b.vintage||'', color: b.color||'rouge', region: b.region||'',
      grape: b.grape||'', quantity: b.quantity||1, zone: b.zone||'cave', purchase_note: b.purchase_note||'' })
    setEditBottle(b); setAddModal(true)
  }
  const saveBottle = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    const initLocs = [{ zone: form.zone || 'cave', qty: Math.max(1, parseInt(form.quantity) || 1) }]
    const payload = {
      name: form.name.trim(), domain: form.domain.trim()||null,
      appellation: form.appellation.trim()||null, vintage: form.vintage ? parseInt(form.vintage) : null,
      color: form.color||'rouge', region: form.region.trim()||null, grape: form.grape.trim()||null,
      quantity: Math.max(1, parseInt(form.quantity)||1), zone: form.zone||'cave',
      purchase_note: form.purchase_note.trim()||null,
    }
    if (editBottle) {
      await hook.updateBottle(editBottle.id, payload)
    } else {
      await hook.addBottle({ ...payload, locations: initLocs })
    }
    setSaving(false); setAddModal(false); setEditBottle(null)
  }

  // ── Drink ──
  const openDrink = (bottle) => {
    const locs = getLocations(bottle)
    setDrinkBottle(bottle)
    setDrinkZone(locs.length === 1 ? locs[0].zone : null)
    setDrinkForm({ ...EMPTY_DRINK, tasted_at: new Date().toISOString().slice(0, 10) })
  }
  const confirmDrink = async () => {
    if (!drinkBottle || !drinkZone) return
    setDrinking(true)
    await hook.drinkBottle(drinkBottle, drinkZone, {
      rating: drinkForm.rating||null, is_favorite: drinkForm.is_favorite,
      note: drinkForm.note.trim()||null, tasted_at: drinkForm.tasted_at,
    })
    setDrinking(false); setDrinkBottle(null)
  }

  // ── Add to zone ──
  const openAddZone = (bottleId) => { setAddZoneModal(bottleId); setAddZonePick(zones[0]?.id||'cave'); setAddZoneQty(1) }
  const confirmAddZone = async () => {
    await hook.addToZone(addZoneModal, addZonePick, addZoneQty)
    setAddZoneModal(null)
  }

  // ── Transfer ──
  const openTransfer = (bottle) => {
    const locs = getLocations(bottle)
    setTransferModal(bottle)
    setTfFrom(locs[0]?.zone || '')
    setTfTo(locs[1]?.zone || zones.find(z => z.id !== locs[0]?.zone)?.id || '')
    setTfQty(1)
  }
  const confirmTransfer = async () => {
    if (!tfFrom || !tfTo || tfFrom === tfTo || tfQty < 1) return
    setTransferring(true)
    await hook.transferZone(transferModal.id, tfFrom, tfTo, tfQty)
    setTransferring(false); setTransferModal(null)
  }

  // ── Zone settings ──
  const addZone = () => {
    if (!newZoneName.trim()) return
    const newZ = { id: newZoneName.trim().toLowerCase().replace(/\s+/g,'-'), name: newZoneName.trim(), emoji: newZoneEmoji }
    const updated = [...zones, newZ]
    setZones(updated); saveZones(updated); setNewZoneName(''); setNewZoneEmoji('📦')
  }
  const removeZone = (id) => {
    const updated = zones.filter(z => z.id !== id)
    setZones(updated); saveZones(updated)
  }

  if (loading) return <div className="flex justify-center py-20" style={{ background: bg }}><Spinner color={COLOR} /></div>

  return (
    <div style={{ background: bg, minHeight: '100%' }}>
      <div className="px-4 pt-4 pb-28 max-w-lg mx-auto">

        {/* Stats */}
        <div className="flex gap-2 mb-4">
          {[{ label: 'Références', v: totalBottles }, { label: 'Bouteilles', v: totalQty }, { label: 'Zones', v: zones.length }].map(s => (
            <div key={s.label} className="flex-1 rounded-xl py-2.5 px-3 text-center" style={{ background: card, border: `0.5px solid ${border}` }}>
              <p className="text-lg font-bold" style={{ color: COLOR }}>{s.v}</p>
              <p className="text-[10px] uppercase tracking-wide" style={{ color: textSec }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Rechercher un vin, domaine, région…"
          className="w-full px-4 py-2.5 rounded-xl text-sm mb-3 focus:outline-none"
          style={inp} />

        {/* Filtres couleur */}
        <div className="flex gap-1 mb-3">
          <button onClick={() => setFilterColor(null)}
            className="flex-shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium"
            style={{ background: !filterColor ? COLOR : (dark?'#1a1035':'#f3f4f6'), color: !filterColor?'#fff':textSec, border:`1px solid ${!filterColor?COLOR:border2}` }}>
            Tous
          </button>
          {COLORS_LIST.map(c => (
            <button key={c.id} onClick={() => setFilterColor(filterColor===c.id?null:c.id)}
              className="flex-1 py-1 rounded-full text-[11px] font-medium"
              style={{ background: filterColor===c.id?`${COLOR}22`:(dark?'#1a1035':'#f3f4f6'), color: filterColor===c.id?COLOR:textSec, border:`1px solid ${filterColor===c.id?COLOR:border2}` }}>
              {c.emoji} {c.label}
            </button>
          ))}
          <button onClick={() => setShowEmpty(e=>!e)}
            className="flex-shrink-0 px-2 py-1 rounded-full text-[11px]"
            style={{ background: showEmpty?`${COLOR}18`:'transparent', color: showEmpty?COLOR:textSec, border:`1px solid ${showEmpty?COLOR:border2}` }}>
            {showEmpty?'−∅':'∅'}
          </button>
        </div>

        {/* Liste */}
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">🍷</div>
            <p className="font-medium mb-1" style={{ color: textMed }}>La cave est vide</p>
            <p className="text-sm" style={{ color: textSec }}>Ajoute ta première bouteille ↓</p>
          </div>
        )}

        <div className="space-y-2">
          {filtered.map(bottle => {
            const locs = getLocations(bottle)
            const total = getTotalQty(bottle)
            const isLast = total === 1
            const primary = bottle.domain || bottle.name
            const secondary = bottle.domain ? bottle.name : null

            return (
              <div key={bottle.id} className="rounded-2xl p-3.5"
                style={{ background: card, border: `0.5px solid ${isLast?'#f59e0b':border}`, opacity: total===0?0.5:1 }}>
                <div className="flex items-start gap-3">

                  {/* Gauche */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-0.5 block"
                        style={{ background: COLOR_MAP[bottle.color]||'#9ca3af' }} />
                      <p className="text-sm font-bold truncate" style={{ color: textPri }}>{primary}</p>
                      {isLast && <span className="text-[9px] px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ background:'#fef3c7',color:'#92400e' }}>Dernière !</span>}
                    </div>
                    {secondary && <p className="text-xs mb-0.5 truncate" style={{ color: textSec }}>{secondary}</p>}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {bottle.vintage && <span className="text-[11px]" style={{ color: textSec }}>{bottle.vintage}</span>}
                      {bottle.appellation && <span className="text-[11px]" style={{ color: textSec }}>· {bottle.appellation}</span>}
                      {bottle.region && <span className="text-[11px]" style={{ color: textSec }}>· {bottle.region}</span>}
                    </div>
                    {/* Zones */}
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {locs.map(l => {
                        const zi = getZoneInfo(zones, l.zone)
                        return (
                          <span key={l.zone} className="text-[11px] px-2 py-0.5 rounded-full"
                            style={{ background:`${COLOR}12`, color: COLOR }}>
                            {zi.emoji} {zi.name} ×{l.qty}
                          </span>
                        )
                      })}
                    </div>
                  </div>

                  {/* Droite */}
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <div className="flex items-center gap-1">
                      <span className="text-base font-bold" style={{ color: COLOR }}>×{total}</span>
                      <button onClick={() => openAddZone(bottle.id)}
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold active:scale-90 transition-transform"
                        style={{ background: COLOR }}>+</button>
                    </div>
                    {locs.length > 1 && (
                      <button onClick={() => openTransfer(bottle)}
                        className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg active:scale-95"
                        style={{ background: dark?'#1f2937':'#f3f4f6', color: textSec }}>
                        <ArrowRightLeft size={10}/> Transférer
                      </button>
                    )}
                    <div className="flex items-center gap-1 mt-0.5">
                      <button onClick={() => openEdit(bottle)} className="p-1 rounded-lg active:scale-95" style={{ background: dark?'#1f2937':'#f3f4f6', color: textSec }}>✏️</button>
                      <button onClick={() => setDeleteConfirm(bottle.id)} className="p-1 rounded-lg active:scale-95" style={{ background: dark?'#1f2937':'#f3f4f6', color: textSec }}><Trash2 size={12}/></button>
                      {total > 0 && (
                        <button onClick={() => openDrink(bottle)}
                          className="px-2.5 py-1.5 rounded-xl text-[11px] font-semibold text-white active:scale-95"
                          style={{ background: COLOR }}>Bu 🍷</button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* FAB */}
      <button onClick={openAdd}
        className="fixed bottom-20 right-4 w-14 h-14 rounded-full flex items-center justify-center shadow-lg active:scale-95 z-10"
        style={{ background: COLOR }}>
        <Plus size={24} color="white" />
      </button>

      {/* ── Modal Ajouter/Modifier ── */}
      <BottomModal open={addModal} onClose={() => { setAddModal(false); setEditBottle(null) }} cardBg={dark?'#1a1035':'#fff'} maxHeight="90vh">
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="font-bold text-base" style={{ color: textPri }}>{editBottle ? '✏️ Modifier' : '🍷 Ajouter une bouteille'}</p>
            <button onClick={() => { setAddModal(false); setEditBottle(null) }}><X size={20} style={{ color: textSec }}/></button>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-xs mb-1.5" style={{ color: textSec }}>Domaine / Producteur</p>
              <input value={form.domain} onChange={e => setForm(f=>({...f,domain:e.target.value}))}
                placeholder="Château Pichon Baron" autoFocus className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none" style={inp}/>
            </div>
            <div>
              <p className="text-xs mb-1.5" style={{ color: textSec }}>Nom de la cuvée</p>
              <input value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))}
                placeholder="Grand Vin de Bordeaux *" className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none" style={inp}/>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-xs mb-1.5" style={{ color: textSec }}>Appellation</p>
                <input value={form.appellation} onChange={e => setForm(f=>({...f,appellation:e.target.value}))}
                  placeholder="Pauillac" className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none" style={inp}/>
              </div>
              <div>
                <p className="text-xs mb-1.5" style={{ color: textSec }}>Région</p>
                <input value={form.region} onChange={e => setForm(f=>({...f,region:e.target.value}))}
                  placeholder="Bordeaux" className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none" style={inp}/>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <p className="text-xs mb-1.5" style={{ color: textSec }}>Millésime</p>
                <input value={form.vintage} type="number" onChange={e => setForm(f=>({...f,vintage:e.target.value}))}
                  placeholder="2019" className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none" style={inp}/>
              </div>
              <div>
                <p className="text-xs mb-1.5" style={{ color: textSec }}>Cépage</p>
                <input value={form.grape} onChange={e => setForm(f=>({...f,grape:e.target.value}))}
                  placeholder="Merlot" className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none" style={inp}/>
              </div>
              <div>
                <p className="text-xs mb-1.5" style={{ color: textSec }}>Qté</p>
                <input value={form.quantity} type="number" min="1" onChange={e => setForm(f=>({...f,quantity:e.target.value}))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none" style={inp}/>
              </div>
            </div>

            {/* Couleur */}
            <div>
              <p className="text-xs mb-2" style={{ color: textSec }}>Couleur</p>
              <div className="flex gap-1.5">
                {COLORS_LIST.map(c => (
                  <button key={c.id} onClick={() => setForm(f=>({...f,color:c.id}))}
                    className="flex-1 py-2 rounded-xl text-[11px] font-medium transition-all active:scale-95"
                    style={{ background:form.color===c.id?`${COLOR}22`:'transparent', border:`1.5px solid ${form.color===c.id?COLOR:border2}`, color:form.color===c.id?COLOR:textSec }}>
                    {c.emoji} {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Zone */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs" style={{ color: textSec }}>Zone initiale</p>
                <button onClick={() => setZoneSettings(true)} className="text-[11px]" style={{ color: textSec }}>⚙️ Gérer</button>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {zones.map(z => (
                  <button key={z.id} onClick={() => setForm(f=>({...f,zone:z.id}))}
                    className="px-3 py-2 rounded-xl text-xs font-medium transition-all active:scale-95"
                    style={{ background:form.zone===z.id?`${COLOR}22`:'transparent', border:`1.5px solid ${form.zone===z.id?COLOR:border2}`, color:form.zone===z.id?COLOR:textSec }}>
                    {z.emoji} {z.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs mb-1.5" style={{ color: textSec }}>Note d'achat</p>
              <input value={form.purchase_note} onChange={e => setForm(f=>({...f,purchase_note:e.target.value}))}
                placeholder="Cadeau, cave coopérative…" className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none" style={inp}/>
            </div>
          </div>

          <button onClick={saveBottle} disabled={!form.name.trim()||saving}
            className="w-full py-3.5 rounded-full text-white font-semibold disabled:opacity-30 active:scale-95 mt-4"
            style={{ background: COLOR }}>
            {saving ? 'Sauvegarde…' : editBottle ? 'Modifier' : 'Ajouter à la cave'}
          </button>
        </div>
      </BottomModal>

      {/* ── Modal Bu 🍷 ── */}
      <BottomModal open={!!drinkBottle} onClose={() => setDrinkBottle(null)} cardBg={dark?'#1a1035':'#fff'}>
        {drinkBottle && (
          <div className="p-5">
            <div className="flex items-center justify-between mb-1">
              <p className="font-bold text-base" style={{ color: textPri }}>🍷 Bu !</p>
              <button onClick={() => setDrinkBottle(null)}><X size={20} style={{ color: textSec }}/></button>
            </div>
            <p className="text-sm mb-4" style={{ color: textSec }}>
              {drinkBottle.domain || drinkBottle.name}{drinkBottle.vintage ? ` · ${drinkBottle.vintage}` : ''}
            </p>

            {/* Choix zone si plusieurs */}
            {getLocations(drinkBottle).length > 1 && (
              <div className="mb-4">
                <p className="text-xs mb-2" style={{ color: textSec }}>De quelle zone ?</p>
                <div className="flex gap-2 flex-wrap">
                  {getLocations(drinkBottle).map(l => {
                    const zi = getZoneInfo(zones, l.zone)
                    return (
                      <button key={l.zone} onClick={() => setDrinkZone(l.zone)}
                        className="px-3 py-2 rounded-xl text-xs font-medium transition-all active:scale-95"
                        style={{ background:drinkZone===l.zone?`${COLOR}22`:'transparent', border:`1.5px solid ${drinkZone===l.zone?COLOR:border2}`, color:drinkZone===l.zone?COLOR:textSec }}>
                        {zi.emoji} {zi.name} ×{l.qty}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="mb-4">
              <p className="text-xs mb-1.5" style={{ color: textSec }}>Date</p>
              <input type="date" value={drinkForm.tasted_at} onChange={e => setDrinkForm(f=>({...f,tasted_at:e.target.value}))}
                className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none" style={inp}/>
            </div>
            <div className="mb-4">
              <p className="text-xs mb-2" style={{ color: textSec }}>Note ⭐</p>
              <StarRating value={drinkForm.rating} onChange={v => setDrinkForm(f=>({...f,rating:v}))} dark={dark}/>
            </div>
            <div className="mb-4">
              <button onClick={() => setDrinkForm(f=>({...f,is_favorite:!f.is_favorite}))}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl active:scale-95"
                style={{ background:drinkForm.is_favorite?'#fce7f333':(dark?'#1f2937':'#f9fafb'), border:`1.5px solid ${drinkForm.is_favorite?'#ec4899':border2}` }}>
                <span className="text-xl">{drinkForm.is_favorite?'❤️':'🤍'}</span>
                <span className="text-sm font-medium" style={{ color:drinkForm.is_favorite?'#ec4899':textMed }}>Coup de cœur</span>
              </button>
            </div>
            <div className="mb-5">
              <p className="text-xs mb-1.5" style={{ color: textSec }}>Note de dégustation</p>
              <textarea value={drinkForm.note} onChange={e => setDrinkForm(f=>({...f,note:e.target.value}))}
                placeholder="Robe, nez, bouche, finale…" rows={3}
                className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none resize-none" style={inp}/>
            </div>
            <button onClick={confirmDrink} disabled={drinking || (!drinkZone && getLocations(drinkBottle).length > 1)}
              className="w-full py-3.5 rounded-full text-white font-semibold disabled:opacity-30 active:scale-95"
              style={{ background: COLOR }}>
              {drinking ? 'Enregistrement…' : 'Confirmer → Journal'}
            </button>
          </div>
        )}
      </BottomModal>

      {/* ── Modal Ajouter à une zone ── */}
      <BottomModal open={!!addZoneModal} onClose={() => setAddZoneModal(null)} cardBg={dark?'#1a1035':'#fff'}>
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="font-bold" style={{ color: textPri }}>➕ Ajouter des bouteilles</p>
            <button onClick={() => setAddZoneModal(null)}><X size={20} style={{ color: textSec }}/></button>
          </div>
          <p className="text-xs mb-2" style={{ color: textSec }}>Zone</p>
          <div className="flex gap-2 flex-wrap mb-4">
            {zones.map(z => (
              <button key={z.id} onClick={() => setAddZonePick(z.id)}
                className="px-3 py-2 rounded-xl text-xs font-medium active:scale-95"
                style={{ background:addZonePick===z.id?`${COLOR}22`:'transparent', border:`1.5px solid ${addZonePick===z.id?COLOR:border2}`, color:addZonePick===z.id?COLOR:textSec }}>
                {z.emoji} {z.name}
              </button>
            ))}
          </div>
          <p className="text-xs mb-2" style={{ color: textSec }}>Quantité</p>
          <div className="flex items-center gap-3 mb-5">
            <button onClick={() => setAddZoneQty(q=>Math.max(1,q-1))}
              className="w-10 h-10 rounded-full text-xl font-bold flex items-center justify-center active:scale-90"
              style={{ background:dark?'#1f2937':'#f3f4f6', color:textPri }}>−</button>
            <span className="text-2xl font-bold w-12 text-center" style={{ color: textPri }}>{addZoneQty}</span>
            <button onClick={() => setAddZoneQty(q=>q+1)}
              className="w-10 h-10 rounded-full text-xl font-bold flex items-center justify-center active:scale-90"
              style={{ background: COLOR, color:'#fff' }}>+</button>
          </div>
          <button onClick={confirmAddZone}
            className="w-full py-3.5 rounded-full text-white font-semibold active:scale-95"
            style={{ background: COLOR }}>
            Ajouter {addZoneQty} bouteille{addZoneQty>1?'s':''} à {getZoneInfo(zones,addZonePick).emoji} {getZoneInfo(zones,addZonePick).name}
          </button>
        </div>
      </BottomModal>

      {/* ── Modal Transfert ── */}
      <BottomModal open={!!transferModal} onClose={() => setTransferModal(null)} cardBg={dark?'#1a1035':'#fff'}>
        {transferModal && (
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="font-bold" style={{ color: textPri }}>⇄ Transférer</p>
              <button onClick={() => setTransferModal(null)}><X size={20} style={{ color: textSec }}/></button>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <p className="text-xs mb-2" style={{ color: textSec }}>De</p>
                <div className="flex flex-col gap-1.5">
                  {getLocations(transferModal).map(l => {
                    const zi = getZoneInfo(zones, l.zone)
                    return (
                      <button key={l.zone} onClick={() => setTfFrom(l.zone)}
                        className="px-3 py-2 rounded-xl text-xs text-left active:scale-95"
                        style={{ background:tfFrom===l.zone?`${COLOR}22`:'transparent', border:`1.5px solid ${tfFrom===l.zone?COLOR:border2}`, color:tfFrom===l.zone?COLOR:textSec }}>
                        {zi.emoji} {zi.name} ×{l.qty}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div>
                <p className="text-xs mb-2" style={{ color: textSec }}>Vers</p>
                <div className="flex flex-col gap-1.5">
                  {zones.filter(z => z.id !== tfFrom).map(z => (
                    <button key={z.id} onClick={() => setTfTo(z.id)}
                      className="px-3 py-2 rounded-xl text-xs text-left active:scale-95"
                      style={{ background:tfTo===z.id?`${COLOR}22`:'transparent', border:`1.5px solid ${tfTo===z.id?COLOR:border2}`, color:tfTo===z.id?COLOR:textSec }}>
                      {z.emoji} {z.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <p className="text-xs mb-2" style={{ color: textSec }}>Combien ?</p>
            <div className="flex items-center gap-3 mb-5">
              <button onClick={() => setTfQty(q=>Math.max(1,q-1))}
                className="w-10 h-10 rounded-full text-xl font-bold flex items-center justify-center active:scale-90"
                style={{ background:dark?'#1f2937':'#f3f4f6', color:textPri }}>−</button>
              <span className="text-2xl font-bold w-12 text-center" style={{ color: textPri }}>{tfQty}</span>
              <button onClick={() => setTfQty(q=>q+1)}
                className="w-10 h-10 rounded-full text-xl font-bold flex items-center justify-center active:scale-90"
                style={{ background: COLOR, color:'#fff' }}>+</button>
            </div>
            <button onClick={confirmTransfer} disabled={transferring || !tfFrom || !tfTo || tfFrom===tfTo}
              className="w-full py-3.5 rounded-full text-white font-semibold disabled:opacity-30 active:scale-95"
              style={{ background: COLOR }}>
              {transferring ? 'Transfert…' : `Transférer ${tfQty} bouteille${tfQty>1?'s':''}`}
            </button>
          </div>
        )}
      </BottomModal>

      {/* ── Modal Gestion zones ── */}
      <BottomModal open={zoneSettings} onClose={() => setZoneSettings(false)} cardBg={dark?'#1a1035':'#fff'}>
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="font-bold" style={{ color: textPri }}>⚙️ Gérer les zones</p>
            <button onClick={() => setZoneSettings(false)}><X size={20} style={{ color: textSec }}/></button>
          </div>
          <div className="space-y-2 mb-4">
            {zones.map(z => (
              <div key={z.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                style={{ background:dark?'#0f0a1e':'#f9fafb', border:`0.5px solid ${border}` }}>
                <span className="text-xl">{z.emoji}</span>
                <span className="flex-1 text-sm font-medium" style={{ color: textPri }}>{z.name}</span>
                {!DEFAULT_ZONES.find(d=>d.id===z.id) && (
                  <button onClick={() => removeZone(z.id)} style={{ color: '#dc2626' }}><X size={14}/></button>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs mb-2" style={{ color: textSec }}>Ajouter une zone</p>
          <div className="flex gap-2 mb-3">
            <input value={newZoneEmoji} onChange={e => setNewZoneEmoji(e.target.value)}
              className="w-14 px-2 py-2.5 rounded-xl text-center text-lg focus:outline-none" style={inp}/>
            <input value={newZoneName} onChange={e => setNewZoneName(e.target.value)}
              placeholder="Nom de la zone" className="flex-1 px-3 py-2.5 rounded-xl text-sm focus:outline-none" style={inp}
              onKeyDown={e => e.key==='Enter' && addZone()}/>
          </div>
          <button onClick={addZone} disabled={!newZoneName.trim()}
            className="w-full py-3 rounded-full text-white font-semibold disabled:opacity-30 active:scale-95"
            style={{ background: COLOR }}>
            Ajouter
          </button>
        </div>
      </BottomModal>

      {/* ── Modal Suppression ── */}
      <BottomModal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} cardBg={dark?'#1a1035':'#fff'}>
        <div className="p-5">
          <p className="font-bold text-base mb-2" style={{ color: textPri }}>Supprimer cette bouteille ?</p>
          <p className="text-sm mb-5" style={{ color: textSec }}>Cette action est irréversible.</p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3 rounded-full font-medium"
              style={{ background:dark?'#1f2937':'#f3f4f6', color:textSec }}>Annuler</button>
            <button onClick={async () => { await hook.deleteBottle(deleteConfirm); setDeleteConfirm(null) }}
              className="flex-1 py-3 rounded-full text-white font-semibold" style={{ background:'#dc2626' }}>
              Supprimer
            </button>
          </div>
        </div>
      </BottomModal>
    </div>
  )
}
