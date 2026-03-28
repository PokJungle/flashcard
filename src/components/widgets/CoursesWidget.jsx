import { useState, useEffect } from 'react'
import { supabase } from '../../supabase'
import { getStartOfWeekKey } from '../../utils/dateUtils'

export default function CoursesWidget({ profileId, onClick, dark }) {
  const [count, setCount] = useState(null)

  useEffect(() => {
    if (!profileId) return
    const week = getStartOfWeekKey()
    supabase.from('meal_plan')
      .select('meals').eq('profile_id', profileId).eq('week_start', week).maybeSingle()
      .then(({ data }) => {
        if (!data?.meals) { setCount(0); return }
        const seen = new Set()
        data.meals.forEach(({ recipe }) => {
          recipe?.ingredients?.forEach(ing => {
            const key = ing.name?.toLowerCase().trim()
            if (key) seen.add(key)
          })
        })
        setCount(seen.size)
      })
  }, [profileId])

  const loaded = count !== null

  return (
    <button onClick={onClick}
      className="w-full rounded-xl px-3.5 py-2.5 text-left active:scale-95 transition-all flex items-center gap-3"
      style={{
        background: '#fef9c3',
        border: '0.5px solid #fde68a',
        borderLeft: '3px solid #f59e0b',
        boxShadow: '2px 2px 0 #fde047',
      }}>
      <span className="text-xl flex-shrink-0">🛒</span>
      <div className="min-w-0 flex-1">
        {!loaded ? (
          <p className="text-xs text-amber-700">…</p>
        ) : count === 0 ? (
          <p className="text-xs font-semibold text-amber-600">Rien à acheter cette semaine</p>
        ) : (
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold leading-none text-amber-800">{count}</span>
            <span className="text-[11px] text-amber-600">ingrédient{count > 1 ? 's' : ''} cette semaine</span>
          </div>
        )}
      </div>
    </button>
  )
}
