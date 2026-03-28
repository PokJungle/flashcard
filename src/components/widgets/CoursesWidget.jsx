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
      className="rounded-2xl p-3.5 text-left active:scale-95 transition-all flex-1 flex flex-col justify-between"
      style={{
        background: '#fef9c3',
        border: '0.5px solid #fde68a',
        borderLeft: '3px solid #f59e0b',
        boxShadow: '2px 2px 0 #fde047',
        minHeight: 80,
      }}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xl">🛒</span>
        {loaded && count > 0 && (
          <span className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" />
        )}
      </div>
      {!loaded ? (
        <p className="text-[11px] text-amber-700">…</p>
      ) : count === 0 ? (
        <p className="text-xs font-semibold text-amber-600">Rien à acheter</p>
      ) : (
        <div>
          <span className="text-2xl font-bold leading-none text-amber-800">{count}</span>
          <p className="text-[10px] mt-0.5 text-amber-600">
            ingrédient{count > 1 ? 's' : ''}
          </p>
        </div>
      )}
    </button>
  )
}
