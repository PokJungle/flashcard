import { useState, useEffect } from 'react'
import { supabase } from '../../supabase'

export default function TraineWidget({ profile, onClick, dark }) {
  const [tasks, setTasks] = useState(null)
  const [priorityCount, setPriorityCount] = useState(0)

  useEffect(() => {
    if (!profile) return
    supabase.from('traine_tasks').select('*').eq('done', false)
      .then(({ data }) => {
        if (!data) { setTasks(0); return }
        setTasks(data.length)
        const prio = data.filter(t => {
          try { return JSON.parse(t.priority_by || '[]').includes(profile.id) }
          catch { return false }
        })
        setPriorityCount(prio.length)
      })
  }, [profile])

  const loaded = tasks !== null
  const allGood = loaded && tasks === 0

  return (
    <button onClick={onClick}
      className="rounded-2xl p-3.5 text-left active:scale-95 transition-all flex-1 flex flex-col justify-between"
      style={{
        background: dark ? '#1a1035' : '#fff',
        border: `0.5px solid ${dark ? '#2d1f5e' : '#ede9fe'}`,
        borderLeft: '3px solid #10b981',
        minHeight: 80,
      }}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xl">🐌</span>
        {loaded && priorityCount > 0 && (
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
            style={{ background: '#10b98122', color: '#10b981' }}>
            {priorityCount} prio
          </span>
        )}
      </div>
      {!loaded ? (
        <p className="text-[11px]" style={{ color: dark ? '#c4b5fd' : '#9ca3af' }}>…</p>
      ) : allGood ? (
        <p className="text-xs font-semibold" style={{ color: '#22c55e' }}>Rien ne traîne ✓</p>
      ) : (
        <div>
          <span className="text-2xl font-bold leading-none" style={{ color: dark ? '#e9d5ff' : '#1e0a3c' }}>
            {tasks}
          </span>
          <p className="text-[10px] mt-0.5" style={{ color: dark ? '#7c6fad' : '#6b7280' }}>
            tâche{tasks > 1 ? 's' : ''}
          </p>
        </div>
      )}
    </button>
  )
}
