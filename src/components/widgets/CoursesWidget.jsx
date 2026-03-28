import { useState, useEffect } from 'react'
import { supabase } from '../../supabase'
import { getStartOfWeekKey } from '../../utils/dateUtils'

export default function CoursesWidget({ profileId, onClick }) {
  const [hasItems, setHasItems] = useState(false)

  useEffect(() => {
    if (!profileId) return
    const week = getStartOfWeekKey()
    supabase.from('meal_plan')
      .select('meals').eq('profile_id', profileId).eq('week_start', week).maybeSingle()
      .then(({ data }) => {
        setHasItems(!!(data?.meals?.some(({ recipe }) => recipe?.ingredients?.length > 0)))
      })
  }, [profileId])

  return (
    <button onClick={onClick}
      className="flex items-center justify-center rounded-2xl active:scale-95 transition-all relative flex-shrink-0"
      style={{ width:48, alignSelf:'stretch',
               background:'#fef9c3', border:'0.5px solid #fde68a',
               boxShadow:'2px 2px 0 #fde047' }}>
      <span className="text-[22px]">🛒</span>
      {hasItems && (
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-orange-400"
          style={{ border:'1.5px solid #f5f0ff' }} />
      )}
    </button>
  )
}
