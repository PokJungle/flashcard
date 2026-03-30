import { useState } from 'react'
import { X } from 'lucide-react'
import { useThemeColors } from '../../../hooks/useThemeColors'
import BottomModal from '../../../components/BottomModal'
import Spinner from '../../../components/Spinner'

const COLOR = '#9b1c1c'

const COLORS_LIST = [
  { id: 'rouge',        label: 'Rouge',        emoji: '🍷' },
  { id: 'blanc',        label: 'Blanc',        emoji: '🥂' },
  { id: 'rosé',         label: 'Rosé',         emoji: '🌸' },
  { id: 'effervescent', label: 'Effervescent', emoji: '🍾' },
]

const EMPTY_TASTING = {
  name: '', domain: '', appellation: '', vintage: '',
  color: 'rouge', region: '', grape: '',
  rating: 0, is_favorite: false, note: '',
  tasted_at: new Date().toISOString().slice(0, 10),
}
const EMPTY_REACTION = { rating: 0, is_favorite: false, note: '' }

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

function StarDisplay({ value }) {
  if (!value) return null
  return (
    <span className="text-sm font-bold" style={{ color: COLOR }}>{value}★</span>
  )
}

function formatDate(str) {
  if (!str) return ''
  return new Date(str + 'T00:00:00').toLocaleDateString('fr-FR', { day:'numeric', month:'short', year:'numeric' })
}

function TastingOpinion({ label, avatar, rating, is_favorite, note, textSec, textPri, dark }) {
  return (
    <div className="rounded-xl p-2.5" style={{ background: dark ? '#0f0a1e' : '#f9fafb' }}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm">{avatar}</span>
        <span className="text-[11px] font-medium" style={{ color: textSec }}>{label}</span>
        {is_favorite && <span className="text-sm">❤️</span>}
        <StarDisplay value={rating} />
      </div>
      {note && <p className="text-xs leading-relaxed" style={{ color: textSec }}>{note}</p>}
    </div>
  )
}

