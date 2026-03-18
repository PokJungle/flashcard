import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Flashcards from './apps/Flashcards/index.jsx'
import Meteo from './apps/Meteo/index.jsx'
import Grimoire from './apps/Grimoire/index.jsx'
import Bisou from './apps/Bisou/index.jsx'
import Programme from './apps/Programme/index.jsx'
import Orbite from './apps/Orbite/index.jsx'
import { getNextOccurrence, daysUntil } from './apps/Programme/hooks/useProgramme.js'

const APPS = [
  { id: 'flashcards', name: 'Mémoire de Singe',         emoji: '🐒', color: '#6A9BCC', component: Flashcards },
  { id: 'meteo',      name: 'Parapluie ou Claquettes ?', emoji: '🌦️', color: '#4CAF82', component: Meteo },
  { id: 'recettes',   name: 'Le Grimoire Gourmand',      emoji: '📖', color: '#E67E22', component: Grimoire },
  { id: 'bisou',      name: 'Bisou',                     emoji: '💌', color: '#E91E8C', component: Bisou },
  { id: 'programme',  name: 'Demandez le Programme !',   emoji: '🗞️', color: '#8B5CF6', component: Programme },
  { id: 'orbite',     name: 'Mise en Orbite',            emoji: '💥', color: '#FF7A1E', component: Orbite },
]

