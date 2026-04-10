import { useState } from 'react'
import { useThemeColors } from '../../hooks/useThemeColors'
import { usePlantes } from './hooks/usePlantes'
import { useWaterings } from './hooks/useWaterings'
import BottomModal from '../../components/BottomModal'
import TabBar from '../../components/TabBar'
import Spinner from '../../components/Spinner'
import PlanningScreen from './screens/PlanningScreen'
import PlantesScreen from './screens/PlantesScreen'
import HistoriqueScreen from './screens/HistoriqueScreen'

const COLOR = '#22c55e'

const TABS = [
  { id: 'planning',   emoji: '💧', label: 'Planning' },
  { id: 'plantes',    emoji: '🌿', label: 'Mes plantes' },
  { id: 'historique', emoji: '📋', label: 'Historique' },
]

const EMOJIS_PLANTES = ['🪴','🌿','🌱','🌵','🌺','🌸','🌻','🌹','🍀','🎋','🎍','🌾','🍃','🌲','🌳','🪷','🌼','🪻','🍂','🫛','🍅','🥦','🌴','🎄']

const PIECES = ['Salon', 'Chambre', 'Cuisine', 'Bureau', 'Jardin', 'Salle de bain', 'Terrasse']

const ASTUCES = [
  { emoji: '☀️', texte: "Lumière vive indirecte plutôt que soleil direct en été — la plupart des plantes vertes le préfèrent." },
  { emoji: '💧', texte: "Arroser abondamment et peu souvent vaut mieux que peu et souvent. Laisse le sol sécher entre deux arrosages." },
  { emoji: '🌡️', texte: "Évite de poser tes plantes près d'un radiateur ou d'une fenêtre froide. Elles détestent les chocs thermiques." },
  { emoji: '🪴', texte: "En hiver, la plupart des plantes ralentissent. Réduis la fréquence d'arrosage de moitié environ." },
  { emoji: '🌱', texte: "Le bout des feuilles qui brunit ? C'est souvent un manque d'humidité dans l'air, pas d'eau dans le sol." },
  { emoji: '🌿', texte: "Essuie les grandes feuilles avec un chiffon humide — ça aide la photosynthèse et fait briller la plante." },
  { emoji: '💡', texte: "Une plante qui penche vers la lumière : tourne son pot d'un quart de tour chaque semaine pour une croissance droite." },
  { emoji: '🧴', texte: "Fertilise uniquement en période de croissance (printemps/été), jamais en automne ou en hiver." },
  { emoji: '🫧', texte: "L'eau du robinet froide peut choquer les racines. Laisse-la reposer à température ambiante avant d'arroser." },
  { emoji: '🌸', texte: "Supprime les fleurs fanées : ça encourage la plante à refleurir plutôt qu'à produire des graines." },
  { emoji: '🪱', texte: "Un terreau qui ne draine pas bien asphyxie les racines. En rempotage, ajoute une couche de billes d'argile au fond." },
  { emoji: '🏺', texte: "Rempoter au printemps, jamais l'hiver. Les racines qui sortent par le trou de drainage signalent qu'il est temps." },
  { emoji: '🍃', texte: "Les feuilles jaunes : souvent trop d'eau. Les feuilles molles et sèches : manque d'eau. Apprends à lire ta plante." },
  { emoji: '🌊', texte: "Pour les succulentes et cactus, attend que la terre soit complètement sèche avant d'arroser — même en été." },
  { emoji: '🌬️', texte: "Une bonne aération de la pièce prévient les maladies fongiques. Évite les courants d'air directs cependant." },
  { emoji: '🕵️', texte: "Inspecte le dessous des feuilles régulièrement : les araignées rouges et cochenilles se cachent souvent là." },
  { emoji: '🧹', texte: "Nettoie régulièrement les soucoupes après l'arrosage. L'eau stagnante favorise les moisissures et les moucherons." },
  { emoji: '💚', texte: "Une nouvelle pousse qui émerge est le signe que ta plante est heureuse. Profites-en pour lui parler !" },
  { emoji: '🌺', texte: "Les orchidées n'aiment pas avoir les racines constamment humides. Trempe le pot 10 minutes puis laisse égoutter." },
  { emoji: '🎋', texte: "Le bambou et les pothos sont parmi les plantes les plus résistantes — parfaits pour commencer." },
  { emoji: '🌲', texte: "Les palmiers d'intérieur apprécient une douche de leurs feuilles (pas du sol) une fois par mois pour rester propres." },
]

