import { THEME_COLOR, THEMES } from '../constants'

export default function SessionEnd({ deck, stats, onBack, onRestart }) {
  const total  = stats.easy + stats.medium + stats.hard
  const color  = THEME_COLOR[deck?.theme] || '#6A9BCC'
  const theme  = THEMES.find(t => t.id === deck?.theme)

  const pctEasy   = total ? Math.round((stats.easy   / total) * 100) : 0
  const pctMedium = total ? Math.round((stats.medium / total) * 100) : 0
  const pctHard   = total ? Math.round((stats.hard   / total) * 100) : 0

  const emoji = pctEasy >= 70 ? '🎉' : pctEasy >= 40 ? '💪' : '🐒'
  const message = pctEasy >= 70
    ? 'Excellent travail !'
    : pctEasy >= 40
    ? 'Bonne session !'
    : 'Continue comme ça !'

  return (
    <div className="flex flex-col h-full bg-gray-50">

      {/* Hero */}
      <div className="flex flex-col items-center justify-center px-6 pt-10 pb-6">
        <div className="text-5xl mb-3">{emoji}</div>
        <p className="text-xl font-bold text-gray-900 mb-1">{message}</p>
        <p className="text-sm text-gray-400">
          {theme?.emoji} {deck?.name} · {total} carte{total > 1 ? 's' : ''}
        </p>
      </div>

      {/* Stats */}
      <div className="mx-4 grid grid-cols-3 gap-3 mb-4">
        <StatBox value={stats.easy}   label="Facile"   color="#27500A" bg="#EAF3DE" emoji="😎" />
        <StatBox value={stats.medium} label="Moyen"    color="#633806" bg="#FAEEDA" emoji="🤔" />
        <StatBox value={stats.hard}   label="Difficile" color="#791F1F" bg="#FCEBEB" emoji="😅" />
      </div>

      {/* Barre de répartition */}
      {total > 0 && (
        <div className="mx-4 mb-6">
          <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
            {pctEasy   > 0 && <div style={{ width: `${pctEasy}%`,   background: '#639922' }} />}
            {pctMedium > 0 && <div style={{ width: `${pctMedium}%`, background: '#BA7517' }} />}
            {pctHard   > 0 && <div style={{ width: `${pctHard}%`,   background: '#E24B4A' }} />}
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-400">{pctEasy}% facile</span>
            <span className="text-xs text-gray-400">{pctHard}% difficile</span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mx-4 space-y-3 mt-auto pb-8">
        {stats.hard > 0 && (
          <button onClick={onRestart}
            className="w-full py-4 rounded-2xl text-white text-sm font-semibold active:scale-95 transition-transform"
            style={{ background: color }}>
            Réviser les {stats.hard} difficile{stats.hard > 1 ? 's' : ''} →
          </button>
        )}
        <button onClick={onBack}
          className="w-full py-4 bg-white border border-gray-200 rounded-2xl text-gray-900 text-sm font-semibold active:scale-95 transition-transform">
          Retour à l'accueil
        </button>
      </div>
    </div>
  )
}

function StatBox({ value, label, color, bg, emoji }) {
  return (
    <div className="rounded-2xl p-3 text-center" style={{ background: bg }}>
      <p className="text-2xl font-bold mb-0.5" style={{ color }}>{value}</p>
      <p className="text-xs" style={{ color }}>{emoji} {label}</p>
    </div>
  )
}