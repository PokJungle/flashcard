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
      .order('created_at', { ascending:false })
      .limit(1)
      .then(({ data }) => { if (data?.length) setLastMsg(data[0]); setLoaded(true) })
  }, [profile])

  const hasText = !!(lastMsg?.message?.trim())

  return (
    <button onClick={onClick}
      className="relative rounded-2xl p-2.5 text-left active:scale-95 transition-all overflow-hidden flex-1 flex flex-col"
      style={{
        background: dark ? '#1e1b4b' : '#fff',
        border: `0.5px solid ${dark ? '#4338ca' : '#fce7f3'}`
      }}>
      {hasBadge && (
        <span className="absolute top-2 right-2 text-[13px] leading-none z-10">💗</span>
      )}
      {hasText ? (
        <>
          <span className="text-[22px] leading-none mb-1.5">{lastMsg.emoji}</span>
          <div className="min-w-0 w-full">
            <p className="text-[10px] leading-tight" style={{ color:'#d1a6e0' }}>
              {lastMsg.profiles?.avatar} {lastMsg.profiles?.name}
            </p>
            <p className="text-[11px] italic leading-snug mt-0.5"
              style={{ color: dark ? '#e9d5ff' : '#4b1a6a', display:'-webkit-box', WebkitLineClamp:3,
                       WebkitBoxOrient:'vertical', overflow:'hidden' }}>
              {lastMsg.message}
            </p>
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <span className="text-[38px] leading-none">
            {loaded ? (lastMsg?.emoji ?? '🥰') : '🥰'}
          </span>
        </div>
      )}
    </button>
  )
}
