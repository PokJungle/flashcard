import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Flashcards from './apps/Flashcards/index.jsx'
import Meteo from './apps/Meteo/index.jsx'
import Grimoire from './apps/Grimoire/index.jsx'
import Bisou from './apps/Bisou/index.jsx'
import Programme from './apps/Programme/index.jsx'
import Orbite from './apps/Orbite/index.jsx'
import Traine from './apps/Traine/index.jsx'

import { useDarkMode } from './hooks/useDarkMode'
import MeteoWidget, { getPreferredCity } from './components/widgets/MeteoWidget'
import BisouWidget from './components/widgets/BisouWidget'
import CoursesWidget from './components/widgets/CoursesWidget'
import AgendaWidget from './components/widgets/AgendaWidget'
import OrbiteWidget from './components/widgets/OrbiteWidget'
import MemoireWidget from './components/widgets/MemoireWidget'
import TraineWidget from './components/widgets/TraineWidget'
import { FETES, isFeteSpeciale, getFeteIcon } from './data/saints'

const APPS = [
  { id:'flashcards', name:'Mémoire de Singe',         emoji:'🐒', color:'#6A9BCC', component:Flashcards },
  { id:'meteo',      name:'Parapluie ou Claquettes ?', emoji:'🌦️', color:'#4CAF82', component:Meteo },
  { id:'recettes',   name:'Le Grimoire Gourmand',      emoji:'📖', color:'#E67E22', component:Grimoire },
  { id:'bisou',      name:'Bisou',                     emoji:'💌', color:'#E91E8C', component:Bisou },
  { id:'programme',  name:'Demandez le Programme !',   emoji:'🗞️', color:'#8B5CF6', component:Programme },
  { id:'orbite',     name:'Mise en Orbite',            emoji:'💥', color:'#FF7A1E', component:Orbite },
  { id:'traine',     name:'Ça Traîne',                 emoji:'🐌', color:'#10b981', component:Traine },
]
const HUB_APPS   = APPS.filter(a => a.id !== 'bisou')
const HUB_LABELS = { flashcards:'Mémoire', meteo:'Météo', recettes:'Grimoire', programme:'Programme', orbite:'Orbite', traine:'Traîne' }
const HUB_SUBLABELS = { flashcards:'Révisions', meteo:'Parapluie ?', recettes:'Recettes', programme:'Agenda', orbite:'Sport', traine:'Todos' }
const APPS_EN_PREP = [
  { emoji:'🍵', name:'Tisane & Chauffeuse' },
  { emoji:'🎸', name:'Jukebox' },
  { emoji:'👣', name:'Nos Empreintes' },
  { emoji:'💧', name:'Arrose-moi' },
  { emoji:'🌙', name:'Parenthèse' },
]

// ─── DarkToggle ───────────────────────────────────────────────────────────────
function DarkToggle({ dark, toggle }) {
  return (
    <button
      onClick={toggle}
      className="w-9 h-9 flex items-center justify-center rounded-xl active:scale-95 transition-all text-base"
      style={{ background: dark ? '#312e81' : '#f5f0ff', border: dark ? '1.5px solid #4338ca' : '1.5px solid #e9d5ff' }}
      title={dark ? 'Mode lumineux' : 'Mode sombre'}
    >
      {dark ? '☀️' : '🌙'}
    </button>
  )
}

