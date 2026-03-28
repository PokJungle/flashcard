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
      const myProps    = byProfile[profile.id] || 0
      const other      = profiles.find(p => p.id !== profile.id)
      const otherProps = other ? (byProfile[other.id]||0) : 0
      const total      = myProps + otherProps
      setData({ myProps, otherProps, total, other, target, launched: total >= target })
    })
  }, [profile])

  if (!data || (data.myProps === 0 && data.otherProps === 0)) return null

  const totalPct  = Math.min(data.total / data.target, 1)
  const myShare   = data.total > 0 ? data.myProps / data.total : 0.5
  const otherShare = 1 - myShare

  return (
    <button onClick={onClick}
      className="w-full rounded-2xl px-3.5 py-3 text-left active:scale-95 transition-all flex items-center gap-3"
      style={{
        background: dark ? '#0d1117' : '#0f172a',
        border: '1px solid rgba(255,122,30,0.2)',
      }}>
      <span className="text-lg flex-shrink-0">💥</span>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2 text-[10px] text-white/40">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background:'#ff7a1e' }} />
              {profile.avatar}
            </span>
            {data.other && (
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background:'#4a8cff' }} />
                {data.other.avatar}
              </span>
            )}
          </div>
          <span className="text-[10px] font-mono font-bold"
            style={{ color: data.launched ? '#ff7a1e' : 'rgba(255,255,255,0.35)' }}>
            {Math.round(totalPct * 100)}%
            {data.launched && ' 🚀'}
          </span>
        </div>

        {/* Jauge unique empilée */}
        <div className="h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
          {totalPct > 0 && (
            <div className="h-full flex" style={{ width: `${totalPct * 100}%` }}>
              <div style={{ flex: myShare, background: 'linear-gradient(90deg,#ffb34d,#ff7a1e)' }} />
              {data.other && (
                <div style={{ flex: otherShare, background: 'linear-gradient(90deg,#6aa8ff,#4a8cff)' }} />
              )}
            </div>
          )}
        </div>
      </div>
    </button>
  )
}
