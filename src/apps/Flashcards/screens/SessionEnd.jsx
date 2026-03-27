import { useState, useEffect } from 'react'
import { supabase } from '../../../supabase'
import { THEME_COLOR, THEMES } from '../constants'

const MASTERED_LEVEL = 4

export default function SessionEnd({ deck, stats, onBack, onRestart, profile }) {
  const [deckProgress, setDeckProgress] = useState([])
  const [loadingProgress, setLoadingProgress] = useState(true)

  const total  = stats.easy + stats.medium + stats.hard
  const skipped = stats.skipped || 0
  const color  = THEME_COLOR[deck?.theme] || '#6A9BCC'
  const theme  = THEMES.find(t => t.id === deck?.theme)

  const pctEasy   = total ? Math.round((stats.easy   / total) * 100) : 0
  const pctMedium = total ? Math.round((stats.medium / total) * 100) : 0
  const pctHard   = total ? Math.round((stats.hard   / total) * 100) : 0

  const emoji   = pctEasy >= 70 ? '🎉' : pctEasy >= 40 ? '💪' : '🐒'
  const message = pctEasy >= 70 ? 'Excellent travail !' : pctEasy >= 40 ? 'Bonne session !' : 'Continue comme ça !'

  // Charger la progression complète du deck
  useEffect(() => {
    if (!deck || !profile) return
    loadDeckProgress()
  }, [deck, profile])

  const loadDeckProgress = async () => {
    setLoadingProgress(true)

    const [{ data: criteria }, { data: cards }] = await Promise.all([
      supabase.from('deck_criteria').select('id, name, type, interrogeable').eq('deck_id', deck.id).order('position'),
      supabase.from('cards').select('id').eq('deck_id', deck.id),
    ])

    const activeCriteria = (criteria || []).filter(c => c.interrogeable !== false && c.name !== 'verso')
    const cardIds = (cards || []).map(c => c.id)

    if (!cardIds.length || !activeCriteria.length) { setLoadingProgress(false); return }

    const { data: progress } = await supabase
      .from('card_progress')
      .select('card_id, criterion_id, level, next_review')
      .eq('profile_id', profile.id)
      .in('card_id', cardIds)

    const progMap = {}
    for (const p of (progress || [])) {
      progMap[`${p.card_id}|${p.criterion_id}`] = p
    }

    const now = new Date()
    const stats = activeCriteria.map(crit => {
      let seen = 0, mastered = 0, due = 0
      for (const cardId of cardIds) {
        const prog = progMap[`${cardId}|${crit.id}`]
        if (prog) {
          seen++
          if (prog.level >= MASTERED_LEVEL) mastered++
          if (new Date(prog.next_review) <= now) due++
        } else {
          due++ // jamais vu = due
        }
      }
      return {
        id: crit.id,
        name: crit.name,
        type: crit.type,
        total: cardIds.length,
        seen,
        mastered,
        due,
        pct: cardIds.length > 0 ? Math.round((mastered / cardIds.length) * 100) : 0,
        seenPct: cardIds.length > 0 ? Math.round((seen / cardIds.length) * 100) : 0,
      }
    })

    setDeckProgress(stats)
    setLoadingProgress(false)
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-y-auto">

      {/* Hero */}
      <div className="flex flex-col items-center justify-center px-6 pt-10 pb-5">
        <div className="text-5xl mb-3">{emoji}</div>
        <p className="text-xl font-bold text-gray-900 mb-1">{message}</p>
        <p className="text-sm text-gray-400">
          {theme?.emoji} {deck?.name} · {total} carte{total > 1 ? 's' : ''} révisée{total > 1 ? 's' : ''}
        </p>
      </div>

      {/* Stats session */}
      <div className="mx-4 grid grid-cols-3 gap-3 mb-4">
        <StatBox value={stats.easy}   label="Facile"    color="#27500A" bg="#EAF3DE" emoji="😎" />
        <StatBox value={stats.medium} label="Moyen"     color="#633806" bg="#FAEEDA" emoji="🤔" />
        <StatBox value={stats.hard}   label="Difficile" color="#791F1F" bg="#FCEBEB" emoji="😅" />
      </div>

      {/* Barre de répartition session */}
      {total > 0 && (
        <div className="mx-4 mb-5">
          <div className="flex h-2.5 rounded-full overflow-hidden gap-0.5">
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

      {/* Progression du deck */}
      <div className="mx-4 mb-5">
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50">
            <p className="text-sm font-semibold text-gray-800">Progression du deck</p>
          </div>

          {loadingProgress ? (
            <div className="p-4 text-center text-gray-400 text-sm">Chargement…</div>
          ) : (
            <div className="px-4 py-3 space-y-3">
              {deckProgress.map(crit => (
                <div key={crit.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500 capitalize">
                      {crit.type === 'image' ? '🖼️' : '📝'} {crit.name}
                    </span>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span>{crit.seen}/{crit.total} vues</span>
                      {crit.due > 0 && (
                        <span className="px-1.5 py-0.5 rounded-md font-medium"
                          style={{ background: '#E6F1FB', color: '#185FA5' }}>
                          {crit.due} dues
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Barre double : vues (gris) + maîtrisées (couleur) */}
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden relative">
                    {/* Vues */}
                    <div className="absolute top-0 left-0 h-full rounded-full"
                      style={{ width: `${crit.seenPct}%`, background: color + '40' }} />
                    {/* Maîtrisées */}
                    <div className="absolute top-0 left-0 h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${crit.pct}%`,
                        background: crit.pct >= 80 ? '#639922' : crit.pct >= 40 ? color : color + '99',
                      }} />
                  </div>

                  <div className="flex justify-between mt-0.5">
                    <span className="text-xs text-gray-300">{crit.seenPct}% vues</span>
                    <span className="text-xs font-medium"
                      style={{ color: crit.pct >= 40 ? color : '#d1d5db' }}>
                      {crit.pct}% maîtrisées
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="mx-4 space-y-3 pb-8">
        <button onClick={onRestart}
          className="w-full py-4 rounded-2xl text-white text-sm font-semibold active:scale-95 transition-transform"
          style={{ background: color }}>
          Continuer à réviser →
        </button>
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