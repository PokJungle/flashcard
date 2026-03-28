import { useState, useEffect } from 'react'
import { supabase } from '../../supabase'

export default function OrbiteWidget({ profile, onClick, dark }) {
  const [data, setData] = useState(null)

  useEffect(() => {
    if (!profile) return
    const now = new Date(); const day = now.getDay()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - day + (day === 0 ? -6 : 1))
    weekStart.setHours(0,0,0,0)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6); weekEnd.setHours(23,59,59,999)

    Promise.all([
      supabase.from('orbite_activities').select('profile_id, props')
        .gte('created_at', weekStart.toISOString()).lte('created_at', weekEnd.toISOString()),
      supabase.from('profiles').select('*'),
      supabase.from('orbite_settings').select('weekly_rocket_target')
        .eq('profile_id', profile.id).maybeSingle(),
    ]).then(([actsRes, profilesRes, settingsRes]) => {
      const acts = actsRes.data || []; const profiles = profilesRes.data || []
      const target = settingsRes.data?.weekly_rocket_target || 10000
      const byProfile = {}
      acts.forEach(a => { byProfile[a.profile_id] = (byProfile[a.profile_id]||0) + a.props })
      const myProps = byProfile[profile.id] || 0
      const other   = profiles.find(p => p.id !== profile.id)
      const otherProps = other ? (byProfile[other.id]||0) : 0
      const total   = myProps + otherProps
      setData({ myProps, otherProps, total, other, target, launched: total >= target })
    })
  }, [profile])

  if (!data || (data.myProps === 0 && data.otherProps === 0)) return null

  const myPct    = Math.min(data.myProps / data.target, 1)
  const otherPct = Math.min(data.otherProps / data.target, 1)

  return (
    <button onClick={onClick}
      className="w-full rounded-2xl px-4 py-3.5 text-left active:scale-95 transition-all"
      style={{
        background: dark ? '#0d1117' : '#0f172a',
        border: '1px solid rgba(255,122,30,0.2)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
      }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold tracking-wide text-white/40 uppercase">
          💥 Orbite · Cette semaine
        </span>
        {data.launched && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
            style={{ background: 'rgba(255,122,30,0.2)', color: '#ff7a1e' }}>
            Décollage ! 🚀
          </span>
        )}
      </div>

      <div className="space-y-2.5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 w-16 flex-shrink-0">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#ff7a1e' }} />
            <span className="text-sm">{profile.avatar}</span>
            <span className="text-[10px] text-white/50 truncate">{profile.name?.split(' ')[0]}</span>
          </div>
          <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
            {myPct > 0 && (
              <div className="h-full rounded-full transition-all"
                style={{ width: `${myPct * 100}%`, background: 'linear-gradient(90deg,#ffb34d,#ff7a1e)' }} />
            )}
          </div>
          <span className="text-[11px] font-mono text-white/60 w-8 text-right flex-shrink-0">
            {Math.round(myPct * 100)}%
          </span>
        </div>

        {data.other && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 w-16 flex-shrink-0">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#4a8cff' }} />
              <span className="text-sm">{data.other.avatar}</span>
              <span className="text-[10px] text-white/50 truncate">{data.other.name?.split(' ')[0]}</span>
            </div>
            <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
              {otherPct > 0 && (
                <div className="h-full rounded-full transition-all"
                  style={{ width: `${otherPct * 100}%`, background: 'linear-gradient(90deg,#6aa8ff,#4a8cff)' }} />
              )}
            </div>
            <span className="text-[11px] font-mono text-white/60 w-8 text-right flex-shrink-0">
              {Math.round(otherPct * 100)}%
            </span>
          </div>
        )}
      </div>
    </button>
  )
}