// ─── CityPicker ───────────────────────────────────────────────────────────────
function CityPicker({ profileId, onClose, dark }) {
  const [favorites, setFavorites]     = useState([])
  const [selectedLat, setSelectedLat] = useState(null)

  useEffect(() => {
    let favs = [{ name:'Saint-Antonin-sur-Bayon', lat:43.5308, lon:5.6078, country:'FR' }]
    try {
      const stored = JSON.parse(localStorage.getItem('meteo-fav2') || 'null')
      if (stored?.length) favs = stored
    } catch { /* ignore */ }
    setFavorites(favs)
    setSelectedLat(getPreferredCity(profileId).lat)
  }, [profileId])

  const save = (city) => {
    localStorage.setItem(`bbp-meteo-city-${profileId}`, JSON.stringify(city))
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background:'rgba(20,10,40,0.5)' }} onClick={onClose}>
      <div className="w-full max-w-lg p-5 pb-8 rounded-t-3xl"
        style={{ background: dark ? '#1e1b4b' : '#fff' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium" style={{ color: dark ? '#c4b5fd' : '#1e0a3c' }}>🌦️ Ville météo du widget</p>
          <button onClick={onClose} className="text-lg leading-none" style={{ color:'#a78bfa' }}>✕</button>
        </div>
        <p className="text-[11px] mb-3" style={{ color:'#9ca3af' }}>
          Parmi tes favoris dans l'app Météo · préférence sauvegardée par profil
        </p>
        <div className="space-y-2">
          {favorites.map((city, i) => {
            const active = city.lat === selectedLat
            return (
              <button key={i} onClick={() => save(city)}
                className="w-full flex items-center justify-between rounded-xl px-4 py-3 text-left"
                style={{
                  border: active ? '1.5px solid #7c3aed' : `0.5px solid ${dark ? '#4338ca' : '#e9d5ff'}`,
                  background: active ? (dark ? '#312e81' : '#faf5ff') : (dark ? '#1e1b4b' : '#fff')
                }}>
                <span className="text-sm font-medium" style={{ color: dark ? '#e9d5ff' : '#1e0a3c' }}>{city.name.split(',')[0]}</span>
                {active && <span style={{ color:'#7c3aed' }}>✓</span>}
              </button>
            )
          })}
        </div>
        <p className="text-[11px] mt-4 text-center" style={{ color:'#c4b5fd' }}>
          Pour ajouter une ville, ouvre l'app Météo
        </p>
      </div>
    </div>
  )
}

