import { useState, useEffect } from 'react'
import { supabase } from '../../supabase'

const EMOJIS = ['💌','😘','🥰','💕','🐒','🚀','☀️','🌙','💤','😴','🍕','🎉','😅','🥲','💪','🌿','☕','🫶']

function timeAgo(isoStr) {
  const diff = Math.floor((Date.now() - new Date(isoStr)) / 1000)
  if (diff < 60) return "à l'instant"
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`
  const d = new Date(isoStr)
  return `${d.getDate()}/${d.getMonth() + 1}`
}

export default function Bisou({ profile, onSeen }) {
  const [messages, setMessages] = useState([])
  const [profiles, setProfiles] = useState({})
  const [loading, setLoading] = useState(true)
  const [selectedEmoji, setSelectedEmoji] = useState('💌')
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    loadMessages()
  }, [])

  const loadMessages = async () => {
    setLoading(true)
    const [{ data: msgs }, { data: profs }] = await Promise.all([
      supabase.from('bisou_messages').select('*').order('created_at', { ascending: false }).limit(30),
      supabase.from('profiles').select('*'),
    ])
    setMessages(msgs || [])
    setProfiles(Object.fromEntries((profs || []).map(p => [p.id, p])))
    setLoading(false)

    // Marquer comme vu
    localStorage.setItem(`bisou-last-seen-${profile.id}`, new Date().toISOString())
    onSeen?.()
  }

  const send = async () => {
    if (sending) return
    setSending(true)
    const { data } = await supabase.from('bisou_messages').insert({
      profile_id: profile.id,
      emoji: selectedEmoji,
      message: text.trim() || null,
    }).select().single()
    if (data) setMessages(prev => [data, ...prev])
    setText('')
    setSending(false)
  }

  const latest = messages[0]
  const latestProfile = latest ? profiles[latest.profile_id] : null
  const isMe = latest?.profile_id === profile.id

  return (
    <div className="h-full bg-gray-50 overflow-y-auto pb-8">

      {/* Dernier bisou */}
      <div className="px-5 pt-6 pb-4">
        {loading ? (
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex items-center justify-center">
            <div className="w-6 h-6 rounded-full animate-spin" style={{ border: '2px solid #e5e7eb', borderTopColor: '#374151' }} />
          </div>
        ) : latest ? (
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm text-center">
            <div className="text-6xl mb-3">{latest.emoji}</div>
            {latest.message && (
              <p className="text-gray-700 font-medium text-base mb-3 leading-snug">"{latest.message}"</p>
            )}
            <div className="flex items-center justify-center gap-2">
              <span className="text-lg">{latestProfile?.avatar}</span>
              <span className="text-sm text-gray-400">
                {isMe ? 'Toi' : latestProfile?.name} · {timeAgo(latest.created_at)}
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm text-center">
            <div className="text-5xl mb-3">💌</div>
            <p className="text-gray-400 text-sm">Envoie le premier bisou !</p>
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="px-5 mb-6">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4">

          {/* Sélection emoji */}
          <div className="flex flex-wrap gap-2 mb-4">
            {EMOJIS.map(e => (
              <button
                key={e}
                onClick={() => setSelectedEmoji(e)}
                className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl transition-all ${
                  selectedEmoji === e
                    ? 'bg-gray-900 scale-110 shadow-md'
                    : 'bg-gray-100 active:scale-95'
                }`}
              >
                {e}
              </button>
            ))}
          </div>

          {/* Message optionnel */}
          <textarea
            value={text}
            onChange={e => setText(e.target.value.slice(0, 140))}
            placeholder="Un petit mot... (optionnel)"
            rows={2}
            className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 focus:outline-none focus:border-gray-300 text-sm resize-none mb-3"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-300">{text.length}/140</span>
            <button
              onClick={send}
              disabled={sending}
              className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-full text-sm font-semibold active:scale-95 transition-transform disabled:opacity-40"
            >
              <span className="text-base">{selectedEmoji}</span>
              Envoyer
            </button>
          </div>
        </div>
      </div>

      {/* Historique */}
      {messages.length > 1 && (
        <div className="px-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Historique</p>
          <div className="space-y-2">
            {messages.slice(1).map(msg => {
              const p = profiles[msg.profile_id]
              const mine = msg.profile_id === profile.id
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 ${mine ? 'flex-row-reverse' : ''}`}
                >
                  <span className="text-xl flex-shrink-0 mt-1">{p?.avatar}</span>
                  <div className={`max-w-xs rounded-2xl px-4 py-2.5 ${mine ? 'bg-gray-900 text-white' : 'bg-white border border-gray-100 shadow-sm'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{msg.emoji}</span>
                      {msg.message && (
                        <p className={`text-sm leading-snug ${mine ? 'text-white' : 'text-gray-700'}`}>
                          {msg.message}
                        </p>
                      )}
                    </div>
                    <p className={`text-xs ${mine ? 'text-white/50' : 'text-gray-300'}`}>{timeAgo(msg.created_at)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}