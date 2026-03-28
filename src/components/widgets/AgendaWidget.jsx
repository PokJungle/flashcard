import { useState, useEffect } from 'react'
import { supabase } from '../../supabase'
import { getNextOccurrence, daysUntil } from '../../apps/Programme/hooks/useProgramme'

export default function AgendaWidget({ onClick, dark }) {
  const [nextEvent, setNextEvent] = useState(null)
  const [loaded, setLoaded]       = useState(false)

  useEffect(() => {
    supabase.from('programme_events').select('*').order('event_date', { ascending:true })
      .then(({ data }) => {
        if (!data) { setLoaded(true); return }
        const today = new Date(); today.setHours(0,0,0,0)
        const future = data.filter(e => {
          if (e.is_annual) return true
          const [y,m,d] = e.event_date.split('-').map(Number)
          return new Date(y,m-1,d) >= today
        })
        future.sort((a,b) => getNextOccurrence(a) - getNextOccurrence(b))
        setNextEvent(future[0] || null)
        setLoaded(true)
      })
  }, [])

  if (!loaded || !nextEvent) return null

  const days      = daysUntil(nextEvent)
  const isToday   = days === 0
  const isTomorrow= days === 1
  const isUrgent  = days <= 3
  const dateObj   = getNextOccurrence(nextEvent)
  const day       = dateObj.getDate()
  const mon       = dateObj.toLocaleDateString('fr-FR', { month:'short' }).replace('.','')
  const weekDay   = dateObj.toLocaleDateString('fr-FR', { weekday:'long' })

  return (
    <button onClick={onClick}
      className="w-full rounded-2xl text-left active:scale-95 transition-all overflow-hidden"
      style={{
        background: isUrgent
          ? (dark ? 'rgba(251,191,36,0.08)' : 'rgba(251,191,36,0.06)')
          : (dark ? '#1a1035' : '#fff'),
        border: isUrgent
          ? `0.5px solid ${dark ? 'rgba(251,191,36,0.3)' : 'rgba(251,191,36,0.4)'}`
          : `0.5px solid ${dark ? '#2d1f5e' : '#ede9fe'}`,
        borderLeft: `3px solid ${isUrgent ? '#f59e0b' : '#8B5CF6'}`,
      }}>
      <div className="px-4 py-4 flex items-center gap-4">
        <div className="flex flex-col items-center justify-center w-12 h-12 rounded-xl flex-shrink-0"
          style={{
            background: isUrgent ? 'rgba(245,158,11,0.15)' : (dark ? '#312e81' : '#f5f0ff'),
            border: `0.5px solid ${isUrgent ? 'rgba(245,158,11,0.4)' : (dark ? '#4338ca' : '#e9d5ff')}`,
          }}>
          <span className="text-[18px] font-bold leading-none"
            style={{ color: isUrgent ? '#f59e0b' : '#5b21b6' }}>
            {day}
          </span>
          <span className="text-[10px] uppercase tracking-wide"
            style={{ color: isUrgent ? '#f59e0b' : '#a78bfa' }}>
            {mon}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[11px] capitalize mb-0.5" style={{ color: dark ? '#7c6fad' : '#a78bfa' }}>
            {weekDay}
          </p>
          <p className="text-base font-semibold leading-tight truncate"
            style={{ color: dark ? '#e9d5ff' : '#1e0a3c' }}>
            {nextEvent.emoji} {nextEvent.title}
          </p>
        </div>

        <div className="flex flex-col items-end flex-shrink-0">
          {isToday ? (
            <span className="text-sm font-bold text-amber-500">Aujourd'hui 🎉</span>
          ) : isTomorrow ? (
            <span className="text-sm font-bold text-amber-500">Demain</span>
          ) : (
            <>
              <span className="text-3xl font-bold leading-none"
                style={{ color: isUrgent ? '#f59e0b' : (dark ? '#e9d5ff' : '#1e0a3c') }}>
                {days}
              </span>
              <span className="text-[10px] mt-0.5"
                style={{ color: isUrgent ? '#f59e0b' : (dark ? '#7c6fad' : '#9ca3af') }}>
                jours
              </span>
            </>
          )}
        </div>
      </div>
    </button>
  )
}