// ─── Composant entête date + fête ─────────────────────────────────────────────
function DayHeader({ profile, dark }) {
  const [fete, setFete] = useState(null)

  useEffect(() => {
    const now = new Date()
    const key = `${now.getDate()}/${now.getMonth()+1}`
    const name = FETES[key]
    if (name) setFete(name)
  }, [])

  const now       = new Date()
  const dateStr   = now.toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' })
  const dateLabel = dateStr.charAt(0).toUpperCase() + dateStr.slice(1)
  const hour      = now.getHours()
  const greeting  = hour < 6 ? 'Bonne nuit' : hour < 12 ? 'Bonjour' : hour < 18 ? 'Bonne après-midi' : 'Bonsoir'

  return (
    <div className="max-w-lg mx-auto px-3 pt-2 pb-1 text-center">
      <p className="text-[16px] font-medium" style={{ color: dark ? '#e9d5ff' : '#1e0a3c' }}>
        {greeting} {profile?.avatar}
      </p>
      <p className="text-[12px] mt-0.5" style={{ color:'#7c3aed' }}>
        {dateLabel}
      </p>
      {fete && (
        isFeteSpeciale(fete) ? (
          <div style={{ margin:'4px 0 0', background:'linear-gradient(135deg,#b45309,#d97706,#f59e0b)', padding:'8px 14px', borderRadius:12, position:'relative', overflow:'hidden' }}>
            <span style={{ position:'absolute', top:11, left:18, width:5, height:5, borderRadius:'50%', background:'#fef08a', display:'block', animation:'bbp-float1 1.4s ease-in-out infinite 0.7s' }} />
            <span style={{ position:'absolute', top:11, right:73, width:5, height:5, borderRadius:'50%', background:'#bfdbfe', display:'block', animation:'bbp-float1 1.2s ease-in-out infinite 0.2s' }} />
            <span style={{ position:'absolute', top:9, left:81, width:5, height:5, borderRadius:2, background:'#bfdbfe', display:'block', animation:'bbp-float3 1.8s ease-in-out infinite 0.5s' }} />
            <span style={{ position:'absolute', top:4, right:61, width:9, height:9, borderRadius:2, background:'#6ee7b7', display:'block', animation:'bbp-float1 1.9s ease-in-out infinite 0.3s' }} />
            <span style={{ position:'absolute', top:3, left:31, width:7, height:7, borderRadius:2, background:'#fff', display:'block', animation:'bbp-float2 1.3s ease-in-out infinite 0.8s' }} />
            <span style={{ position:'absolute', top:10, right:37, width:5, height:5, borderRadius:'50%', background:'#fef08a', display:'block', animation:'bbp-float3 1.3s ease-in-out infinite 0.9s' }} />
            <span style={{ position:'absolute', top:2, left:74, width:7, height:7, borderRadius:'50%', background:'#fef08a', display:'block', animation:'bbp-float3 1.4s ease-in-out infinite 0.1s' }} />
            <span style={{ position:'absolute', top:11, right:33, width:7, height:7, borderRadius:2, background:'#fff', display:'block', animation:'bbp-float1 1.6s ease-in-out infinite 0.5s' }} />
            <span style={{ position:'absolute', top:6, left:24, width:7, height:7, borderRadius:2, background:'#6ee7b7', display:'block', animation:'bbp-float3 1.5s ease-in-out infinite 0.9s' }} />
            <span style={{ position:'absolute', top:11, right:13, width:9, height:9, borderRadius:2, background:'#fef08a', display:'block', animation:'bbp-float3 1.9s ease-in-out infinite 0.2s' }} />
            <span style={{ position:'absolute', top:7, left:38, width:9, height:9, borderRadius:'50%', background:'#fce7f3', display:'block', animation:'bbp-float1 1.4s ease-in-out infinite' }} />
            <span style={{ position:'absolute', top:6, right:55, width:7, height:7, borderRadius:2, background:'#fff', display:'block', animation:'bbp-float3 2.1s ease-in-out infinite 0.3s' }} />
            <span style={{ position:'absolute', top:11, left:67, width:8, height:8, borderRadius:'50%', background:'#fef08a', display:'block', animation:'bbp-float1 1.5s ease-in-out infinite 0.2s' }} />
            <span style={{ position:'absolute', top:9, right:72, width:7, height:7, borderRadius:'50%', background:'#fef08a', display:'block', animation:'bbp-float3 1.6s ease-in-out infinite 0.2s' }} />
            <span style={{ position:'absolute', top:3, left:69, width:8, height:8, borderRadius:2, background:'#fff', display:'block', animation:'bbp-float1 1.4s ease-in-out infinite 0.2s' }} />
            <span style={{ position:'absolute', top:11, right:58, width:9, height:9, borderRadius:'50%', background:'#fff', display:'block', animation:'bbp-float2 1.8s ease-in-out infinite 0.5s' }} />
            <span style={{ position:'absolute', top:5, left:74, width:5, height:5, borderRadius:2, background:'#fef08a', display:'block', animation:'bbp-float3 2.1s ease-in-out infinite 0.8s' }} />
            <span style={{ position:'absolute', top:11, right:47, width:5, height:5, borderRadius:'50%', background:'#6ee7b7', display:'block', animation:'bbp-float1 1.7s ease-in-out infinite 1.0s' }} />
            <span style={{ position:'absolute', bottom:6, left:68, width:6, height:6, borderRadius:2, background:'#bfdbfe', display:'block', animation:'bbp-float3 1.5s ease-in-out infinite 0.6s' }} />
            <span style={{ position:'absolute', bottom:5, right:23, width:7, height:7, borderRadius:2, background:'#fce7f3', display:'block', animation:'bbp-float3 1.5s ease-in-out infinite' }} />
            <span style={{ position:'absolute', bottom:7, left:43, width:6, height:6, borderRadius:2, background:'#fff', display:'block', animation:'bbp-float3 2.1s ease-in-out infinite 0.1s' }} />
            <span style={{ position:'absolute', bottom:9, right:12, width:9, height:9, borderRadius:2, background:'#fce7f3', display:'block', animation:'bbp-float3 1.7s ease-in-out infinite 0.5s' }} />
            <span style={{ position:'absolute', bottom:6, left:71, width:9, height:9, borderRadius:2, background:'#c4b5fd', display:'block', animation:'bbp-float3 2.0s ease-in-out infinite 0.7s' }} />
            <span style={{ position:'absolute', bottom:6, right:55, width:7, height:7, borderRadius:'50%', background:'#c4b5fd', display:'block', animation:'bbp-float1 1.4s ease-in-out infinite 0.1s' }} />
            <span style={{ position:'absolute', bottom:2, left:79, width:9, height:9, borderRadius:2, background:'#fce7f3', display:'block', animation:'bbp-float1 1.3s ease-in-out infinite 0.6s' }} />
            <span style={{ position:'absolute', bottom:5, right:12, width:5, height:5, borderRadius:2, background:'#6ee7b7', display:'block', animation:'bbp-float3 1.4s ease-in-out infinite 0.7s' }} />
            <span style={{ position:'absolute', bottom:5, left:73, width:6, height:6, borderRadius:'50%', background:'#fef08a', display:'block', animation:'bbp-float1 2.0s ease-in-out infinite 0.8s' }} />
            <span style={{ position:'absolute', bottom:5, right:16, width:5, height:5, borderRadius:'50%', background:'#fef08a', display:'block', animation:'bbp-float2 1.6s ease-in-out infinite 0.5s' }} />
            <span style={{ position:'absolute', bottom:2, left:90, width:5, height:5, borderRadius:'50%', background:'#fff', display:'block', animation:'bbp-float3 1.5s ease-in-out infinite 0.9s' }} />
            <span style={{ position:'absolute', bottom:5, right:28, width:6, height:6, borderRadius:'50%', background:'#bfdbfe', display:'block', animation:'bbp-float1 1.6s ease-in-out infinite 0.3s' }} />
            <span style={{ position:'absolute', bottom:5, left:13, width:8, height:8, borderRadius:2, background:'#bfdbfe', display:'block', animation:'bbp-float1 1.9s ease-in-out infinite 0.5s' }} />
            <span style={{ position:'absolute', bottom:2, right:15, width:6, height:6, borderRadius:'50%', background:'#fce7f3', display:'block', animation:'bbp-float2 1.7s ease-in-out infinite 0.9s' }} />
            <span style={{ position:'absolute', bottom:2, left:25, width:8, height:8, borderRadius:'50%', background:'#fff', display:'block', animation:'bbp-float2 2.1s ease-in-out infinite 0.8s' }} />
            <span style={{ position:'absolute', bottom:6, right:58, width:9, height:9, borderRadius:'50%', background:'#fef08a', display:'block', animation:'bbp-float1 1.4s ease-in-out infinite 0.2s' }} />
            <span style={{ position:'absolute', bottom:2, left:78, width:9, height:9, borderRadius:'50%', background:'#fff', display:'block', animation:'bbp-float1 1.3s ease-in-out infinite 0.5s' }} />
            <span style={{ position:'absolute', bottom:10, right:24, width:5, height:5, borderRadius:2, background:'#bfdbfe', display:'block', animation:'bbp-float1 1.3s ease-in-out infinite 0.1s' }} />
            <p style={{ color:'#fff', fontSize:15, fontWeight:600, margin:0, position:'relative', textShadow:'0 1px 3px rgba(0,0,0,0.3)' }}>
              {getFeteIcon(fete)} Fête de {fete} !
            </p>
            <style>{`
              @keyframes bbp-float1 { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-7px) rotate(12deg)} }
              @keyframes bbp-float2 { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-10px) rotate(-18deg)} }
              @keyframes bbp-float3 { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-6px) rotate(25deg)} }
            `}</style>
          </div>
        ) : (
          <p className="text-[10px] mt-0.5" style={{ color:'#c4b5fd' }}>
            Fête des {fete}
          </p>
        )
      )}
    </div>
  )
}

