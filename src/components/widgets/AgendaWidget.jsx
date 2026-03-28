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
  const isUrgent  = days <= 3
  const countdown = days === 0 ? "Aujourd'hui 🎉" : days === 1 ? 'Demain' : `dans ${days} jours`
  const dateObj   = getNextOccurrence(nextEvent)
  const day       = dateObj.getDate()
  const mon       = dateObj.toLocaleDateString('fr-FR', { month:'short' }).replace('.','')

  return (
    <button onClick={onClick}
      className="w-full rounded-2xl p-3 text-left active:scale-95 transition-all"
      style={{
        background: dark ? '#1e1b4b' : '#fff',
        border: `0.5px solid ${dark ? '#4338ca' : '#ede9fe'}`
      }}>
      <p className="text-[11px] mb-1.5" style={{ color:'#c4b5fd' }}>Prochain événement</p>
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-xl flex flex-col items-center justify-center flex-shrink-0"
          style={{ background: dark ? '#312e81' : '#f5f0ff', border:`0.5px solid ${dark ? '#4338ca' : '#e9d5ff'}` }}>
          <span className="text-[14px] font-medium leading-none" style={{ color:'#5b21b6' }}>{day}</span>
          <span className="text-[9px] uppercase" style={{ color:'#a78bfa' }}>{mon}</span>
        </div>
        <div className="min-w-0">
          <p className="text-[12px] font-medium truncate" style={{ color: dark ? '#e9d5ff' : '#111827' }}>{nextEvent.emoji} {nextEvent.title}</p>
          <p className={`text-[11px] ${isUrgent ? 'text-amber-500' : 'text-gray-400'}`}>{countdown}</p>
        </div>
      </div>
    </button>
  )
}
