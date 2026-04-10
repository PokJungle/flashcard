const URGENCE_COLOR = { ok: '#22c55e', bientot: '#f59e0b', retard: '#ef4444' }
const URGENCE_BG    = { ok: 'rgba(34,197,94,0.12)', bientot: 'rgba(245,158,11,0.12)', retard: 'rgba(239,68,68,0.12)' }

function joursDepuisStr(lastDate) {
  if (!lastDate) return null
  return Math.floor((Date.now() - lastDate.getTime()) / 86_400_000)
}

export default function PlanningScreen({
  plantes,
  urgenceMap,
  lastWateredMap,
  wateringInProgress,
  arroser,
  profile,
  onGoToPlantes,
  astuce,
  saison,
  popSet,
  onPop,
  textPri,
  textSec,
  dark,
}) {
  if (plantes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <div className="text-6xl mb-4">🪴</div>
        <p className="font-semibold text-base mb-2" style={{ color: textPri }}>Aucune plante pour l'instant</p>
        <p className="text-sm mb-6" style={{ color: textSec }}>Ajoute ta première plante pour commencer le suivi d'arrosage.</p>
        <button
          onClick={onGoToPlantes}
          className="px-6 py-3 rounded-full text-white font-semibold active:scale-95 transition-transform"
          style={{ background: '#22c55e' }}>
          🌿 Voir mes plantes
        </button>
      </div>
    )
  }

  const groupes = [
    { key: 'retard', label: '🔴 En retard', plantes: [] },
    { key: 'bientot', label: '🟡 Bientôt', plantes: [] },
    { key: 'ok', label: '🟢 C\'est bon', plantes: [] },
  ]

  for (const p of plantes) {
    const u = urgenceMap[p.id] || 'ok'
    groupes.find(g => g.key === u).plantes.push(p)
  }

  // Tri dans chaque groupe : les plus en retard d'abord (ratio décroissant)
  const now = new Date()
  for (const g of groupes) {
    g.plantes.sort((a, b) => {
      const lastA = lastWateredMap[a.id]
      const lastB = lastWateredMap[b.id]
      if (!lastA && !lastB) return 0
      if (!lastA) return -1
      if (!lastB) return 1
      const ratioA = (now - lastA) / 86_400_000 / a.frequence_j
      const ratioB = (now - lastB) / 86_400_000 / b.frequence_j
      return ratioB - ratioA
    })
  }

  // Couleurs du bandeau saisonnier
  const saisonStyle = saison?.coeff === 0.75
    ? { bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.35)', text: '#d97706' }
    : { bg: 'rgba(147,197,253,0.12)', border: 'rgba(147,197,253,0.35)', text: '#3b82f6' }

  return (
    <div className="px-4 py-4 max-w-lg mx-auto space-y-6">

      {/* Bandeau saisonnier — affiché uniquement si coeff ≠ 1 */}
      {saison?.icon && (
        <div className="rounded-2xl px-4 py-3 flex items-start gap-3"
          style={{ background: saisonStyle.bg, border: `1px solid ${saisonStyle.border}` }}>
          <span className="text-xl flex-shrink-0 mt-0.5">{saison.icon}</span>
          <p className="text-xs leading-relaxed" style={{ color: saisonStyle.text }}>{saison.message}</p>
        </div>
      )}

      {groupes.map(g => {
        if (g.plantes.length === 0) return null
        return (
          <div key={g.key}>
            <p className="mb-2 uppercase tracking-widest"
              style={{ fontSize: 11, color: URGENCE_COLOR[g.key] }}>
              {g.label} ({g.plantes.length})
            </p>
            <div className="space-y-2">
              {g.plantes.map(plante => {
                const last = lastWateredMap[plante.id]
                const jours = joursDepuisStr(last)
                const inProgress = wateringInProgress.has(plante.id)
                const urgence = urgenceMap[plante.id] || 'ok'
                const isOk = urgence === 'ok'
                const isPopping = popSet.has(plante.id)

                return (
                  <div key={plante.id}
                    className="rounded-2xl p-4 flex items-center gap-3"
                    style={{
                      background: URGENCE_BG[urgence],
                      borderLeft: `4px solid ${URGENCE_COLOR[urgence]}`,
                      border: `0.5px solid ${URGENCE_COLOR[urgence]}40`,
                      borderLeftWidth: 4,
                      borderLeftColor: URGENCE_COLOR[urgence],
                      borderLeftStyle: 'solid',
                    }}>
                    {/* Infos plante */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-2xl">{plante.emoji}</span>
                        <p className="font-bold text-sm" style={{ color: textPri }}>{plante.nom}</p>
                      </div>
                      <p style={{ fontSize: 11, color: textSec }}>{plante.piece}</p>
                      <p className="italic mt-0.5" style={{ fontSize: 11, color: textSec }}>
                        {jours === null
                          ? 'Jamais arrosée'
                          : jours === 0
                            ? 'Arrosée aujourd\'hui'
                            : `Arrosée il y a ${jours} jour${jours > 1 ? 's' : ''}`}
                      </p>
                    </div>

                    {/* Bouton arroser */}
                    <button
                      disabled={inProgress}
                      onClick={() => {
                        if (inProgress) return
                        onPop(plante.id)
                        arroser(plante.id, profile.id)
                      }}
                      className={`flex-shrink-0 px-3 py-2 rounded-xl text-sm font-medium active:scale-95 transition-transform${isPopping ? ' arrose-pop' : ''}`}
                      style={
                        inProgress
                          ? { background: '#22c55e22', color: '#22c55e', border: '1px solid #22c55e40' }
                          : isOk
                            ? { background: 'transparent', color: '#22c55e', border: '1px solid rgba(34,197,94,0.4)' }
                            : { background: '#22c55e', color: '#fff', fontWeight: 600 }
                      }>
                      {inProgress ? '✓' : '💧 Arrosé !'}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Astuce du jour */}
      {astuce && (
        <div className="rounded-2xl p-4"
          style={{ background: dark ? 'rgba(34,197,94,0.08)' : 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.2)' }}>
          <p className="text-xs font-semibold mb-1" style={{ color: '#22c55e' }}>
            {astuce.emoji} Astuce du jour
          </p>
          <p className="text-xs leading-relaxed" style={{ color: textSec }}>{astuce.texte}</p>
        </div>
      )}
    </div>
  )
}