const ANIMATION_CSS = `
  @keyframes arrose-pop {
    0%   { transform: scale(1); }
    40%  { transform: scale(1.18); }
    70%  { transform: scale(0.94); }
    100% { transform: scale(1); }
  }
  .arrose-pop { animation: arrose-pop 0.35s ease-out; }
`

const EMPTY_FORM = { nom: '', emoji: '🪴', piece: 'Salon', frequence_j: 7, note: '' }

export default function ArroseMoi({ profile, dark }) {
  const { bg, card, border, border2, textPri, textSec } = useThemeColors(dark)
  const { plantes, loading, addPlante, updatePlante, deletePlante } = usePlantes()
  const { waterings, lastWateredMap, urgenceMap, arroser, wateringInProgress, allProfiles } = useWaterings(plantes)

  const [tab, setTab] = useState('planning')
  const [modal, setModal] = useState(null) // null | 'add' | plante (pour edit)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [popSet, setPopSet] = useState(new Set())

  const inputBg = dark ? '#0f0a1e' : '#ffffff'
  const astuce = ASTUCES[new Date().getDate() % ASTUCES.length]

  if (!profile) return <div className="h-full flex items-center justify-center"><Spinner /></div>

  const openAdd = () => { setForm(EMPTY_FORM); setModal('add') }
  const openEdit = (plante) => {
    setForm({
      nom: plante.nom,
      emoji: plante.emoji,
      piece: plante.piece,
      frequence_j: plante.frequence_j,
      note: plante.note || '',
    })
    setModal(plante)
  }
  const closeModal = () => { setModal(null); setForm(EMPTY_FORM) }

  const isEditing = modal && modal !== 'add'

  const savePlante = async () => {
    if (!form.nom.trim() || form.frequence_j < 1) return
    setSaving(true)
    const payload = {
      nom: form.nom.trim(),
      emoji: form.emoji,
      piece: form.piece,
      frequence_j: form.frequence_j,
      note: form.note.trim() || null,
    }
    if (modal === 'add') {
      await addPlante({ ...payload, added_by: profile.id })
    } else {
      await updatePlante(modal.id, payload)
    }
    setSaving(false)
    closeModal()
  }

  const handleDelete = async () => {
    if (!isEditing) return
    await deletePlante(modal.id)
    closeModal()
  }

  const handlePop = (planteId) => {
    setPopSet(prev => new Set([...prev, planteId]))
    setTimeout(() => {
      setPopSet(prev => { const s = new Set(prev); s.delete(planteId); return s })
    }, 400)
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16" style={{ background: bg }}>
        <Spinner color={COLOR} />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col" style={{ background: bg }}>
      <style>{ANIMATION_CSS}</style>

      <div className="flex-1 overflow-y-auto">
        {tab === 'planning' && (
          <PlanningScreen
            plantes={plantes}
            urgenceMap={urgenceMap}
            lastWateredMap={lastWateredMap}
            wateringInProgress={wateringInProgress}
            arroser={arroser}
            profile={profile}
            onGoToPlantes={() => setTab('plantes')}
            astuce={astuce}
            popSet={popSet}
            onPop={handlePop}
            textPri={textPri}
            textSec={textSec}
            card={card}
            border={border}
            dark={dark}
          />
        )}
        {tab === 'plantes' && (
          <PlantesScreen
            plantes={plantes}
            onEdit={openEdit}
            onAdd={openAdd}
            textPri={textPri}
            textSec={textSec}
            card={card}
            border={border}
          />
        )}
        {tab === 'historique' && (
          <HistoriqueScreen
            waterings={waterings}
            plantes={plantes}
            allProfiles={allProfiles}
            textPri={textPri}
            textSec={textSec}
            card={card}
            border={border}
          />
        )}
      </div>

      <TabBar tabs={TABS} active={tab} onChange={setTab} color={COLOR} dark={dark} />

      {/* Modal ajout / édition plante */}
      <BottomModal open={!!modal} onClose={closeModal} cardBg={card} maxHeight="90vh">
        <div className="p-5 pb-8">
          <p className="font-bold text-base mb-4" style={{ color: textPri }}>
            {isEditing ? '✏️ Modifier la plante' : '🌱 Nouvelle plante'}
          </p>

          {/* Sélecteur emoji */}
          <p className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: textSec }}>Emoji</p>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {EMOJIS_PLANTES.map(e => (
              <button
                key={e}
                onClick={() => setForm(f => ({ ...f, emoji: e }))}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all active:scale-90"
                style={{
                  background: form.emoji === e ? (dark ? '#052e16' : '#dcfce7') : (dark ? '#1f2937' : '#f3f4f6'),
                  border: `1.5px solid ${form.emoji === e ? COLOR : 'transparent'}`,
                }}>
                {e}
              </button>
            ))}
          </div>

          {/* Nom */}
          <p className="text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: textSec }}>Nom</p>
          <input
            value={form.nom}
            onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
            placeholder="Ex. Monstera, Cactus…"
            className="w-full px-4 py-3 rounded-xl text-sm mb-4 focus:outline-none"
            style={{ background: inputBg, border: `1px solid ${border2}`, color: textPri }}
          />

          {/* Pièce */}
          <p className="text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: textSec }}>Pièce</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {PIECES.map(p => (
              <button
                key={p}
                onClick={() => setForm(f => ({ ...f, piece: p }))}
                className="px-3 py-1.5 rounded-full text-sm transition-all active:scale-95"
                style={{
                  background: form.piece === p ? COLOR : (dark ? '#1f2937' : '#f3f4f6'),
                  color: form.piece === p ? '#fff' : textSec,
                  border: `1px solid ${form.piece === p ? COLOR : 'transparent'}`,
                }}>
                {p}
              </button>
            ))}
          </div>

          {/* Fréquence */}
          <p className="text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: textSec }}>Fréquence</p>
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => setForm(f => ({ ...f, frequence_j: Math.max(1, f.frequence_j - 1) }))}
              className="w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold active:scale-90 transition-transform"
              style={{ background: dark ? '#1f2937' : '#f3f4f6', color: textPri }}>
              −
            </button>
            <p className="flex-1 text-center text-sm font-semibold" style={{ color: textPri }}>
              {form.frequence_j === 1 ? 'Tous les jours' : `Tous les ${form.frequence_j} jours`}
            </p>
            <button
              onClick={() => setForm(f => ({ ...f, frequence_j: Math.min(60, f.frequence_j + 1) }))}
              className="w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold active:scale-90 transition-transform"
              style={{ background: dark ? '#1f2937' : '#f3f4f6', color: textPri }}>
              +
            </button>
          </div>

          {/* Note */}
          <p className="text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: textSec }}>Note (optionnel)</p>
          <textarea
            value={form.note}
            onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
            placeholder="Infos particulières sur cette plante…"
            rows={2}
            className="w-full px-4 py-3 rounded-xl text-sm mb-4 focus:outline-none resize-none"
            style={{ background: inputBg, border: `1px solid ${border2}`, color: textPri }}
          />

          {/* Bouton sauvegarder */}
          <button
            onClick={savePlante}
            disabled={!form.nom.trim() || form.frequence_j < 1 || saving}
            className="w-full py-3.5 rounded-full text-white font-semibold disabled:opacity-30 active:scale-95 transition-transform"
            style={{ background: COLOR }}>
            {saving ? 'Sauvegarde…' : isEditing ? 'Modifier' : 'Ajouter'}
          </button>

          {/* Bouton supprimer (mode édition) */}
          {isEditing && (
            <button
              onClick={handleDelete}
              className="w-full mt-3 py-3 rounded-full text-sm font-semibold active:scale-95 transition-transform"
              style={{ color: '#ef4444', background: dark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.25)' }}>
              Supprimer cette plante
            </button>
          )}
        </div>
      </BottomModal>
    </div>
  )
}
