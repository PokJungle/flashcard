import { useState } from 'react'
import { Plus, Trash2, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'
import { daysUntil, getNextOccurrence } from '../hooks/useProgramme'
import AddEventModal from './AddEventModal'
import { useThemeColors } from '../../../hooks/useThemeColors'

function getNextOccurrenceLabel(days) {
  const months = Math.round(days / 30)
  if (months < 12) return `Dans ~${months} mois`
  return `Dans ~${Math.round(days / 365)} an(s)`
}

function formatDate(event) {
  const next = getNextOccurrence(event)
  const opts = { day: 'numeric', month: 'long' }
  if (!event.is_annual) opts.year = 'numeric'
  let label = next.toLocaleDateString('fr-FR', opts)
  if (event.event_time) label += ` à ${event.event_time.slice(0, 5)}`
  return label
}

function CountdownBadge({ days, dark }) {
  if (days === 0) return (
    <span className="text-xs font-bold px-2 py-0.5 rounded-full animate-pulse"
      style={{ background: dark ? '#2d1a1a' : '#fee2e2', color: '#dc2626' }}>
      Aujourd'hui ! 🎉
    </span>
  )
  if (days === 1) return (
    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
      style={{ background: dark ? '#2d1e0a' : '#ffedd5', color: '#ea580c' }}>
      Demain
    </span>
  )
  if (days <= 3) return (
    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
      style={{ background: dark ? '#2d250a' : '#fef3c7', color: '#d97706' }}>
      Dans {days} jours
    </span>
  )
  if (days <= 7) return (
    <span className="text-xs font-medium px-2 py-0.5 rounded-full"
      style={{ background: dark ? '#1a1f3d' : '#eff6ff', color: '#3b82f6' }}>
      Dans {days} jours
    </span>
  )
  if (days > 365) return (
    <span className="text-xs" style={{ color: dark ? '#7c6aad' : '#9ca3af' }}>{getNextOccurrenceLabel(days)}</span>
  )
  return <span className="text-xs" style={{ color: dark ? '#7c6aad' : '#9ca3af' }}>Dans {days} jours</span>
}

function EventCard({ event, onDelete, dark }) {
  const days = daysUntil(event)
  const isUrgent = days <= 3

  const { card: cardBg, textPri, textSec } = useThemeColors(dark)
  const cardBorder = dark
    ? (isUrgent ? '#78350f' : '#2d1f5e')
    : (isUrgent ? '#fde68a' : '#f3f4f6')
  const iconBg = dark
    ? (isUrgent ? '#2d250a' : '#2d1f5e')
    : (isUrgent ? '#fffbeb' : '#f9fafb')

  return (
    <div className="rounded-2xl p-4 transition-all"
      style={{ background: cardBg, border: `1px solid ${cardBorder}`, boxShadow: isUrgent ? (dark ? '0 0 0 1px #78350f22' : '0 4px 6px -1px #fef3c733') : '0 1px 3px rgba(0,0,0,0.1)' }}>
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
          style={{ background: iconBg }}>
          {event.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-bold text-sm leading-tight" style={{ color: textPri }}>{event.title}</p>
              <p className="text-xs mt-0.5" style={{ color: textSec }}>{formatDate(event)}</p>
            </div>
            <button onClick={() => onDelete(event.id)}
              className="w-7 h-7 flex items-center justify-center rounded-xl transition-colors flex-shrink-0"
              style={{ color: textSec }}>
              <Trash2 size={14} />
            </button>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <CountdownBadge days={days} dark={dark} />
            {event.is_annual && (
              <span className="text-xs flex items-center gap-1" style={{ color: dark ? '#4338ca' : '#d1d5db' }}>
                <RefreshCw size={10} /> annuel
              </span>
            )}
          </div>
          {event.note && (
            <p className="text-xs mt-2 italic leading-snug" style={{ color: textSec }}>{event.note}</p>
          )}
        </div>
      </div>
    </div>
  )
}

function ListView({ events, loading, onDelete, dark }) {
  const urgent   = events.filter(e => daysUntil(e) <= 3)
  const upcoming = events.filter(e => daysUntil(e) > 3)
  const { textSec, textMed } = useThemeColors(dark)

  if (loading) return (
    <div className="text-center py-20" style={{ color: textSec }}>
      <div className="text-4xl mb-3 animate-spin">⏳</div>
      <p className="text-sm">Chargement…</p>
    </div>
  )

  if (events.length === 0) return (
    <div className="text-center py-20" style={{ color: textSec }}>
      <div className="text-5xl mb-4">🗓️</div>
      <p className="font-semibold" style={{ color: textMed }}>Aucun événement</p>
      <p className="text-sm mt-1">Ajoute votre prochain rendez-vous !</p>
    </div>
  )

  return (
    <div>
      {urgent.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: dark ? '#fbbf24' : '#d97706' }}>🔥 Très bientôt</p>
          <div className="space-y-3">
            {urgent.map(e => <EventCard key={e.id} event={e} onDelete={onDelete} dark={dark} />)}
          </div>
        </div>
      )}
      {upcoming.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: textSec }}>À venir</p>
          <div className="space-y-3">
            {upcoming.map(e => <EventCard key={e.id} event={e} onDelete={onDelete} dark={dark} />)}
          </div>
        </div>
      )}
    </div>
  )
}

