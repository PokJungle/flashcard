import { useState, useEffect } from 'react'
import { supabase } from '../../supabase'

export default function OrbiteWidget({ profile, onClick }) {
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
      const total   = Object.values(byProfile).reduce((s,v) => s+v, 0)
      const myProps = byProfile[profile.id] || 0
      const other   = profiles.find(p => p.id !== profile.id)
      setData({ myProps, total, other, target, launched: total >= target,
        otherProps: other ? (byProfile[other.id]||0) : 0 })
    })
  }, [profile])

  if (!data || (data.myProps === 0 && data.otherProps === 0)) return null

  const totalPct = Math.min(data.total / data.target, 1)
  const myShare  = data.total > 0 ? data.myProps / data.total : 0.5

  return (
    <button onClick={onClick}
      className="active:scale-95 transition-all self-stretch flex-shrink-0"
      style={{ width:64, borderRadius:18,
        background:'linear-gradient(180deg,#0d1320,#0a0e18)',
        border:'1px solid rgba(255,122,30,0.25)',
        display:'flex', flexDirection:'column', alignItems:'center',
        padding:'10px 0 8px', gap:5,
        boxShadow:'0 2px 12px rgba(0,0,0,0.25)' }}>
      <span style={{ fontSize:17 }}>💥</span>
      <div style={{ flex:1, width:22, borderRadius:99,
        background:'rgba(255,255,255,0.07)', overflow:'hidden',
        display:'flex', flexDirection:'column', justifyContent:'flex-end' }}>
        {totalPct > 0 && (
          <div style={{ width:'100%', height:`${totalPct*100}%`, display:'flex', flexDirection:'column' }}>
            <div style={{ flex:myShare,   background:'linear-gradient(180deg,#ffb34d,#ff7a1e)' }} />
            {data.other && <div style={{ flex:1-myShare, background:'linear-gradient(180deg,#6aa8ff,#4a8cff)' }} />}
          </div>
        )}
      </div>
      <span style={{ fontFamily:'monospace', fontSize:10, fontWeight:700,
        color: data.launched ? '#ff7a1e' : 'rgba(255,255,255,0.35)' }}>
        {Math.round(totalPct*100)}%
      </span>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
        <div style={{ display:'flex', alignItems:'center', gap:3 }}>
          <span style={{ width:6, height:6, borderRadius:'50%', background:'#ff7a1e', flexShrink:0 }} />
          <span style={{ fontSize:12 }}>{profile.avatar}</span>
        </div>
        {data.other && (
          <div style={{ display:'flex', alignItems:'center', gap:3 }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:'#4a8cff', flexShrink:0 }} />
            <span style={{ fontSize:12 }}>{data.other.avatar}</span>
          </div>
        )}
      </div>
    </button>
  )
}
