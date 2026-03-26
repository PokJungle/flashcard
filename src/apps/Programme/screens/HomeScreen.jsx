import { useState } from 'react'
import { Plus, Trash2, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'
import { daysUntil, getNextOccurrence } from '../hooks/useProgramme'
import AddEventModal from './AddEventModal'

// ─── Helpers ────────────────────────────────────────────────────────────────

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

// ─── Composants partagés ─────────────────────────────────────────────────────

function CountdownBadge({ days }) {
  if (days === 0) return (
    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600 animate-pulse">
      Aujourd'hui ! 🎉
    </span>
  )
  if (days === 1) return (
    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-600">
      Demain
    </span>
  )
  if (days <= 3) return (
    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-600">
      Dans {days} jours
    </span>
  )
  if (days <= 7) return (
    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-500">
      Dans {days} jours
    </span>
  )
  if (days > 365) return (
    <span className="text-xs text-gray-400">{getNextOccurrenceLabel(days)}</span>
  )
  return <span className="text-xs text-gray-400">Dans {days} jours</span>
}

function EventCard({ event, onDelete }) {
  const days = daysUntil(event)
  const isUrgent = days <= 3

  return (
    <div className={`bg-white rounded-2xl p-4 border transition-all ${isUrgent ? 'border-amber-200 shadow-amber-50 shadow-md' : 'border-gray-100 shadow-sm'}`}>
      <div className="flex items-start gap-3">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 ${isUrgent ? 'bg-amber-50' : 'bg-gray-50'}`}>
          {event.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-bold text-gray-900 text-sm leading-tight">{event.title}</p>
              <p className="text-xs text-gray-400 mt-0.5">{formatDate(event)}</p>
            </div>
            <button onClick={() => onDelete(event.id)}
              className="w-7 h-7 flex items-center justify-center rounded-xl text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors flex-shrink-0">
              <Trash2 size={14} />
            </button>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <CountdownBadge days={days} />
            {event.is_annual && (
              <span className="text-xs text-gray-300 flex items-center gap-1">
                <RefreshCw size={10} /> annuel
              </span>
            )}
          </div>
          {event.note && (
            <p className="text-xs text-gray-400 mt-2 italic leading-snug">{event.note}</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Vue Liste ───────────────────────────────────────────────────────────────

function ListView({ events, loading, onDelete }) {
  const urgent = events.filter(e => daysUntil(e) <= 3)
  const upcoming = events.filter(e => daysUntil(e) > 3)

  if (loading) return (
    <div className="text-center py-20 text-gray-400">
      <div className="text-4xl mb-3 animate-spin">⏳</div>
      <p className="text-sm">Chargement…</p>
    </div>
  )

  if (events.length === 0) return (
    <div className="text-center py-20 text-gray-400">
      <div className="text-5xl mb-4">🗓️</div>
      <p className="font-semibold text-gray-600">Aucun événement</p>
      <p className="text-sm mt-1">Ajoute votre prochain rendez-vous !</p>
    </div>
  )

  return (
    <div>
      {urgent.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-bold text-amber-600 uppercase tracking-wide mb-3">🔥 Très bientôt</p>
          <div className="space-y-3">
            {urgent.map(e => <EventCard key={e.id} event={e} onDelete={onDelete} />)}
          </div>
        </div>
      )}
      {upcoming.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">À venir</p>
          <div className="space-y-3">
            {upcoming.map(e => <EventCard key={e.id} event={e} onDelete={onDelete} />)}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Vue Mois ────────────────────────────────────────────────────────────────

const JOURS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const MOIS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

function MonthView({ events, onDelete }) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selected, setSelected] = useState(null)

  const firstDay = new Date(year, month, 1)
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

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
    setSelected(null)
  }
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
    setSelected(null)
  }

  const selectedEvents = selected !== null ? (eventsByDate[selected] || []) : []

  const cells = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-gray-100 shadow-sm active:scale-95 transition-transform">
          <ChevronLeft size={18} className="text-gray-500" />
        </button>
        <p className="font-bold text-gray-900">{MOIS_FR[month]} {year}</p>
        <button onClick={nextMonth}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-gray-100 shadow-sm active:scale-95 transition-transform">
          <ChevronRight size={18} className="text-gray-500" />
        </button>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {JOURS.map((j, i) => (
          <div key={i} className="text-center text-xs font-bold text-gray-300 py-1">{j}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (d === null) return <div key={`empty-${i}`} />
          const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear()
          const hasEvents = !!eventsByDate[d]
          const isSelected = selected === d
          const evts = eventsByDate[d] || []
          const isUrgent = evts.some(e => daysUntil(e) <= 3)

          return (
            <button key={d} onClick={() => setSelected(isSelected ? null : d)}
              className={`relative aspect-square flex flex-col items-center justify-center rounded-xl text-sm font-medium transition-all active:scale-95
                ${isSelected ? 'bg-indigo-500 text-white shadow-md' : isToday ? 'bg-indigo-50 text-indigo-600 font-bold' : 'bg-white text-gray-700 border border-gray-100'}
                ${hasEvents && !isSelected ? 'shadow-sm' : ''}
              `}>
              {d}
              {hasEvents && (
                <div className="absolute bottom-1 flex gap-0.5 justify-center">
                  {evts.slice(0, 3).map((e, idx) => (
                    <div key={idx}
                      className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white/70' : isUrgent ? 'bg-amber-400' : 'bg-indigo-400'}`} />
                  ))}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {selected !== null && (
        <div className="mt-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
            {selected} {MOIS_FR[month]}
          </p>
          {selectedEvents.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Aucun événement ce jour</p>
          ) : (
            <div className="space-y-3">
              {selectedEvents.map(e => <EventCard key={e.id} event={e} onDelete={onDelete} />)}
            </div>
          )}
        </div>
      )}

      {Object.keys(eventsByDate).length === 0 && (
        <p className="text-sm text-gray-400 text-center mt-8">Aucun événement ce mois-ci</p>
      )}
    </div>
  )
}

// ─── Shell principal ──────────────────────────────────────────────────────────

export default function HomeScreen({ events, loading, onAdd, onDelete, profile, view }) {
  const [showModal, setShowModal] = useState(false)

  return (
    <div className="px-5 py-6 max-w-lg mx-auto pb-6">
      {view === 'list'
        ? <ListView events={events} loading={loading} onDelete={onDelete} />
        : <MonthView events={events} onDelete={onDelete} />
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
        />
      )}
    </div>
  )
}