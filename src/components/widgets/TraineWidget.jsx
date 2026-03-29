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
        const prio = parsed.filter(t => t.priority_by.includes(profile.id))
        prio.sort((a, b) => b.priority_by.length - a.priority_by.length)
        setPriorityTasks(prio)
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
        border: `0.5px solid ${dark ? '#2d1f5e' : '#ede9fe'}`,
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
          {priorityTasks.slice(0, 4).map(t => (
            <div key={t.id} className="flex items-start gap-2.5">
              <span className="text-[10px] mt-0.5 flex-shrink-0 font-bold" style={{ color: '#10b981' }}>▶</span>
              <div className="min-w-0">
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
            </div>
          ))}
          {priorityTasks.length > 4 && (
            <p className="text-[11px] pl-4.5" style={{ color: dark ? '#7c6fad' : '#a78bfa' }}>
              + {priorityTasks.length - 4} autre{priorityTasks.length - 4 > 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}
    </button>
  )
}
