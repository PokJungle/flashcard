import { timeAgo } from '../../../utils/dateUtils'

export default function HistoriqueScreen({
  waterings,
  plantes,
  allProfiles,
  textPri,
  textSec,
  card,
  border,
}) {
  const planteMap = {}
  for (const p of plantes) planteMap[p.id] = p

  const profileMap = {}
  for (const p of allProfiles) profileMap[p.id] = p

  const recent = waterings.slice(0, 20)

  if (recent.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <div className="text-6xl mb-4">💧</div>
        <p className="font-semibold text-base mb-2" style={{ color: textPri }}>Aucun arrosage enregistré</p>
        <p className="text-sm" style={{ color: textSec }}>Les arrosages apparaîtront ici au fur et à mesure.</p>
      </div>
    )
  }

  return (
    <div className="px-4 py-4 max-w-lg mx-auto">
      <div className="space-y-2">
        {recent.map(w => {
          const plante = planteMap[w.plante_id]
          const profil = profileMap[w.arrose_par]

          return (
            <div key={w.id}
              className="rounded-2xl p-4 flex items-center gap-3"
              style={{ background: card, border: `0.5px solid ${border}` }}>
              <span className="text-2xl flex-shrink-0">{plante?.emoji ?? '🪴'}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm" style={{ color: textPri }}>
                  {plante?.nom ?? 'Plante supprimée'}
                </p>
                <p className="text-xs mt-0.5" style={{ color: textSec }}>
                  arrosée par {profil ? `${profil.avatar} ${profil.name}` : w.arrose_par}
                </p>
              </div>
              <p className="text-xs flex-shrink-0" style={{ color: textSec }}>
                {timeAgo(w.arrose_le)}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
