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
        const prio = data.filter(t => {
          try { return (typeof t.priority_by === 'string' ? JSON.parse(t.priority_by) : (t.priority_by || [])).includes(profile.id) }
          catch { return false }
        })
        // Tri : prioritaires par les deux d'abord, puis par moi seul
        prio.sort((a, b) => {
          const scoreA = typeof a.priority_by === 'string' ? JSON.parse(a.priority_by).length : (a.priority_by || []).length
          const scoreB = typeof b.priority_by === 'string' ? JSON.parse(b.priority_by).length : (b.priority_by || []).length
          return scoreB - scoreA
        })
        setPriorityTasks(prio)
      })
  }, [profile])

  const loaded    = priorityTasks !== null
  const hasPrio   = loaded && priorityTasks.length > 0
  const allGood   = loaded && totalCount === 0

  return (
    <button onClick={onClick}
      className="rounded-2xl p-3.5 text-left active:scale-95 transition-all flex-1 flex flex-col"
      style={{
        background: dark ? '#1a1035' : '#fff',
        border: `0.5px solid ${dark ? '#2d1f5e' : '#ede9fe'}`,
        borderLeft: '3px solid #10b981',
        minHeight: 80,
      }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-base">🐌 <span className="text-[11px] font-semibold" style={{ color: dark ? '#c4b5fd' : '#6b7280' }}>Ça Traîne</span></span>
        {loaded && totalCount > 0 && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full"
            style={{ background: dark ? '#1e293b' : '#f0fdf4', color: '#10b981' }}>
            {totalCount} tâche{totalCount > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {!loaded ? (
        <p className="text-[11px]" style={{ color: dark ? '#c4b5fd' : '#9ca3af' }}>…</p>
      ) : allGood ? (
        <p className="text-xs font-semibold" style={{ color: '#22c55e' }}>Rien ne traîne ✓</p>
      ) : !hasPrio ? (
        <p className="text-[11px]" style={{ color: dark ? '#7c6fad' : '#9ca3af' }}>
          Aucune tâche prioritaire
        </p>
      ) : (
        <div className="space-y-1 flex-1">
          {priorityTasks.slice(0, 3).map(t => (
            <div key={t.id} className="flex items-start gap-1.5">
              <span className="text-[10px] mt-0.5 flex-shrink-0" style={{ color: '#10b981' }}>▶</span>
              <p className="text-[11px] font-medium leading-tight line-clamp-1"
                style={{ color: dark ? '#e9d5ff' : '#1e0a3c' }}>
                {t.emoji ? `${t.emoji} ` : ''}{t.title}
              </p>
            </div>
          ))}
          {priorityTasks.length > 3 && (
            <p className="text-[10px] pl-3.5" style={{ color: dark ? '#7c6fad' : '#a78bfa' }}>
              + {priorityTasks.length - 3} autre{priorityTasks.length - 3 > 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}
    </button>
  )
}
