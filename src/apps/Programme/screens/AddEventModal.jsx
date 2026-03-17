import { useState } from 'react'
import { X } from 'lucide-react'

const EMOJI_SUGGESTIONS = ['🎂', '🎉', '✈️', '🏥', '🎓', '💍', '🎸', '🍽️', '🎭', '🌿', '📅', '❤️']

export default function AddEventModal({ onAdd, onClose }) {
  const [title, setTitle] = useState('')
  const [emoji, setEmoji] = useState('📅')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [note, setNote] = useState('')
  const [isAnnual, setIsAnnual] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async () => {
    if (!title.trim() || !date) return
    setSaving(true)
    setError(null)
    try {
      await onAdd({ title: title.trim(), emoji, event_date: date, event_time: time || null, note: note.trim() || null, is_annual: isAnnual })
      onClose()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white w-full max-w-lg rounded-t-3xl p-6 pb-10 space-y-5 animate-slide-up">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Nouvel événement</h2>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Emoji picker */}
        <div>
          <p className="text-xs text-gray-500 font-medium mb-2">Emoji</p>
          <div className="flex gap-2 flex-wrap">
            {EMOJI_SUGGESTIONS.map(e => (
              <button key={e} onClick={() => setEmoji(e)}
                className={`w-10 h-10 text-xl rounded-xl transition-all ${emoji === e ? 'bg-indigo-100 ring-2 ring-indigo-400 scale-110' : 'bg-gray-100 hover:bg-gray-200'}`}>
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Titre */}
        <div>
          <p className="text-xs text-gray-500 font-medium mb-1">Titre *</p>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Anniversaire de Mamie, Vacances…"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>

        {/* Date + heure */}
        <div className="flex gap-3">
          <div className="flex-1">
            <p className="text-xs text-gray-500 font-medium mb-1">Date *</p>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <div className="w-28">
            <p className="text-xs text-gray-500 font-medium mb-1">Heure</p>
            <input
              type="time"
              value={time}
              onChange={e => setTime(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
        </div>

        {/* Note */}
        <div>
          <p className="text-xs text-gray-500 font-medium mb-1">Note (optionnelle)</p>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={2}
            placeholder="Quelques détails…"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
          />
        </div>

        {/* Récurrence annuelle */}
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <div onClick={() => setIsAnnual(v => !v)}
            className={`w-12 h-6 rounded-full transition-colors flex items-center px-1 ${isAnnual ? 'bg-indigo-500' : 'bg-gray-200'}`}>
            <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${isAnnual ? 'translate-x-6' : 'translate-x-0'}`} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Récurrence annuelle</p>
            <p className="text-xs text-gray-400">Pour les anniversaires, fêtes…</p>
          </div>
        </label>

        {error && <p className="text-red-500 text-xs">{error}</p>}

        {/* Bouton */}
        <button
          onClick={handleSubmit}
          disabled={!title.trim() || !date || saving}
          className="w-full bg-indigo-500 text-white font-semibold py-3 rounded-2xl disabled:opacity-40 active:scale-95 transition-all">
          {saving ? 'Enregistrement…' : `${emoji} Ajouter`}
        </button>
      </div>
    </div>
  )
}