import { useState, useEffect } from 'react'
import { supabase } from '../../supabase'
import { getNextOccurrence, daysUntil } from '../../apps/Programme/hooks/useProgramme'

export default function AgendaWidget({ onClick, dark }) {
  const [events, setEvents] = useState([])
  const [monthCount, setMonthCount] = useState(0)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    supabase.from('programme_events').select('*').order('event_date', { ascending: true })
      .then(({ data }) => {
        if (!data) { setLoaded(true); return }
        const today = new Date(); today.setHours(0, 0, 0, 0)
        const in30 = new Date(today); in30.setDate(in30.getDate() + 30)
        const future = data.filter(e => {
          if (e.is_annual) return true
          const [y, m, d] = e.event_date.split('-').map(Number)
          return new Date(y, m - 1, d) >= today
        })
        future.sort((a, b) => getNextOccurrence(a) - getNextOccurrence(b))
        const inMonth = future.filter(e => getNextOccurrence(e) <= in30)
        setMonthCount(inMonth.length)
        setEvents(future.slice(0, 4))
        setLoaded(true)
      })
  }, [])

  if (!loaded || events.length === 0) return null

  const first  = events[0]
  const rest   = events.slice(1)

  return (
    <button onClick={onClick}
      className="w-full rounded-2xl text-left active:scale-95 transition-all overflow-hidden"
      style={{
        background: dark ? '#1a1035' : '#fff',
        border: `0.5px solid ${dark ? '#2d1f5e' : '#ede9fe'}`,
        borderLeft: '3px solid #8B5CF6',
      }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-base">🗞️</span>
          <span className="text-sm font-semibold" style={{ color: dark ? '#e9d5ff' : '#1e0a3c' }}>
            Demandez le Programme
          </span>
        </div>
        {monthCount > 0 && (
          <span className="text-[10px] px-2 py-0.5 rounded-full"
            style={{ background: dark ? 'rgba(139,92,246,0.15)' : 'rgba(139,92,246,0.1)', color: '#8B5CF6' }}>
            {monthCount} ce mois
          </span>
        )}
      </div>

      {/* Séparateur */}
      <div style={{ height: '0.5px', background: dark ? 'rgba(67,56,202,0.4)' : '#f3e8ff', margin: '0 16px' }} />

      {/* Tous les événements — même layout : [calendrier] [titre] [countdown] */}
      {[first, ...rest].map((ev, i) => {
        const days       = daysUntil(ev)
        const isToday    = days === 0
        const isTomorrow = days === 1
        const isUrgent   = days <= 3
        const dateObj    = getNextOccurrence(ev)
        const day        = dateObj.getDate()
        const mon        = dateObj.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '')
        const isFirst    = i === 0

        return (
          <div key={ev.id}
            className="flex items-center gap-3 px-4"
            style={{
              paddingTop:    isFirst ? 10 : 8,
              paddingBottom: isFirst ? 10 : 8,
              borderTop: i > 0 ? `0.5px solid ${dark ? 'rgba(45,31,94,0.6)' : '#faf5ff'}` : undefined,
              background: isFirst && isUrgent
                ? (dark ? 'rgba(251,191,36,0.06)' : 'rgba(251,191,36,0.04)')
                : undefined,
            }}>

            {/* Calendrier */}
            <div className="flex flex-col items-center justify-center rounded-lg flex-shrink-0"
              style={{
                width: isFirst ? 44 : 34,
                height: isFirst ? 44 : 34,
                background: isUrgent
                  ? 'rgba(245,158,11,0.15)'
                  : (dark ? '#312e81' : '#f5f0ff'),
                border: `0.5px solid ${isUrgent ? 'rgba(245,158,11,0.4)' : (dark ? '#4338ca' : '#e9d5ff')}`,
              }}>
              <span style={{
                fontSize: isFirst ? 16 : 12,
                fontWeight: 700,
                lineHeight: 1,
                color: isUrgent ? '#f59e0b' : '#5b21b6',
              }}>{day}</span>
              <span style={{
                fontSize: 9,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                color: isUrgent ? '#f59e0b' : '#a78bfa',
              }}>{mon}</span>
            </div>

            {/* Titre */}
            <div className="flex-1 min-w-0">
              <p style={{
                fontSize: isFirst ? 14 : 12,
                fontWeight: isFirst ? 600 : 400,
                color: dark ? '#e9d5ff' : '#1e0a3c',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {ev.emoji} {ev.title}
              </p>
            </div>

            {/* Countdown */}
            <div className="flex-shrink-0 text-right">
              {isToday ? (
                <span style={{ fontSize: isFirst ? 12 : 11, fontWeight: 700, color: '#f59e0b' }}>Auj. 🎉</span>
              ) : isTomorrow ? (
                <span style={{ fontSize: isFirst ? 12 : 11, fontWeight: 700, color: '#f59e0b' }}>Dem.</span>
              ) : (
                <span style={{
                  display: 'flex', alignItems: 'baseline', gap: 1,
                  color: isUrgent ? '#f59e0b' : (dark ? '#e9d5ff' : '#1e0a3c'),
                }}>
                  <span style={{ fontSize: isFirst ? 28 : 16, fontWeight: 700, lineHeight: 1 }}>{days}</span>
                  <span style={{ fontSize: 9, color: isUrgent ? '#f59e0b' : (dark ? '#7c6fad' : '#9ca3af') }}>j</span>
                </span>
              )}
            </div>
          </div>
        )
      })}
    </button>
  )
}