const JOURS   = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const MOIS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

function MonthView({ events, onDelete, dark }) {
  const today = new Date()
  const [year, setYear]     = useState(today.getFullYear())
  const [month, setMonth]   = useState(today.getMonth())
  const [selected, setSelected] = useState(null)

  const firstDay    = new Date(year, month, 1)
  const startOffset = (firstDay.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const eventsByDate = {}
  events.forEach(e => {
    const next = getNextOccurrence(e)
    if (next.getFullYear() === year && next.getMonth() === month) {
      const key = next.getDate()
      if (!eventsByDate[key]) eventsByDate[key] = []
      eventsByDate[key].push(e)
    }
  })

  const prevMonth = () => { if (month === 0) { setYear(y => y - 1); setMonth(11) } else setMonth(m => m - 1); setSelected(null) }
  const nextMonth = () => { if (month === 11) { setYear(y => y + 1); setMonth(0) } else setMonth(m => m + 1); setSelected(null) }

  const selectedEvents = selected !== null ? (eventsByDate[selected] || []) : []

  const cells = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const { card, border, textPri, textSec } = useThemeColors(dark)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth}
          className="w-9 h-9 flex items-center justify-center rounded-xl active:scale-95 transition-transform"
          style={{ background: card, border: `1px solid ${border}` }}>
          <ChevronLeft size={18} style={{ color: textSec }} />
        </button>
        <p className="font-bold" style={{ color: textPri }}>{MOIS_FR[month]} {year}</p>
        <button onClick={nextMonth}
          className="w-9 h-9 flex items-center justify-center rounded-xl active:scale-95 transition-transform"
          style={{ background: card, border: `1px solid ${border}` }}>
          <ChevronRight size={18} style={{ color: textSec }} />
        </button>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {JOURS.map((j, i) => (
          <div key={i} className="text-center text-xs font-bold py-1" style={{ color: dark ? '#4338ca' : '#d1d5db' }}>{j}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (d === null) return <div key={`empty-${i}`} />
          const isToday    = d === today.getDate() && month === today.getMonth() && year === today.getFullYear()
          const hasEvents  = !!eventsByDate[d]
          const isSelected = selected === d
          const evts       = eventsByDate[d] || []
          const isUrgent   = evts.some(e => daysUntil(e) <= 3)

          let bg, color, borderColor
          if (isSelected) { bg = '#6366f1'; color = '#ffffff'; borderColor = '#6366f1' }
          else if (isToday) { bg = dark ? '#1e1b4b' : '#eef2ff'; color = '#6366f1'; borderColor = dark ? '#4338ca' : '#c7d2fe' }
          else { bg = card; color = dark ? '#c4b5fd' : '#374151'; borderColor = border }

          return (
            <button key={d} onClick={() => setSelected(isSelected ? null : d)}
              className="relative aspect-square flex flex-col items-center justify-center rounded-xl text-sm font-medium transition-all active:scale-95"
              style={{ background: bg, color, border: `1px solid ${borderColor}` }}>
              {d}
              {hasEvents && (
                <div className="absolute bottom-1 flex gap-0.5 justify-center">
                  {evts.slice(0, 3).map((e, idx) => (
                    <div key={idx} className="w-1 h-1 rounded-full"
                      style={{ background: isSelected ? 'rgba(255,255,255,0.7)' : isUrgent ? '#f59e0b' : '#6366f1' }} />
                  ))}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {selected !== null && (
        <div className="mt-5">
          <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: textSec }}>
            {selected} {MOIS_FR[month]}
          </p>
          {selectedEvents.length === 0 ? (
            <p className="text-sm text-center py-4" style={{ color: textSec }}>Aucun événement ce jour</p>
          ) : (
            <div className="space-y-3">
              {selectedEvents.map(e => <EventCard key={e.id} event={e} onDelete={onDelete} dark={dark} />)}
            </div>
          )}
        </div>
      )}

      {Object.keys(eventsByDate).length === 0 && (
        <p className="text-sm text-center mt-8" style={{ color: textSec }}>Aucun événement ce mois-ci</p>
      )}
    </div>
  )
}

export default function HomeScreen({ events, loading, onAdd, onDelete, profile, view, dark }) {
  const [showModal, setShowModal] = useState(false)

  return (
    <div className="px-5 py-6 max-w-lg mx-auto pb-6">
      {view === 'list'
        ? <ListView events={events} loading={loading} onDelete={onDelete} dark={dark} />
        : <MonthView events={events} onDelete={onDelete} dark={dark} />
      }

      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-20 right-6 w-14 h-14 bg-indigo-500 text-white rounded-full shadow-lg flex items-center justify-center active:scale-90 transition-transform hover:bg-indigo-600 z-40">
        <Plus size={24} />
      </button>

      {showModal && (
        <AddEventModal
          onAdd={(data) => { onAdd({ ...data, profile_id: profile?.id }); setShowModal(false) }}
          onClose={() => setShowModal(false)}
          dark={dark}
        />
      )}
    </div>
  )
}