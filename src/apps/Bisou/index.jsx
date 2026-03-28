import { useState, useEffect } from 'react'
import { supabase } from '../../supabase'
import { useThemeColors } from '../../hooks/useThemeColors'
import { timeAgo } from '../../utils/dateUtils'

const EMOJIS = ['💌','😘','🥰','💕','🐒','🚀','☀️','🌙','💤','😴','🍕','🎉','😅','🥲','💪','🌿','☕','🫶']

export default function Bisou({ profile, onSeen, dark }) {
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

  const { bg, card, border, textPri, textSec } = useThemeColors(dark)

  return (
    <div className="h-full overflow-y-auto pb-8" style={{ background: bg }}>

      {/* Dernier bisou */}
      <div className="px-5 pt-6 pb-4">
        {loading ? (
          <div className="rounded-3xl p-8 shadow-sm flex items-center justify-center"
            style={{ background: card, border: `1px solid ${border}` }}>
            <div className="w-6 h-6 rounded-full animate-spin"
              style={{ border: `2px solid ${border}`, borderTopColor: dark ? '#a78bfa' : '#374151' }} />
          </div>
        ) : latest ? (
          <div className="rounded-3xl p-6 shadow-sm text-center"
            style={{ background: card, border: `1px solid ${border}` }}>
            <div className="text-6xl mb-3">{latest.emoji}</div>
            {latest.message && (
              <p className="font-medium text-base mb-3 leading-snug" style={{ color: textPri }}>
                "{latest.message}"
              </p>
            )}
            <div className="flex items-center justify-center gap-2">
              <span className="text-lg">{latestProfile?.avatar}</span>
              <span className="text-sm" style={{ color: textSec }}>
                {isMe ? 'Toi' : latestProfile?.name} · {timeAgo(latest.created_at)}
              </span>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl p-8 shadow-sm text-center"
            style={{ background: card, border: `1px solid ${border}` }}>
            <div className="text-5xl mb-3">💌</div>
            <p className="text-sm" style={{ color: textSec }}>Envoie le premier bisou !</p>
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="px-5 mb-6">
        <div className="rounded-3xl shadow-sm p-4"
          style={{ background: card, border: `1px solid ${border}` }}>

          {/* Sélection emoji */}
          <div className="flex flex-wrap gap-2 mb-4">
            {EMOJIS.map(e => (
              <button
                key={e}
                onClick={() => setSelectedEmoji(e)}
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl transition-all active:scale-95"
                style={selectedEmoji === e
                  ? { background: dark ? '#7c3aed' : '#111827', transform: 'scale(1.1)', boxShadow: '0 4px 6px rgba(0,0,0,0.2)' }
                  : { background: dark ? '#2d1f5e' : '#f3f4f6' }
                }
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
            className="w-full px-4 py-3 rounded-2xl text-sm resize-none mb-3 focus:outline-none"
            style={{
              background: dark ? '#0f0a1e' : '#f9fafb',
              border: `1px solid ${dark ? '#4338ca' : '#f3f4f6'}`,
              color: textPri,
            }}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: dark ? '#4338ca' : '#d1d5db' }}>{text.length}/140</span>
            <button
              onClick={send}
              disabled={sending}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold active:scale-95 transition-transform disabled:opacity-40"
              style={{ background: dark ? '#7c3aed' : '#111827', color: '#fff' }}
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
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: textSec }}>
            Historique
          </p>
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
                  <div className="max-w-xs rounded-2xl px-4 py-2.5"
                    style={mine
                      ? { background: dark ? '#7c3aed' : '#111827', color: '#fff' }
                      : { background: card, border: `1px solid ${border}` }
                    }>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{msg.emoji}</span>
                      {msg.message && (
                        <p className="text-sm leading-snug"
                          style={{ color: mine ? '#fff' : textPri }}>
                          {msg.message}
                        </p>
                      )}
                    </div>
                    <p className="text-xs"
                      style={{ color: mine ? 'rgba(255,255,255,0.5)' : textSec }}>
                      {timeAgo(msg.created_at)}
                    </p>
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