// ─── App principale ───────────────────────────────────────────────────────────
export default function App() {
  const { dark, toggle }                    = useDarkMode()
  const [activeApp, setActiveApp]           = useState(null)
  const [activeAppProps, setActiveAppProps] = useState({})
  const [profiles, setProfiles]             = useState([])
  const [profile, setProfile]               = useState(null)
  const [screen, setScreen]                 = useState('profiles')
  const [bisouBadge, setBisouBadge]         = useState(false)
  const [showCityPicker, setShowCityPicker] = useState(false)
  const [meteoKey, setMeteoKey]             = useState(0)

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
      .neq('profile_id', profile.id)
      .order('created_at', { ascending:false }).limit(1)
      .then(({ data }) => {
        if (!data?.length) return
        const seen = localStorage.getItem(`bisou-last-seen-${profile.id}`)
        if (!seen || new Date(data[0].created_at) > new Date(seen)) setBisouBadge(true)
      })
  }, [profile])

  const selectProfile = (p) => {
    setProfile(p); localStorage.setItem('flashcard-profile', p.id); setScreen('hub')
  }

  const openApp = (id, props = {}) => { setActiveAppProps(props); setActiveApp(id) }
  const openMeteo = () => openApp('meteo', { initialCity: getPreferredCity(profile?.id) })

  // ─── App active ───────────────────────────────────────────────────────────
  if (activeApp) {
    const app = APPS.find(a => a.id === activeApp)
    const Component = app.component
    return (
      <div className="h-screen flex flex-col overflow-hidden" style={{ background: dark ? '#0f0a1e' : '#fff' }}>
        <div className="px-5 py-3 flex items-center justify-between flex-shrink-0"
          style={{
            background: dark ? '#1a1035' : '#fff',
            borderBottom: `0.5px solid ${dark ? '#2d1f5e' : '#ede9fe'}`
          }}>
          <button onClick={() => { setActiveApp(null); setActiveAppProps({}) }}
            className="w-9 h-9 flex items-center justify-center rounded-xl active:scale-95 transition-all"
            style={{ background: dark ? '#2d1f5e' : '#f5f0ff', border: `1.5px solid ${dark ? '#4338ca' : '#e9d5ff'}` }}>
            🏠
          </button>
          <div className="text-center">
            <p className="text-sm font-bold" style={{ color: dark ? '#e9d5ff' : '#1e0a3c' }}>{app.emoji} {app.name}</p>
            <p className="text-xs" style={{ color: dark ? '#7c6aad' : '#a78bfa' }}>{profile?.avatar} {profile?.name}</p>
          </div>
          <DarkToggle dark={dark} toggle={toggle} />
        </div>
        <div className="flex-1 overflow-y-auto">
          <Component profile={profile} dark={dark}
            onSeen={activeApp === 'bisou' ? () => setBisouBadge(false) : undefined}
            {...activeAppProps} />
        </div>
      </div>
    )
  }

  // ─── PROFILS ──────────────────────────────────────────────────────────────
  if (screen === 'profiles') return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: dark ? '#0f0a1e' : '#f5f0ff' }}>
      <p className="text-4xl mb-3">🐆</p>
      <h1 className="text-2xl font-medium mb-1" style={{ color: dark ? '#e9d5ff' : '#1e0a3c' }}>
        B<span style={{ color:'#7c3aed' }}>B</span>P
      </h1>
      <p className="text-sm mb-10" style={{ color:'#a78bfa' }}>Qui est-ce ?</p>
      <div className="w-full max-w-xs space-y-3">
        {profiles.map(p => (
          <button key={p.id} onClick={() => selectProfile(p)}
            className="w-full rounded-2xl p-4 flex items-center gap-4 active:scale-95 transition-transform"
            style={{
              background: dark ? '#1a1035' : '#fff',
              border: `0.5px solid ${dark ? '#4338ca' : '#ede9fe'}`
            }}>
            <span className="text-3xl">{p.avatar}</span>
            <span className="font-medium text-lg" style={{ color: dark ? '#e9d5ff' : '#1e0a3c' }}>{p.name}</span>
          </button>
        ))}
      </div>
      <div className="mt-8">
        <DarkToggle dark={dark} toggle={toggle} />
      </div>
    </div>
  )

  // ─── HUB ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ background: dark ? '#0f0a1e' : '#f5f0ff' }}>

      {showCityPicker && (
        <CityPicker profileId={profile?.id} dark={dark}
          onClose={() => { setShowCityPicker(false); setMeteoKey(k => k+1) }} />
      )}

      <div className="sticky top-0 z-10 px-3.5 py-2 flex items-center justify-between"
        style={{
          background: dark ? '#1a1035' : '#fff',
          borderBottom: `0.5px solid ${dark ? '#2d1f5e' : '#ede9fe'}`
        }}>
        <p className="text-[19px] font-medium" style={{ color: dark ? '#e9d5ff' : '#1e0a3c', letterSpacing:-0.5 }}>
          B<span style={{ color:'#7c3aed' }}>B</span>P 🐆
        </p>
        <div className="flex items-center gap-2">
          <DarkToggle dark={dark} toggle={toggle} />
          <button onClick={() => { setProfile(null); setScreen('profiles') }}
            className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-base active:scale-95 transition-all"
            style={{
              background: dark ? '#2d1f5e' : '#f5f0ff',
              border: `1.5px solid ${dark ? '#4338ca' : '#e9d5ff'}`
            }}>
            {profile?.avatar}
          </button>
        </div>
      </div>

      <DayHeader profile={profile} dark={dark} />

      <div className="px-3 pt-1.5 pb-8 max-w-lg mx-auto space-y-2">

        {/* Hero — Agenda */}
        <AgendaWidget onClick={() => openApp('programme')} dark={dark} />

        {/* Météo + Bisou */}
        <div className="flex gap-2 items-stretch">
          <MeteoWidget key={meteoKey} profileId={profile?.id}
            onOpenCityPicker={() => setShowCityPicker(true)} onClick={openMeteo} />
          <BisouWidget profile={profile} hasBadge={bisouBadge} dark={dark}
            onClick={() => openApp('bisou')} />
        </div>

        {/* Mémoire */}
        <MemoireWidget profile={profile} dark={dark} onClick={() => openApp('flashcards')} />

        {/* Courses + Ça Traîne */}
        <div className="flex gap-2 items-stretch">
          <CoursesWidget profileId={profile?.id} dark={dark}
            onClick={() => openApp('recettes', { initialShoppingList: true })} />
          <TraineWidget profile={profile} dark={dark} onClick={() => openApp('traine')} />
        </div>

        {/* Orbite */}
        <OrbiteWidget profile={profile} dark={dark} onClick={() => openApp('orbite')} />

        {/* Apps */}
        <p className="text-[11px] uppercase tracking-widest pt-2" style={{ color:'#a78bfa' }}>
          Applications
        </p>
        <div className="grid grid-cols-3 gap-2">
          {HUB_APPS.map(app => (
            <button key={app.id}
              onClick={() => app.id === 'meteo' ? openMeteo() : openApp(app.id)}
              className="rounded-2xl py-3 px-2 flex flex-col items-center gap-1.5 active:scale-95 transition-all"
              style={{
                background: dark ? '#1a1035' : '#fff',
                border: `0.5px solid ${dark ? '#2d1f5e' : '#ede9fe'}`
              }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                style={{ background: app.color + '18' }}>
                {app.emoji}
              </div>
              <p className="text-[11px] font-semibold text-center leading-tight"
                style={{ color: dark ? '#e9d5ff' : '#1e0a3c' }}>
                {HUB_LABELS[app.id] ?? app.name}
              </p>
              <p className="text-[10px] text-center leading-tight"
                style={{ color: app.color }}>
                {HUB_SUBLABELS[app.id]}
              </p>
            </button>
          ))}
        </div>

        {/* En préparation */}
        <p className="text-[11px] uppercase tracking-widest pt-2" style={{ color:'#a78bfa' }}>
          En préparation
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {APPS_EN_PREP.map(a => (
            <div key={a.name} className="flex items-center gap-2 rounded-xl px-3 py-2"
              style={{
                background: dark ? 'rgba(167,139,250,0.08)' : 'rgba(167,139,250,0.06)',
                border: `0.5px dashed ${dark ? '#4338ca' : '#d8b4fe'}`
              }}>
              <span className="text-sm">{a.emoji}</span>
              <span className="text-[11px]" style={{ color:'#c4b5fd' }}>{a.name}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
