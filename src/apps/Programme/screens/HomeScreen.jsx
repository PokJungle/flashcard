import { useState } from 'react'
import { Plus, Trash2, RefreshCw } from 'lucide-react'
import { daysUntil, getNextOccurrence } from '../hooks/useProgramme'
import AddEventModal from './AddEventModal'

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
    <span className="text-xs text-gray-400">
      {getNextOccurrenceLabel(days)}
    </span>
  )
  return (
    <span className="text-xs text-gray-400">Dans {days} jours</span>
  )
}

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
  if (event.event_time) {
    label += ` à ${event.event_time.slice(0, 5)}`
  }
  return label
}

function EventCard({ event, onDelete }) {
  const days = daysUntil(event)
  const isUrgent = days <= 3

  return (
    <div className={`bg-white rounded-2xl p-4 border transition-all ${isUrgent ? 'border-amber-200 shadow-amber-50 shadow-md' : 'border-gray-100 shadow-sm'}`}>
      <div className="flex items-start gap-3">
        {/* Emoji */}
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 ${isUrgent ? 'bg-amber-50' : 'bg-gray-50'}`}>
          {event.emoji}
        </div>

        {/* Contenu */}
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

export default function HomeScreen({ events, loading, onAdd, onDelete, profile }) {
  const [showModal, setShowModal] = useState(false)

  // Séparer les événements urgents (≤3j) des autres
  const urgent = events.filter(e => daysUntil(e) <= 3)
  const upcoming = events.filter(e => daysUntil(e) > 3)

  return (
    <div className="px-5 py-6 max-w-lg mx-auto pb-24">

      {/* En avant pour bientôt */}
      {urgent.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-bold text-amber-600 uppercase tracking-wide mb-3">🔥 Très bientôt</p>
          <div className="space-y-3">
            {urgent.map(e => (
              <EventCard key={e.id} event={e} onDelete={onDelete} />
            ))}
          </div>
        </div>
      )}

      {/* À venir */}
      {upcoming.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">À venir</p>
          <div className="space-y-3">
            {upcoming.map(e => (
              <EventCard key={e.id} event={e} onDelete={onDelete} />
            ))}
          </div>
        </div>
      )}

      {/* État vide */}
      {!loading && events.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-4">🗓️</div>
          <p className="font-semibold text-gray-600">Aucun événement</p>
          <p className="text-sm mt-1">Ajoute votre prochain rendez-vous !</p>
        </div>
      )}

      {loading && (
        <div className="text-center py-20 text-gray-400">
          <div className="text-4xl mb-3 animate-spin">⏳</div>
          <p className="text-sm">Chargement…</p>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-8 right-6 w-14 h-14 bg-indigo-500 text-white rounded-full shadow-lg flex items-center justify-center active:scale-90 transition-transform hover:bg-indigo-600 z-40">
        <Plus size={24} />
      </button>

      {showModal && (
        <AddEventModal
          onAdd={(data) => onAdd({ ...data, profile_id: profile?.id })}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}