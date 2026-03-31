import { useState, useEffect } from 'react'
import { supabase } from '../../supabase'

export default function TraineWidget({ profile, onClick, dark }) {
  const [priorityTasks, setPriorityTasks] = useState(null)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    if (!profile) return
    supabase.from('traine_tasks').select('*').eq('done', false)
      .then(({ data }) => {
        if (!data) { setPriorityTasks([]); return }
        setTotalCount(data.length)
        const parsed = data.map(t => ({
          ...t,
          priority_by: typeof t.priority_by === 'string' ? JSON.parse(t.priority_by || '[]') : (t.priority_by || [])
        }))
        // Trier par nombre de flammes (décroissant), puis par date (plus ancienne en premier)
        const sortedTasks = parsed
          .sort((a, b) => {
            // 1. Trier par nombre de flammes (décroissant)
            const flameDiff = b.priority_by.length - a.priority_by.length
            if (flameDiff !== 0) return flameDiff
            
            // 2. En cas d'égalité de flammes, trier par date (plus ancienne en premier)
            return new Date(a.created_at) - new Date(b.created_at)
          })
        
        setPriorityTasks(sortedTasks)
      })
  }, [profile])

  const loaded  = priorityTasks !== null
  const hasPrio = loaded && priorityTasks.length > 0
  const allGood = loaded && totalCount === 0

  return (
    <button onClick={onClick}
      className="w-full rounded-2xl p-4 text-left active:scale-95 transition-all"
      style={{
        background: dark ? '#1a1035' : '#fff',
        borderTop: `0.5px solid ${dark ? '#2d1f5e' : '#ede9fe'}`,
        borderRight: `0.5px solid ${dark ? '#2d1f5e' : '#ede9fe'}`,
        borderBottom: `0.5px solid ${dark ? '#2d1f5e' : '#ede9fe'}`,
        borderLeft: '3px solid #10b981',
      }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🐌</span>
          <span className="text-sm font-semibold" style={{ color: dark ? '#e9d5ff' : '#1e0a3c' }}>Ça Traîne</span>
        </div>
        {loaded && totalCount > 0 && (
          <span className="text-[10px] px-2 py-0.5 rounded-full"
            style={{ background: dark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.1)', color: '#10b981' }}>
            {totalCount} tâche{totalCount > 1 ? 's' : ''} en attente
          </span>
        )}
      </div>

      {!loaded ? (
        <p className="text-xs" style={{ color: dark ? '#c4b5fd' : '#9ca3af' }}>Chargement…</p>
      ) : allGood ? (
        <p className="text-sm font-semibold" style={{ color: '#22c55e' }}>Rien ne traîne ✓</p>
      ) : !hasPrio ? (
        <p className="text-xs" style={{ color: dark ? '#7c6fad' : '#9ca3af' }}>
          Aucune tâche prioritaire — {totalCount} en attente
        </p>
      ) : (
        <div className="space-y-2">
          {priorityTasks.slice(0, 3).map(t => {
            const flameCount = t.priority_by.length
            const bgColor = flameCount === 2 
              ? (dark ? '#064e3b' : '#fef5e6')  // Orange avec un peu plus de rouge/intensité pour 2 flammes
              : flameCount === 1 
              ? (dark ? '#052e16' : '#fffbf4')  // Orange doux pour 1 flamme  
              : (dark ? '#1a1035' : '#fff')     // Blanc pour 0 flamme
            
            return (
            <div key={t.id} 
              className="rounded-xl p-3 flex items-center justify-between transition-all"
              style={{ background: bgColor }}>
              <div className="min-w-0 flex-1 pr-3">
                <p className="text-sm font-medium leading-tight"
                  style={{ color: dark ? '#e9d5ff' : '#1e0a3c' }}>
                  {t.emoji ? `${t.emoji} ` : ''}{t.title}
                </p>
                {t.note && (
                  <p className="text-[11px] mt-0.5 leading-tight line-clamp-1"
                    style={{ color: dark ? '#7c6fad' : '#9ca3af' }}>
                    {t.note}
                  </p>
                )}
              </div>
              <span className="text-[10px] flex-shrink-0 font-bold" style={{ color: flameCount > 0 ? '#10b981' : (dark ? '#7c6fad' : '#9ca3af') }}>
                {flameCount === 2 ? '🔥🔥' : flameCount === 1 ? '🔥' : ''}
              </span>
            </div>
            )})}
          {priorityTasks.length > 3 && (
            <p className="text-[11px] pl-4.5" style={{ color: dark ? '#7c6fad' : '#a78bfa' }}>
              + {priorityTasks.length - 3} autre{priorityTasks.length - 3 > 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}
    </button>
  )
}
