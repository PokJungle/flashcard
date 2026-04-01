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
      className="flex-1 rounded-xl px-3 py-2.5 text-left active:scale-95 transition-all flex items-center gap-2"
      style={{
        background: dark ? '#1a1035' : '#fef9c3',
        borderTop: `0.5px solid ${dark ? '#4338ca' : '#fde68a'}`,
        borderRight: `0.5px solid ${dark ? '#4338ca' : '#fde68a'}`,
        borderBottom: `0.5px solid ${dark ? '#4338ca' : '#fde68a'}`,
        borderLeft: `3px solid ${dark ? '#7c3aed' : '#f59e0b'}`,
        boxShadow: dark ? '2px 2px 0 #4338ca' : '2px 2px 0 #fde047',
      }}>
      <span className="text-xl flex-shrink-0">🛒</span>
      <div className="min-w-0 flex-1">
        {!loaded ? (
          <p className="text-xs" style={{ color: dark ? '#a78bfa' : '#92400e' }}>…</p>
        ) : count === 0 ? (
          <p className="text-xs font-semibold" style={{ color: dark ? '#c4b5fd' : '#b45309' }}>Rien à acheter cette semaine</p>
        ) : (
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold leading-none" style={{ color: dark ? '#e9d5ff' : '#92400e' }}>{count}</span>
            <span className="text-[11px]" style={{ color: dark ? '#a78bfa' : '#b45309' }}>ingrédient{count > 1 ? 's' : ''} cette semaine</span>
          </div>
        )}
      </div>
    </button>
  )
}
