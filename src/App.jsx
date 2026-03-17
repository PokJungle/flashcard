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
  {
    id: 'flashcards',
    name: 'Mémoire de Singe',
    emoji: '🐒',
    color: '#6A9BCC',
    component: Flashcards,
  },
  {
    id: 'meteo',
    name: 'Parapluie ou Claquettes ?',
    emoji: '🌦️',
    color: '#4CAF82',
    component: Meteo,
  },
  {
    id: 'recettes',
    name: 'Le Grimoire Gourmand',
    emoji: '📖',
    color: '#E67E22',
    component: Grimoire,
  },
  {
    id: 'bisou',
    name: 'Bisou',
    emoji: '💌',
    color: '#E91E8C',
    component: Bisou,
  },
  {
    id: 'programme',
    name: 'Demandez le Programme !',
    emoji: '🗞️',
    color: '#8B5CF6',
    component: Programme,
  },
  {
    id: 'orbite',
    name: 'Mise en Orbite',
    emoji: '💥',
    color: '#FF7A1E',
    component: Orbite,
  },
]

// ─── Widget Programme ──────────────────────────────────────────────────────
function ProgrammeWidget({ onClick }) {
  const [nextEvent, setNextEvent] = useState(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    supabase
      .from('programme_events')
      .select('*')
      .order('event_date', { ascending: true })
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
    <button
      onClick={onClick}
      className={`flex-1 text-left rounded-2xl p-4 border flex items-center gap-3 transition-all active:scale-95 ${
        isUrgent ? 'bg-amber-50 border-amber-200 shadow-sm' : 'bg-white border-gray-100 shadow-sm'
      }`}
    >
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

// ─── Widget Orbite ─────────────────────────────────────────────────────────
function OrbiteWidget({ profile, onClick }) {
  const [data, setData] = useState(null)

  useEffect(() => {
    if (!profile) return

    const now = new Date()
    const day = now.getDay()
    const diff = now.getDate() - day + (day === 0 ? -6 : 1)
    const weekStart = new Date(now)
    weekStart.setDate(diff)
    weekStart.setHours(0, 0, 0, 0)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)

    Promise.all([
      supabase.from('orbite_activities').select('profile_id, props')
        .gte('created_at', weekStart.toISOString())
        .lte('created_at', weekEnd.toISOString()),
      supabase.from('profiles').select('*'),
    ]).then(([actsRes, profilesRes]) => {
      const acts = actsRes.data || []
      const profiles = profilesRes.data || []
      const propsByProfile = {}
      acts.forEach(a => {
        propsByProfile[a.profile_id] = (propsByProfile[a.profile_id] || 0) + a.props
      })
      const total = Object.values(propsByProfile).reduce((s, v) => s + v, 0)
      const myProps = propsByProfile[profile.id] || 0
      const other = profiles.find(p => p.id !== profile.id)
      const otherProps = other ? (propsByProfile[other.id] || 0) : 0
      setData({ myProps, otherProps, total, other, rocketPct: Math.min(total / 10000 * 100, 100) })
    })
  }, [profile])

  if (!data || (data.myProps === 0 && data.otherProps === 0)) return null

  const maxProps = Math.max(data.myProps, data.otherProps, 1)
  const myPct = Math.round(data.myProps / maxProps * 100)
  const otherPct = Math.round(data.otherProps / maxProps * 100)

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl border active:scale-95 transition-all overflow-hidden shadow-sm"
      style={{ background: 'linear-gradient(135deg, #0d1320, #0a0e18)', borderColor: 'rgba(255,122,30,0.2)' }}
    >
      {/* Header */}
      <div className="px-4 pt-3 pb-1 flex items-center justify-between">
        <span className="text-xs font-bold" style={{ fontFamily: 'monospace', color: '#ff7a1e', letterSpacing: '0.1em' }}>
          💥 MISE EN ORBITE
        </span>
        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>cette semaine</span>
      </div>

      {/* Barres face-à-face */}
      <div className="px-4 pb-2 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-base w-6 text-center flex-shrink-0">{profile.avatar}</span>
          <div className="flex-1 h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${myPct}%`, background: 'linear-gradient(90deg, #ff7a1e, #ffb34d)' }} />
          </div>
          <span className="text-xs w-16 text-right flex-shrink-0" style={{ fontFamily: 'monospace', color: '#ff7a1e' }}>
            {data.myProps.toLocaleString()}
          </span>
        </div>
        {data.other && (
          <div className="flex items-center gap-2">
            <span className="text-base w-6 text-center flex-shrink-0">{data.other.avatar}</span>
            <div className="flex-1 h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${otherPct}%`, background: 'linear-gradient(90deg, #4a8cff, #8ab4ff)' }} />
            </div>
            <span className="text-xs w-16 text-right flex-shrink-0" style={{ fontFamily: 'monospace', color: '#8ab4ff' }}>
              {data.otherProps.toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {/* Barre fusée mission */}
      <div className="px-4 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs flex-shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }}>🚀</span>
          <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${data.rocketPct}%`,
                background: 'linear-gradient(90deg, #ff4500, #ff7a1e)',
                boxShadow: data.rocketPct > 0 ? '0 0 6px rgba(255,122,30,0.5)' : 'none',
              }}
            />
          </div>
          <span className="text-xs flex-shrink-0" style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace' }}>
            {Math.round(data.rocketPct)}%
          </span>
        </div>
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

  // Badge Bisou
  useEffect(() => {
    if (!profile) return
    supabase
      .from('bisou_messages')
      .select('created_at, profile_id')
      .order('created_at', { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (!data?.length) return
        const last = data[0]
        if (last.profile_id === profile.id) return
        const seen = localStorage.getItem(`bisou-last-seen-${profile.id}`)
        if (!seen || new Date(last.created_at) > new Date(seen)) {
          setBisouBadge(true)
        }
      })
  }, [profile])

  // Programme a-t-il des events ?
  useEffect(() => {
    supabase.from('programme_events').select('id').limit(1)
      .then(({ data }) => setProgrammeHasEvent(!!(data?.length)))
  }, [])

  // Orbite a-t-il des activités cette semaine ?
  useEffect(() => {
    const now = new Date()
    const day = now.getDay()
    const diff = now.getDate() - day + (day === 0 ? -6 : 1)
    const weekStart = new Date(now)
    weekStart.setDate(diff)
    weekStart.setHours(0, 0, 0, 0)
    supabase.from('orbite_activities').select('id')
      .gte('created_at', weekStart.toISOString())
      .limit(1)
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
          <button
            onClick={() => setActiveApp(null)}
            className="w-9 h-9 flex items-center justify-center bg-gray-100 rounded-xl text-gray-500 hover:text-gray-900 active:scale-95 transition-all"
          >
            🏠
          </button>
          <div className="text-center">
            <p className="text-sm font-bold text-gray-900">{app.emoji} {app.name}</p>
            <p className="text-xs text-gray-400">{profile?.avatar} {profile?.name}</p>
          </div>
          <div className="w-9" />
        </div>
        <div className="flex-1 overflow-y-auto">
          <Component
            profile={profile}
            onSeen={activeApp === 'bisou' ? () => setBisouBadge(false) : undefined}
          />
        </div>
      </div>
    )
  }

  // ─── PROFILS ──────────────────────────────────────────────────────────────
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
          <button
            onClick={() => { setProfile(null); setScreen('profiles') }}
            className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
          >
            Changer
          </button>
        </div>
      </div>

      <div className="px-5 py-6 max-w-lg mx-auto space-y-4">

        {/* Ligne widgets Bisou + Programme */}
        {showWidgetRow && (
          <div className="flex items-stretch gap-3">
            {bisouBadge && (
              <button
                onClick={() => setActiveApp('bisou')}
                className="w-14 flex-shrink-0 bg-white border border-pink-200 rounded-2xl flex items-center justify-center shadow-sm active:scale-95 transition-transform"
              >
                <span className="text-2xl animate-pulse">💗</span>
              </button>
            )}
            <ProgrammeWidget onClick={() => setActiveApp('programme')} />
          </div>
        )}

        {/* Widget Orbite — visible dès qu'il y a des activités cette semaine */}
        {orbiteHasData && (
          <OrbiteWidget profile={profile} onClick={() => setActiveApp('orbite')} />
        )}

        {/* Grille 3 colonnes */}
        <div className="grid grid-cols-3 gap-3">
          {APPS.map(app => (
            <button key={app.id} onClick={() => setActiveApp(app.id)}
              className="relative bg-white rounded-2xl p-4 border border-gray-100 text-center shadow-sm active:scale-95 transition-transform flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                style={{ background: app.color + '18' }}>
                {app.emoji}
              </div>
              <p className="font-semibold text-gray-800 text-xs leading-tight">{app.name}</p>
              {app.id === 'bisou' && bisouBadge && (
                <span className="absolute top-2 right-2 w-3 h-3 bg-pink-500 rounded-full animate-pulse" />
              )}
            </button>
          ))}
        </div>

      </div>
    </div>
  )
}