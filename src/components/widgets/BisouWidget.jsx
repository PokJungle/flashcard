import { useState, useEffect } from 'react'
import { supabase } from '../../supabase'

export default function BisouWidget({ profile, hasBadge, onClick, dark }) {
  const [lastMsg, setLastMsg] = useState(null)
  const [loaded, setLoaded]   = useState(false)

  useEffect(() => {
    if (!profile) return
    supabase.from('bisou_messages')
      .select('*, profiles(avatar, name)')
      .neq('profile_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .then(({ data }) => { if (data?.length) setLastMsg(data[0]); setLoaded(true) })
  }, [profile])

  const sender  = lastMsg?.profiles
  const emoji   = lastMsg?.emoji   ?? '🥰'
  const text    = lastMsg?.message?.trim() ?? ''
  const hasText = !!text
  // Ticker si texte long (> 38 chars)
  const useTicker = hasText && text.length > 38
  // On duplique pour un défilement continu sans saut
  const tickerContent = useTicker ? `${text}        ${text}` : text

  return (
    <button onClick={onClick}
      className="w-full rounded-xl px-3 active:scale-95 transition-all flex items-center gap-2.5 overflow-hidden"
      style={{
        height: 40,
        background: dark ? '#1e1b4b' : '#fdf2f8',
        border: `0.5px solid ${dark ? '#4338ca' : '#fce7f3'}`,
      }}>

      {/* Expéditeur */}
      {loaded && sender && (
        <span className="text-[13px] flex-shrink-0 leading-none">{sender.avatar}</span>
      )}
      <span className="text-[16px] flex-shrink-0 leading-none">{emoji}</span>

      {/* Message */}
      <div className="flex-1 overflow-hidden relative" style={{ minWidth: 0 }}>
        {!loaded ? (
          <span className="text-[11px]" style={{ color: dark ? '#7c6fad' : '#d1a6e0' }}>…</span>
        ) : !hasText ? (
          <span className="text-[11px] italic" style={{ color: dark ? '#7c6fad' : '#d1a6e0' }}>
            {sender ? `Message de ${sender.name?.split(' ')[0]}` : 'Aucun message'}
          </span>
        ) : useTicker ? (
          /* Défilement façon bandeau info */
          <span className="bisou-ticker text-[11px] italic"
            style={{ color: dark ? '#e9d5ff' : '#7c3aed' }}>
            {tickerContent}
          </span>
        ) : (
          <span className="text-[11px] italic truncate block"
            style={{ color: dark ? '#e9d5ff' : '#7c3aed' }}>
            {text}
          </span>
        )}
        {/* Fondu sur les bords pour le ticker */}
        {useTicker && (
          <>
            <span className="absolute left-0 top-0 h-full w-4 pointer-events-none"
              style={{ background: `linear-gradient(to right, ${dark ? '#1e1b4b' : '#fdf2f8'}, transparent)` }} />
            <span className="absolute right-0 top-0 h-full w-4 pointer-events-none"
              style={{ background: `linear-gradient(to left, ${dark ? '#1e1b4b' : '#fdf2f8'}, transparent)` }} />
          </>
        )}
      </div>

      {/* Badge non-lu */}
      {hasBadge && (
        <span className="text-[12px] leading-none flex-shrink-0">💗</span>
      )}
    </button>
  )
}