function Palmares({ tastings, profiles, profile, dark }) {
  const { card, border, textPri, textSec } = useThemeColors(dark)
  const [scope, setScope] = useState('all')

  const filtered = scope === 'me' ? tastings.filter(t => t.profile_id === profile.id) : tastings
  const rated = filtered.filter(t => t.rating)

  const byColor = COLORS_LIST.map(c => {
    const g = rated.filter(t => t.color === c.id)
    return { ...c, count: g.length, avg: g.length ? g.reduce((s,t)=>s+t.rating,0)/g.length : null }
  }).filter(c => c.count > 0).sort((a,b) => b.avg - a.avg)

  const regionMap = {}
  rated.forEach(t => {
    if (!t.region) return
    if (!regionMap[t.region]) regionMap[t.region] = { total:0, count:0 }
    regionMap[t.region].total += t.rating
    regionMap[t.region].count++
  })
  const byRegion = Object.entries(regionMap)
    .map(([r,d]) => ({ region:r, avg:d.total/d.count, count:d.count }))
    .sort((a,b) => b.avg - a.avg).slice(0,5)

  const favorites = filtered.filter(t => t.is_favorite)
    .sort((a,b) => new Date(b.tasted_at)-new Date(a.tasted_at)).slice(0,5)

  return (
    <div>
      <div className="flex rounded-xl overflow-hidden mb-4" style={{ border:`1px solid ${border}` }}>
        {[{id:'all',label:'👫 Ensemble'},{id:'me',label:`${profile.avatar} Moi`}].map(s => (
          <button key={s.id} onClick={() => setScope(s.id)}
            className="flex-1 py-2 text-xs font-medium"
            style={{ background:scope===s.id?COLOR:'transparent', color:scope===s.id?'#fff':textSec }}>
            {s.label}
          </button>
        ))}
      </div>
      {rated.length === 0 && <p className="text-center text-sm py-8" style={{ color: textSec }}>Pas encore de vins notés</p>}
      {byColor.length > 0 && (
        <div className="mb-5">
          <p className="text-[11px] uppercase tracking-widest mb-2.5" style={{ color: textSec }}>Par couleur</p>
          <div className="space-y-2">
            {byColor.map(c => (
              <div key={c.id} className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background:card, border:`0.5px solid ${border}` }}>
                <span className="text-lg">{c.emoji}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: textPri }}>{c.label}</p>
                  <p className="text-xs" style={{ color: textSec }}>{c.count} dégustation{c.count>1?'s':''}</p>
                </div>
                <span className="text-sm font-bold" style={{ color: COLOR }}>{c.avg.toFixed(1)} ★</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {byRegion.length > 0 && (
        <div className="mb-5">
          <p className="text-[11px] uppercase tracking-widest mb-2.5" style={{ color: textSec }}>Top régions</p>
          <div className="space-y-2">
            {byRegion.map((r,i) => (
              <div key={r.region} className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background:card, border:`0.5px solid ${border}` }}>
                <span className="text-sm font-bold w-5 text-center" style={{ color: textSec }}>{i+1}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: textPri }}>{r.region}</p>
                  <p className="text-xs" style={{ color: textSec }}>{r.count} vin{r.count>1?'s':''}</p>
                </div>
                <span className="text-sm font-bold" style={{ color: COLOR }}>{r.avg.toFixed(1)} ★</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {favorites.length > 0 && (
        <div>
          <p className="text-[11px] uppercase tracking-widest mb-2.5" style={{ color: textSec }}>Coups de cœur ❤️</p>
          <div className="space-y-2">
            {favorites.map(t => {
              const author = profiles.find(p => p.id === t.profile_id)
              return (
                <div key={t.id} className="flex items-center gap-3 rounded-xl px-4 py-3"
                  style={{ background:dark?'#1a0a0a':'#fff5f5', border:`1px solid ${dark?'#7f1d1d44':'#fecaca'}` }}>
                  <span className="text-lg">❤️</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: textPri }}>{t.domain||t.name}</p>
                    {t.vintage && <p className="text-xs" style={{ color: textSec }}>{t.vintage}</p>}
                  </div>
                  {author && <span className="text-sm">{author.avatar}</span>}
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
  const inp = { background: dark?'#0f0a1e':'#fff', border:`1px solid ${border2}`, color: textPri }

  const [tab, setTab]               = useState('liste')
  const [filterColor, setFilterColor] = useState(null)
  const [addModal, setAddModal]     = useState(false)
  const [form, setForm]             = useState(EMPTY_TASTING)
  const [saving, setSaving]         = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  // Réaction (avis du second profil)
  const [reactionModal, setReactionModal] = useState(null) // tasting id
  const [reactionForm, setReactionForm]   = useState(EMPTY_REACTION)
  const [savingReaction, setSavingReaction] = useState(false)

  const visibleTastings = tastings.filter(t => !filterColor || t.color === filterColor)

  const saveTasting = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    await hook.addTasting({
      name: form.name.trim(), domain: form.domain.trim()||null,
      appellation: form.appellation.trim()||null, vintage: form.vintage?parseInt(form.vintage):null,
      color: form.color||'rouge', region: form.region.trim()||null, grape: form.grape.trim()||null,
      rating: form.rating||null, is_favorite: form.is_favorite,
      note: form.note.trim()||null, tasted_at: form.tasted_at,
    })
    setSaving(false); setAddModal(false)
  }

  const openReaction = (tasting) => {
    // Pré-remplir si réaction existante
    const existing = (tasting.reactions||[]).find(r => r.profile_id === profile.id)
    setReactionForm(existing ? { rating:existing.rating||0, is_favorite:!!existing.is_favorite, note:existing.note||'' } : EMPTY_REACTION)
    setReactionModal(tasting.id)
  }
  const saveReaction = async () => {
    setSavingReaction(true)
    await hook.addReaction(reactionModal, reactionForm)
    setSavingReaction(false); setReactionModal(null)
  }

  if (loading) return <div className="flex justify-center py-20" style={{ background: bg }}><Spinner color={COLOR} /></div>

  return (
    <div style={{ background: bg, minHeight: '100%' }}>
      <div className="px-4 pt-4 pb-28 max-w-lg mx-auto">

        {/* Stats */}
        <div className="flex gap-2 mb-4">
          <div className="flex-1 rounded-xl py-2.5 px-3 text-center" style={{ background:card, border:`0.5px solid ${border}` }}>
            <p className="text-lg font-bold" style={{ color: COLOR }}>{tastings.length}</p>
            <p className="text-[10px] uppercase tracking-wide" style={{ color: textSec }}>Dégustations</p>
          </div>
          <div className="flex-1 rounded-xl py-2.5 px-3 text-center" style={{ background:card, border:`0.5px solid ${border}` }}>
            <p className="text-lg font-bold" style={{ color: COLOR }}>{tastings.filter(t=>t.is_favorite).length}</p>
            <p className="text-[10px] uppercase tracking-wide" style={{ color: textSec }}>Coups de cœur</p>
          </div>
          <button onClick={() => { setForm({...EMPTY_TASTING,tasted_at:new Date().toISOString().slice(0,10)}); setAddModal(true) }}
            className="flex-1 rounded-xl py-2.5 px-3 flex flex-col items-center justify-center active:scale-95"
            style={{ background:`${COLOR}18`, border:`1px solid ${COLOR}44` }}>
            <span className="text-lg">＋</span>
            <span className="text-[10px] uppercase tracking-wide" style={{ color: COLOR }}>Ajouter</span>
          </button>
        </div>

        {/* Onglets */}
        <div className="flex rounded-xl overflow-hidden mb-4" style={{ border:`1px solid ${border2}` }}>
          {[{id:'liste',label:'📓 Liste'},{id:'palmares',label:'🏆 Palmarès'}].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex-1 py-2 text-xs font-medium"
              style={{ background:tab===t.id?COLOR:'transparent', color:tab===t.id?'#fff':textSec }}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'palmares' && (
          <Palmares tastings={tastings} profiles={profiles} profile={profile} dark={dark} />
        )}

        {tab === 'liste' && (
          <>
            <div className="flex gap-1 mb-4">
              <button onClick={() => setFilterColor(null)}
                className="flex-shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium"
                style={{ background:!filterColor?COLOR:(dark?'#1a1035':'#f3f4f6'), color:!filterColor?'#fff':textSec, border:`1px solid ${!filterColor?COLOR:border2}` }}>
                Tous
              </button>
              {COLORS_LIST.map(c => (
                <button key={c.id} onClick={() => setFilterColor(filterColor===c.id?null:c.id)}
                  className="flex-1 py-1 rounded-full text-[11px] font-medium"
                  style={{ background:filterColor===c.id?`${COLOR}22`:(dark?'#1a1035':'#f3f4f6'), color:filterColor===c.id?COLOR:textSec, border:`1px solid ${filterColor===c.id?COLOR:border2}` }}>
                  {c.emoji} {c.label}
                </button>
              ))}
            </div>

            {visibleTastings.length === 0 && (
              <div className="text-center py-16">
                <div className="text-5xl mb-3">📓</div>
                <p className="font-medium mb-1" style={{ color: textMed }}>Aucune dégustation</p>
                <p className="text-sm" style={{ color: textSec }}>Les vins bus depuis la cave apparaissent ici</p>
              </div>
            )}

            <div className="space-y-2">
              {visibleTastings.map(tasting => {
                const author    = profiles.find(p => p.id === tasting.profile_id)
                const reactions = Array.isArray(tasting.reactions) ? tasting.reactions : []
                const myReaction = reactions.find(r => r.profile_id === profile.id)
                // L'auteur a son avis dans les champs directs.
                // Le second profil peut avoir son avis dans reactions.
                const otherReactions = reactions.filter(r => r.profile_id !== tasting.profile_id)
                const canReact = tasting.profile_id !== profile.id && !myReaction

                return (
                  <div key={tasting.id} className="rounded-2xl p-3.5"
                    style={{ background: tasting.is_favorite?(dark?'#1a0a0a':'#fff5f5'):card,
                      border:`0.5px solid ${tasting.is_favorite?(dark?'#7f1d1d66':'#fecaca'):border}` }}>

                    {/* Header */}
                    <div className="flex items-start gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 block"
                            style={{ background: {rouge:'#9b1c1c',blanc:'#d97706',rosé:'#db2777',effervescent:'#7c3aed'}[tasting.color]||'#9ca3af' }}/>
                          <p className="text-sm font-bold truncate" style={{ color: textPri }}>
                            {tasting.domain || tasting.name}
                          </p>
                          {tasting.is_favorite && <span className="text-sm flex-shrink-0">❤️</span>}
                        </div>
                        {tasting.domain && <p className="text-xs truncate" style={{ color: textSec }}>{tasting.name}</p>}
                        <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                          {tasting.vintage && <span className="text-[11px]" style={{ color: textSec }}>{tasting.vintage}</span>}
                          {tasting.appellation && <span className="text-[11px]" style={{ color: textSec }}>· {tasting.appellation}</span>}
                          {tasting.region && <span className="text-[11px]" style={{ color: textSec }}>· {tasting.region}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <p className="text-[10px]" style={{ color: textSec }}>{formatDate(tasting.tasted_at)}</p>
                        <button onClick={() => setDeleteConfirm(tasting.id)} className="p-1 rounded-lg" style={{ background:dark?'#1f2937':'#f3f4f6', color:textSec }}>
                          <X size={11}/>
                        </button>
                      </div>
                    </div>

                    {/* Avis */}
                    <div className="space-y-1.5">
                      {/* Avis auteur */}
                      {(tasting.rating || tasting.note || tasting.is_favorite) && (
                        <TastingOpinion
                          label="Avis"
                          avatar={author?.avatar}
                          rating={tasting.rating}
                          is_favorite={tasting.is_favorite}
                          note={tasting.note}
                          textSec={textSec} textPri={textPri} dark={dark}
                        />
                      )}

                      {/* Avis du second profil (depuis reactions) */}
                      {otherReactions.map(r => {
                        const rProfile = profiles.find(p => p.id === r.profile_id)
                        return (
                          <TastingOpinion key={r.profile_id}
                            label="Avis"
                            avatar={rProfile?.avatar}
                            rating={r.rating}
                            is_favorite={r.is_favorite}
                            note={r.note}
                            textSec={textSec} textPri={textPri} dark={dark}
                          />
                        )
                      })}

                      {/* Avis du profil courant s'il est dans reactions (créateur a réagi aussi) */}
                      {myReaction && tasting.profile_id !== profile.id && (
                        <TastingOpinion
                          label="Mon avis"
                          avatar={profile.avatar}
                          rating={myReaction.rating}
                          is_favorite={myReaction.is_favorite}
                          note={myReaction.note}
                          textSec={textSec} textPri={textPri} dark={dark}
                        />
                      )}
                    </div>

                    {/* Bouton Mon avis */}
                    {canReact && (
                      <button onClick={() => openReaction(tasting)}
                        className="mt-2 text-[11px] px-3 py-1.5 rounded-xl active:scale-95 font-medium"
                        style={{ background:`${COLOR}18`, color: COLOR, border:`1px solid ${COLOR}44` }}>
                        + Mon avis
                      </button>
                    )}
                    {/* Modifier mon avis */}
                    {myReaction && tasting.profile_id !== profile.id && (
                      <button onClick={() => openReaction(tasting)}
                        className="mt-2 text-[11px] px-3 py-1.5 rounded-xl active:scale-95"
                        style={{ background:dark?'#1f2937':'#f3f4f6', color: textSec }}>
                        ✏️ Modifier mon avis
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* ── Modal ajout dégustation ── */}
      <BottomModal open={addModal} onClose={() => setAddModal(false)} cardBg={dark?'#1a1035':'#fff'} maxHeight="90vh">
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="font-bold text-base" style={{ color: textPri }}>📓 Nouvelle dégustation</p>
            <button onClick={() => setAddModal(false)}><X size={20} style={{ color: textSec }}/></button>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-xs mb-1.5" style={{ color: textSec }}>Domaine / Producteur</p>
              <input value={form.domain} onChange={e => setForm(f=>({...f,domain:e.target.value}))}
                placeholder="Domaine Leflaive" autoFocus className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none" style={inp}/>
            </div>
            <div>
              <p className="text-xs mb-1.5" style={{ color: textSec }}>Nom de la cuvée *</p>
              <input value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))}
                placeholder="Bâtard-Montrachet" className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none" style={inp}/>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-xs mb-1.5" style={{ color: textSec }}>Région</p>
                <input value={form.region} onChange={e => setForm(f=>({...f,region:e.target.value}))}
                  placeholder="Bourgogne" className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none" style={inp}/>
              </div>
              <div>
                <p className="text-xs mb-1.5" style={{ color: textSec }}>Millésime</p>
                <input value={form.vintage} type="number" onChange={e => setForm(f=>({...f,vintage:e.target.value}))}
                  placeholder="2020" className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none" style={inp}/>
              </div>
            </div>
            <div>
              <p className="text-xs mb-2" style={{ color: textSec }}>Couleur</p>
              <div className="flex gap-1.5">
                {COLORS_LIST.map(c => (
                  <button key={c.id} onClick={() => setForm(f=>({...f,color:c.id}))}
                    className="flex-1 py-2 rounded-xl text-[11px] font-medium active:scale-95"
                    style={{ background:form.color===c.id?`${COLOR}22`:'transparent', border:`1.5px solid ${form.color===c.id?COLOR:border2}`, color:form.color===c.id?COLOR:textSec }}>
                    {c.emoji}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs mb-1.5" style={{ color: textSec }}>Date</p>
              <input type="date" value={form.tasted_at} onChange={e => setForm(f=>({...f,tasted_at:e.target.value}))}
                className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none" style={inp}/>
            </div>
            <div>
              <p className="text-xs mb-2" style={{ color: textSec }}>Note ⭐</p>
              <StarRating value={form.rating} onChange={v => setForm(f=>({...f,rating:v}))} dark={dark}/>
            </div>
            <button onClick={() => setForm(f=>({...f,is_favorite:!f.is_favorite}))}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl active:scale-95"
              style={{ background:form.is_favorite?'#fce7f333':(dark?'#1f2937':'#f9fafb'), border:`1.5px solid ${form.is_favorite?'#ec4899':border2}` }}>
              <span className="text-xl">{form.is_favorite?'❤️':'🤍'}</span>
              <span className="text-sm font-medium" style={{ color:form.is_favorite?'#ec4899':textSec }}>Coup de cœur</span>
            </button>
            <div>
              <p className="text-xs mb-1.5" style={{ color: textSec }}>Note de dégustation</p>
              <textarea value={form.note} onChange={e => setForm(f=>({...f,note:e.target.value}))}
                placeholder="Robe, nez, bouche, finale…" rows={3}
                className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none resize-none" style={inp}/>
            </div>
          </div>
          <button onClick={saveTasting} disabled={!form.name.trim()||saving}
            className="w-full py-3.5 rounded-full text-white font-semibold disabled:opacity-30 active:scale-95 mt-4"
            style={{ background: COLOR }}>
            {saving ? 'Sauvegarde…' : 'Ajouter au journal'}
          </button>
        </div>
      </BottomModal>

      {/* ── Modal Mon avis ── */}
      <BottomModal open={!!reactionModal} onClose={() => setReactionModal(null)} cardBg={dark?'#1a1035':'#fff'}>
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="font-bold" style={{ color: textPri }}>{profile.avatar} Mon avis</p>
            <button onClick={() => setReactionModal(null)}><X size={20} style={{ color: textSec }}/></button>
          </div>
          <div className="mb-4">
            <p className="text-xs mb-2" style={{ color: textSec }}>Note ⭐</p>
            <StarRating value={reactionForm.rating} onChange={v => setReactionForm(f=>({...f,rating:v}))} dark={dark}/>
          </div>
          <div className="mb-4">
            <button onClick={() => setReactionForm(f=>({...f,is_favorite:!f.is_favorite}))}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl active:scale-95"
              style={{ background:reactionForm.is_favorite?'#fce7f333':(dark?'#1f2937':'#f9fafb'), border:`1.5px solid ${reactionForm.is_favorite?'#ec4899':border2}` }}>
              <span className="text-xl">{reactionForm.is_favorite?'❤️':'🤍'}</span>
              <span className="text-sm font-medium" style={{ color:reactionForm.is_favorite?'#ec4899':textSec }}>Coup de cœur</span>
            </button>
          </div>
          <div className="mb-5">
            <p className="text-xs mb-1.5" style={{ color: textSec }}>Commentaire</p>
            <textarea value={reactionForm.note} onChange={e => setReactionForm(f=>({...f,note:e.target.value}))}
              placeholder="Mon ressenti…" rows={3}
              className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none resize-none" style={inp}/>
          </div>
          <button onClick={saveReaction} disabled={savingReaction}
            className="w-full py-3.5 rounded-full text-white font-semibold disabled:opacity-30 active:scale-95"
            style={{ background: COLOR }}>
            {savingReaction ? 'Sauvegarde…' : 'Enregistrer mon avis'}
          </button>
        </div>
      </BottomModal>

      {/* ── Suppression ── */}
      <BottomModal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} cardBg={dark?'#1a1035':'#fff'}>
        <div className="p-5">
          <p className="font-bold text-base mb-2" style={{ color: textPri }}>Supprimer cette dégustation ?</p>
          <p className="text-sm mb-5" style={{ color: textSec }}>Cette action est irréversible.</p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3 rounded-full font-medium"
              style={{ background:dark?'#1f2937':'#f3f4f6', color:textSec }}>Annuler</button>
            <button onClick={async () => { await hook.deleteTasting(deleteConfirm); setDeleteConfirm(null) }}
              className="flex-1 py-3 rounded-full text-white font-semibold" style={{ background:'#dc2626' }}>
              Supprimer
            </button>
          </div>
        </div>
      </BottomModal>
    </div>
  )
}