// ─── Widget Programme ──────────────────────────────────────────────────────
function ProgrammeWidget({ onClick }) {
  const [nextEvent, setNextEvent] = useState(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    supabase.from('programme_events').select('*').order('event_date', { ascending: true })
      .then(({ data }) => {
        if (!data) { setLoaded(true); return }
        const today = new Date(); today.setHours(0, 0, 0, 0)
        const future = data.filter(e => {
          if (e.is_annual) return true
          const [y, m, d] = e.event_date.split('-').map(Number)
          return new Date(y, m - 1, d) >= today
        })
        future.sort((a, b) => getNextOccurrence(a) - getNextOccurrence(b))
        setNextEvent(future[0] || null)
        setLoaded(true)
      })
  }, [])

  if (!loaded || !nextEvent) return null
  const days = daysUntil(nextEvent)
  const isUrgent = days <= 3
  let countdownLabel
  if (days === 0) countdownLabel = "Aujourd'hui ! 🎉"
  else if (days === 1) countdownLabel = 'Demain'
  else if (days < 30) countdownLabel = `Dans ${days} j`
  else countdownLabel = `Dans ~${Math.round(days / 30)} mois`

  return (
    <button onClick={onClick}
      className={`flex-1 text-left rounded-2xl p-4 border flex items-center gap-3 transition-all active:scale-95 ${
        isUrgent ? 'bg-amber-50 border-amber-200 shadow-sm' : 'bg-white border-gray-100 shadow-sm'
      }`}>
      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 ${isUrgent ? 'bg-amber-100' : 'bg-violet-50'}`}>
        {nextEvent.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400">Prochain événement</p>
        <p className="font-bold text-gray-900 text-sm truncate">{nextEvent.title}</p>
      </div>
      <span className={`text-xs font-bold px-2 py-1 rounded-full flex-shrink-0 ${
        isUrgent ? 'bg-amber-200 text-amber-700' : 'bg-violet-100 text-violet-600'
      } ${days === 0 ? 'animate-pulse' : ''}`}>
        {countdownLabel}
      </span>
    </button>
  )
}

// ─── Widget Orbite : jauge verticale bicolore ──────────────────────────────
function OrbiteWidget({ profile, onClick }) {
  const [data, setData] = useState(null)

  useEffect(() => {
    if (!profile) return
    const now = new Date()
    const day = now.getDay()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - day + (day === 0 ? -6 : 1))
    weekStart.setHours(0, 0, 0, 0)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)

    Promise.all([
      supabase.from('orbite_activities').select('profile_id, props')
        .gte('created_at', weekStart.toISOString())
        .lte('created_at', weekEnd.toISOString()),
      supabase.from('profiles').select('*'),
      supabase.from('orbite_settings').select('weekly_rocket_target').eq('profile_id', profile.id).maybeSingle(),
    ]).then(([actsRes, profilesRes, settingsRes]) => {
      const acts = actsRes.data || []
      const profiles = profilesRes.data || []
      const target = settingsRes.data?.weekly_rocket_target || 10000
      const propsByProfile = {}
      acts.forEach(a => {
        propsByProfile[a.profile_id] = (propsByProfile[a.profile_id] || 0) + a.props
      })
      const total = Object.values(propsByProfile).reduce((s, v) => s + v, 0)
      const myProps = propsByProfile[profile.id] || 0
      const other = profiles.find(p => p.id !== profile.id)
      const otherProps = other ? (propsByProfile[other.id] || 0) : 0
      setData({ myProps, otherProps, total, other, target, launched: total >= target })
    })
  }, [profile])

  if (!data || (data.myProps === 0 && data.otherProps === 0)) return null

  const totalPct = Math.min(data.total / data.target, 1)
  const myShare = data.total > 0 ? data.myProps / data.total : 0.5

  return (
    <button
      onClick={onClick}
      className="active:scale-95 transition-all flex-shrink-0"
      style={{
        width: 52,
        borderRadius: 16,
        background: 'linear-gradient(180deg, #0d1320, #0a0e18)',
        border: '1px solid rgba(255,122,30,0.25)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '10px 0 8px',
        gap: 5,
        boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
      }}
    >
      {/* Emoji état */}
      <span style={{ fontSize: 15 }}>{data.launched ? '💥' : '🚀'}</span>

      {/* Jauge verticale bicolore */}
      <div style={{
        flex: 1,
        width: 18,
        borderRadius: 99,
        background: 'rgba(255,255,255,0.07)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        minHeight: 90,
      }}>
        {totalPct > 0 && (
          <div style={{ width: '100%', height: `${totalPct * 100}%`, display: 'flex', flexDirection: 'column' }}>
            {/* Orange (moi) — en haut */}
            <div style={{
              flex: myShare,
              background: 'linear-gradient(180deg, #ffb34d, #ff7a1e)',
            }} />
            {/* Bleu (autre) — en bas */}
            {data.other && (
              <div style={{
                flex: 1 - myShare,
                background: 'linear-gradient(180deg, #6aa8ff, #4a8cff)',
              }} />
            )}
          </div>
        )}
      </div>

      {/* % */}
      <span style={{
        fontFamily: 'monospace',
        fontSize: 9,
        fontWeight: 700,
        color: data.launched ? '#ff7a1e' : 'rgba(255,255,255,0.35)',
      }}>
        {Math.round(totalPct * 100)}%
      </span>

      {/* Avatars + pastille couleur */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ff7a1e', flexShrink: 0 }} />
          <span style={{ fontSize: 11 }}>{profile.avatar}</span>
        </div>
        {data.other && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4a8cff', flexShrink: 0 }} />
            <span style={{ fontSize: 11 }}>{data.other.avatar}</span>
          </div>
        )}
      </div>
    </button>
  )
}

// ─── App principale ────────────────────────────────────────────────────────
export default function App() {
  const [activeApp, setActiveApp] = useState(null)
  const [profiles, setProfiles] = useState([])
  const [profile, setProfile] = useState(null)
  const [screen, setScreen] = useState('profiles')
  const [bisouBadge, setBisouBadge] = useState(false)
  const [programmeHasEvent, setProgrammeHasEvent] = useState(false)
  const [orbiteHasData, setOrbiteHasData] = useState(false)

  useEffect(() => {
    supabase.from('profiles').select('*').then(({ data }) => {
      setProfiles(data || [])
      const saved = localStorage.getItem('flashcard-profile')
      if (saved) {
        const p = (data || []).find(p => p.id === saved)
        if (p) { setProfile(p); setScreen('hub') }
      }
    })
  }, [])

  useEffect(() => {
    if (!profile) return
    supabase.from('bisou_messages').select('created_at, profile_id')
      .order('created_at', { ascending: false }).limit(1)
      .then(({ data }) => {
        if (!data?.length) return
        const last = data[0]
        if (last.profile_id === profile.id) return
        const seen = localStorage.getItem(`bisou-last-seen-${profile.id}`)
        if (!seen || new Date(last.created_at) > new Date(seen)) setBisouBadge(true)
      })
  }, [profile])

  useEffect(() => {
    supabase.from('programme_events').select('id').limit(1)
      .then(({ data }) => setProgrammeHasEvent(!!(data?.length)))
  }, [])

  useEffect(() => {
    const now = new Date()
    const day = now.getDay()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - day + (day === 0 ? -6 : 1))
    weekStart.setHours(0, 0, 0, 0)
    supabase.from('orbite_activities').select('id').gte('created_at', weekStart.toISOString()).limit(1)
      .then(({ data }) => setOrbiteHasData(!!(data?.length)))
  }, [])

  const selectProfile = (p) => {
    setProfile(p)
    localStorage.setItem('flashcard-profile', p.id)
    setScreen('hub')
  }

  if (activeApp) {
    const app = APPS.find(a => a.id === activeApp)
    const Component = app.component
    return (
      <div className="h-screen flex flex-col overflow-hidden">
        <div className="bg-white border-b border-gray-100 px-5 py-3 flex items-center justify-between flex-shrink-0">
          <button onClick={() => setActiveApp(null)}
            className="w-9 h-9 flex items-center justify-center bg-gray-100 rounded-xl text-gray-500 hover:text-gray-900 active:scale-95 transition-all">
            🏠
          </button>
          <div className="text-center">
            <p className="text-sm font-bold text-gray-900">{app.emoji} {app.name}</p>
            <p className="text-xs text-gray-400">{profile?.avatar} {profile?.name}</p>
          </div>
          <div className="w-9" />
        </div>
        <div className="flex-1 overflow-y-auto">
          <Component profile={profile} onSeen={activeApp === 'bisou' ? () => setBisouBadge(false) : undefined} />
        </div>
      </div>
    )
  }

  if (screen === 'profiles') return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6">
      <div className="text-5xl mb-4">🏠</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Mes Apps</h1>
      <p className="text-gray-400 text-sm mb-10">Qui est-ce ?</p>
      <div className="w-full max-w-xs space-y-3">
        {profiles.map(p => (
          <button key={p.id} onClick={() => selectProfile(p)}
            className="w-full bg-white rounded-2xl p-4 border border-gray-100 flex items-center gap-4 shadow-sm active:scale-95 transition-transform">
            <span className="text-3xl">{p.avatar}</span>
            <span className="font-semibold text-gray-900 text-lg">{p.name}</span>
          </button>
        ))}
      </div>
    </div>
  )

  // ─── HUB ──────────────────────────────────────────────────────────────────
  const showWidgetRow = programmeHasEvent || bisouBadge

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 px-5 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">🏠 Mes Apps</h1>
            <p className="text-xs text-gray-400">{profile?.avatar} {profile?.name}</p>
          </div>
          <button onClick={() => { setProfile(null); setScreen('profiles') }}
            className="text-xs text-gray-400 hover:text-gray-700 transition-colors">
            Changer
          </button>
        </div>
      </div>

      <div className="px-5 py-6 max-w-lg mx-auto space-y-4">

        {/* Ligne widgets Bisou + Programme */}
        {showWidgetRow && (
          <div className="flex items-stretch gap-3">
            {bisouBadge && (
              <button onClick={() => setActiveApp('bisou')}
                className="w-14 flex-shrink-0 bg-white border border-pink-200 rounded-2xl flex items-center justify-center shadow-sm active:scale-95 transition-transform">
                <span className="text-2xl animate-pulse">💗</span>
              </button>
            )}
            <ProgrammeWidget onClick={() => setActiveApp('programme')} />
          </div>
        )}

        {/* Grille apps + jauge Orbite en colonne DROITE */}
        <div className="flex gap-3 items-stretch">

          {/* Grille 2 ou 3 colonnes selon présence jauge */}
          <div className={`flex-1 grid gap-3 ${orbiteHasData ? 'grid-cols-2' : 'grid-cols-3'}`}>
            {APPS.map(app => (
              <button key={app.id} onClick={() => setActiveApp(app.id)}
                className="relative bg-white rounded-2xl p-4 border border-gray-100 text-center shadow-sm active:scale-95 transition-transform flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl"
                  style={{ background: app.color + '18' }}>
                  {app.emoji}
                </div>
                <p className="font-semibold text-gray-800 text-xs leading-tight">{app.name}</p>
                {/* Pastille couleur de l'app sous le nom */}
                <span style={{
                  width: 16, height: 4, borderRadius: 99,
                  background: app.color, opacity: 0.5, flexShrink: 0
                }} />
                {app.id === 'bisou' && bisouBadge && (
                  <span className="absolute top-2 right-2 w-3 h-3 bg-pink-500 rounded-full animate-pulse" />
                )}
              </button>
            ))}
          </div>

          {/* Jauge Orbite verticale — colonne droite */}
          {orbiteHasData && (
            <OrbiteWidget profile={profile} onClick={() => setActiveApp('orbite')} />
          )}

        </div>
      </div>
    </div>
  )
}