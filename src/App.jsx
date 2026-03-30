import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import { daysUntil, isPast } from './apps/Programme/hooks/useProgramme'
import Flashcards from './apps/Flashcards/index.jsx'
import Meteo from './apps/Meteo/index.jsx'
import Grimoire from './apps/Grimoire/index.jsx'
import Bisou from './apps/Bisou/index.jsx'
import Programme from './apps/Programme/index.jsx'
import Orbite from './apps/Orbite/index.jsx'
import Traine from './apps/Traine/index.jsx'
import Canon from './apps/Canon/index.jsx'

import { useDarkMode } from './hooks/useDarkMode'
import { getPreferredCity as getPreferredCityFromUtils, fetchCurrentHourWeather } from './apps/Meteo/meteo.utils'
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
  { id:'canon',      name:'Canon',                     emoji:'🍷', color:'#9b1c1c', component:Canon },
]
const HUB_APPS = APPS.filter(a => a.id !== 'bisou')
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
    const loadFavorites = () => {
      let favs = [{ name:'Saint-Antonin-sur-Bayon', lat:43.5308, lon:5.6078, country:'FR' }]
      try {
        const stored = JSON.parse(localStorage.getItem('meteo-fav2') || 'null')
        if (stored?.length) favs = stored
      } catch { /* ignore */ }
      return favs
    }
    
    const favs = loadFavorites()
    const preferredCity = getPreferredCityFromUtils(profileId)
    
    // Utiliser setTimeout pour éviter les appels synchrones
    setTimeout(() => {
      setFavorites(favs)
      setSelectedLat(preferredCity.lat)
    }, 0)
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

// ─── Calendrier lunaire biodynamique ─────────────────────────────────────────
function getMoonDayType(date) {
  const J2000 = new Date('2000-01-01T12:00:00Z')
  const d = (date.getTime() - J2000.getTime()) / 86400000
  const Lraw = 218.316 + 13.176396 * d
  const Mrad = ((134.963 + 13.064993 * d) % 360) * Math.PI / 180
  let lon = Lraw + 6.289 * Math.sin(Mrad)
  lon = ((lon % 360) + 360) % 360
  const sign = Math.floor(lon / 30) % 12
  // Bélier=Fruit Taureau=Racine Gémeaux=Fleur Cancer=Feuille (cycle x3)
  const TYPES = [
    { type:'Fruit',  icon:'🍎', color:'#f97316' },
    { type:'Racine', icon:'🌱', color:'#a3a3a3' },
    { type:'Fleur',  icon:'🌸', color:'#ec4899' },
    { type:'Feuille',icon:'🍃', color:'#22c55e' },
  ]
  return TYPES[sign % 4]
}

// ─── Composant entête date + météo ───────────────────────────────────────────
const WMO_ICONS_HD = {0:'☀️',1:'🌤️',2:'⛅',3:'☁️',45:'🌫️',48:'🌫️',51:'🌦️',53:'🌦️',55:'🌧️',61:'🌧️',63:'🌧️',65:'🌧️',71:'🌨️',73:'🌨️',75:'❄️',80:'🌦️',81:'🌧️',82:'⛈️',95:'⛈️',96:'⛈️',99:'⛈️'}

function getConseilHD(code, wind) {
  const windy = wind != null && wind >= 40
  if (code == null) return null
  if ([95,96,99].includes(code)) return { icon:'☂️', text: windy ? 'Parapluie, mais franchement reste à la maison' : 'Parapluie + cirée + bottes' }
  if ([65,82].includes(code))    return { icon:'☂️', text: windy ? 'Parapluie retourné garanti' : "Parapluie solide, c'est sérieux" }
  if ([51,53,55,61,63,80,81].includes(code)) return { icon:'☂️', text: windy ? 'Parapluie… ou pas, il tiendra pas' : 'Petite pluie, petit parapluie' }
  if ([71,73,75].includes(code)) return { icon:'☂️', text: 'Ni claquettes ni parapluie, les raquettes !' }
  if ([45,48].includes(code))    return { icon:'🩴', text: 'Claquettes dans le brouillard, pourquoi pas' }
  if ([3].includes(code))        return { icon:'🩴', text: windy ? 'Claquettes risquées, parapluie de précaution' : 'Claquettes possibles, parapluie en veille' }
  if ([2].includes(code))        return { icon:'🩴', text: windy ? 'Claquettes, veste et cheveux en bataille' : 'Claquettes-Chausettes au cas où...' }
  if ([1].includes(code))        return { icon:'🩴', text: windy ? "Claquettes oui, mais attention qu'elles ne s'envolent pas" : 'Claquettes envisageables, belle journée !' }
  if ([0].includes(code))        return { icon:'🩴', text: windy ? 'Claquettes, soleil et vent dans les oreilles' : 'Claquettes et lunette de soleil, grande journée !' }
  if (windy)                     return { icon:'🩴', text: 'Claquettes ok mais accroche le parapluie' }
  return { icon:'🩴', text: 'Claquettes ou parapluie… va savoir' }
}

const CONFETTI_SPANS = [
  { t:11,l:18,w:5,h:5,r:'50%',bg:'#fef08a',a:'bbp-float1 1.4s ease-in-out infinite 0.7s' },
  { t:11,r2:73,w:5,h:5,r:'50%',bg:'#bfdbfe',a:'bbp-float1 1.2s ease-in-out infinite 0.2s' },
  { t:9,l:81,w:5,h:5,r:2,bg:'#bfdbfe',a:'bbp-float3 1.8s ease-in-out infinite 0.5s' },
  { t:4,r2:61,w:9,h:9,r:2,bg:'#6ee7b7',a:'bbp-float1 1.9s ease-in-out infinite 0.3s' },
  { t:3,l:31,w:7,h:7,r:2,bg:'#fff',a:'bbp-float2 1.3s ease-in-out infinite 0.8s' },
  { t:10,r2:37,w:5,h:5,r:'50%',bg:'#fef08a',a:'bbp-float3 1.3s ease-in-out infinite 0.9s' },
  { t:2,l:74,w:7,h:7,r:'50%',bg:'#fef08a',a:'bbp-float3 1.4s ease-in-out infinite 0.1s' },
  { t:11,r2:33,w:7,h:7,r:2,bg:'#fff',a:'bbp-float1 1.6s ease-in-out infinite 0.5s' },
  { t:6,l:24,w:7,h:7,r:2,bg:'#6ee7b7',a:'bbp-float3 1.5s ease-in-out infinite 0.9s' },
  { t:11,r2:13,w:9,h:9,r:2,bg:'#fef08a',a:'bbp-float3 1.9s ease-in-out infinite 0.2s' },
  { t:7,l:38,w:9,h:9,r:'50%',bg:'#fce7f3',a:'bbp-float1 1.4s ease-in-out infinite' },
  { b:6,l:68,w:6,h:6,r:2,bg:'#bfdbfe',a:'bbp-float3 1.5s ease-in-out infinite 0.6s' },
  { b:5,r2:23,w:7,h:7,r:2,bg:'#fce7f3',a:'bbp-float3 1.5s ease-in-out infinite' },
  { b:7,l:43,w:6,h:6,r:2,bg:'#fff',a:'bbp-float3 2.1s ease-in-out infinite 0.1s' },
  { b:9,r2:12,w:9,h:9,r:2,bg:'#fce7f3',a:'bbp-float3 1.7s ease-in-out infinite 0.5s' },
  { b:6,l:71,w:9,h:9,r:2,bg:'#c4b5fd',a:'bbp-float3 2.0s ease-in-out infinite 0.7s' },
  { b:6,r2:55,w:7,h:7,r:'50%',bg:'#c4b5fd',a:'bbp-float1 1.4s ease-in-out infinite 0.1s' },
  { b:5,r2:12,w:5,h:5,r:2,bg:'#6ee7b7',a:'bbp-float3 1.4s ease-in-out infinite 0.7s' },
  { b:5,l:73,w:6,h:6,r:'50%',bg:'#fef08a',a:'bbp-float1 2.0s ease-in-out infinite 0.8s' },
  { b:6,r2:58,w:9,h:9,r:'50%',bg:'#fef08a',a:'bbp-float1 1.4s ease-in-out infinite 0.2s' },
]

function FeteSpeciale({ fete }) {
  return (
    <div style={{ marginTop:6, background:'linear-gradient(135deg,#b45309,#d97706,#f59e0b)', padding:'8px 14px', borderRadius:12, position:'relative', overflow:'hidden' }}>
      {CONFETTI_SPANS.map((s, i) => (
        <span key={i} style={{ position:'absolute', top:s.t, bottom:s.b, left:s.l, right:s.r2, width:s.w, height:s.h, borderRadius:s.r, background:s.bg, display:'block', animation:s.a }} />
      ))}
      <p style={{ color:'#fff', fontSize:15, fontWeight:600, margin:0, position:'relative', textShadow:'0 1px 3px rgba(0,0,0,0.3)' }}>
        {getFeteIcon(fete)} Fête de {fete} !
      </p>
      <style>{`
        @keyframes bbp-float1 { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-7px) rotate(12deg)} }
        @keyframes bbp-float2 { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-10px) rotate(-18deg)} }
        @keyframes bbp-float3 { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-6px) rotate(25deg)} }
      `}</style>
    </div>
  )
}

function DayHeader({ profile, onMeteoClick, onOpenCityPicker, cityKey }) {
  const [fete, setFete]       = useState(null)
  const [weather, setWeather] = useState(null)
  const [city, setCity]       = useState(null)

  useEffect(() => {
    const checkFete = () => {
      const now = new Date()
      const key = `${now.getDate()}/${now.getMonth()+1}`
      return FETES[key]
    }
    
    const name = checkFete()
    if (name) {
      setTimeout(() => setFete(name), 0)
    }
  }, [])

  useEffect(() => {
    if (!profile?.id) return
    
    const loadWeather = async () => {
      const c = getPreferredCityFromUtils(profile.id)
      
      // Définir la ville immédiatement
      setTimeout(() => setCity(c), 0)
      
      // Utiliser la nouvelle fonction avec moyenne des modèles pour l'heure actuelle
      const w = await fetchCurrentHourWeather(c)
      
      if (w) {
        setWeather({ 
          code: w.code, 
          icon: WMO_ICONS_HD[w.code] ?? '🌡️', 
          avg: w.avg, 
          tMin: w.tMin, 
          tMax: w.tMax, 
          rain: w.rain, 
          wind: w.wind 
        })
      }
    }
    
    loadWeather()
  }, [profile?.id, cityKey])

  const now       = new Date()
  const dateStr   = now.toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' })
  const dateLabel = dateStr.charAt(0).toUpperCase() + dateStr.slice(1)
  const conseil   = weather ? getConseilHD(weather.code, weather.wind) : null
  const moon      = getMoonDayType(now)

  return (
    <div className="max-w-lg mx-auto px-3 pt-2 pb-1">
      <button onClick={onMeteoClick}
        className="w-full rounded-2xl text-left active:scale-95 transition-all"
        style={{ background:'#4f3ea0' }}>

        <div className="px-4 pt-3 pb-3">
          {/* Date + fête + jour lune */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-white font-semibold text-[16px] leading-tight">{dateLabel}</p>
            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
              {fete && !isFeteSpeciale(fete) && (
                <p className="text-white/40 text-[10px]">Fête des {fete}</p>
              )}
              <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-lg"
                style={{ background:'rgba(255,255,255,0.12)', color: moon.color }}>
                {moon.icon} {moon.type}
              </span>
            </div>
          </div>

          {/* Météo principale */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className="text-[48px] leading-none">{weather?.icon ?? '…'}</span>
              <div>
                <p className="text-[34px] font-medium text-white leading-none tracking-tight">
                  {weather?.avg != null ? `${weather.avg}°` : '—'}
                </p>
                {weather?.tMin != null && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-blue-300">↓ {Math.round(weather.tMin)}°</span>
                    <span className="text-[10px] text-orange-300">↑ {Math.round(weather.tMax)}°</span>
                  </div>
                )}
                {weather && (weather.rain != null || weather.wind != null) && (
                  <div className="flex items-center gap-2 mt-0.5">
                    {weather.rain != null && (
                      <span className="text-[10px] text-white/60">
                        💧 {weather.rain === 0 ? '0' : weather.rain < 1 ? '<1' : Math.round(weather.rain)} mm
                      </span>
                    )}
                    {weather.wind != null && (
                      <span className="text-[10px] text-white/60">
                        💨 {Math.round(weather.wind)} km/h
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Conseil à droite */}
            {conseil && (
              <div className="flex-shrink-0 ml-3 flex flex-col items-center justify-center gap-1.5" style={{ maxWidth: 100 }}>
                <span className="text-[32px] leading-none">{conseil.icon}</span>
                <p className="text-[10px] text-white/60 leading-snug text-center">{conseil.text}</p>
              </div>
            )}
          </div>

          {/* Ville + changer — en bas, pleine largeur */}
          <div className="mt-2.5 rounded-xl px-2.5 py-1.5 flex items-center justify-between"
            style={{ background:'rgba(255,255,255,0.10)' }}>
            <span className="text-[11px] text-white/60 leading-tight">
              📍 {city?.name?.split(',')[0] ?? '…'}
            </span>
            <span onClick={e => { e.stopPropagation(); onOpenCityPicker() }}
              className="text-[10px] text-white/40 underline underline-offset-2 cursor-pointer leading-none flex-shrink-0 ml-2"
              style={{ WebkitTapHighlightColor:'transparent' }}>
              Changer ›
            </span>
          </div>
        </div>
      </button>

      {fete && isFeteSpeciale(fete) && <FeteSpeciale fete={fete} />}
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
  const [programmeBadge, setProgrammeBadge] = useState(false)
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
    supabase.from('programme_events').select('event_date, event_end_date, is_annual, event_time')
      .then(({ data }) => {
        if (!data?.length) return
        const hasUrgent = (data || []).some(e => !isPast(e) && daysUntil(e) <= 3)
        setProgrammeBadge(hasUrgent)
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
  const openMeteo = () => openApp('meteo', { initialCity: getPreferredCityFromUtils(profile?.id) })

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

      {/* Bisou — avant la météo */}
      <div className="max-w-lg mx-auto px-3 pt-2">
        <BisouWidget profile={profile} hasBadge={bisouBadge} dark={dark}
          onClick={() => openApp('bisou')} />
      </div>

      <DayHeader profile={profile}
        onMeteoClick={openMeteo}
        onOpenCityPicker={() => { setShowCityPicker(true) }}
        cityKey={meteoKey} />

      <div className="px-3 pt-1.5 pb-8 max-w-lg mx-auto space-y-2">

        {/* Orbite — juste sous la météo */}
        <OrbiteWidget profile={profile} dark={dark} onClick={() => openApp('orbite')} />

        {/* Agenda — Demandez le Programme */}
        <AgendaWidget onClick={() => openApp('programme')} dark={dark} />

        {/* Ça Traîne */}
        <TraineWidget profile={profile} dark={dark} onClick={() => openApp('traine')} />

        {/* Mémoire + Courses — compact côte à côte */}
        <div className="flex gap-2 items-stretch">
          <MemoireWidget profile={profile} dark={dark} onClick={() => openApp('flashcards')} />
          <CoursesWidget profileId={profile?.id} dark={dark}
            onClick={() => openApp('recettes', { initialShoppingList: true })} />
        </div>

        {/* Apps */}
        <p className="text-[11px] uppercase tracking-widest pt-2" style={{ color:'#a78bfa' }}>
          Applications
        </p>
        <div className="grid grid-cols-3 gap-2">
          {HUB_APPS.map(app => (
            <button key={app.id}
              onClick={() => app.id === 'meteo' ? openMeteo() : openApp(app.id)}
              className="relative rounded-2xl py-3 px-2 flex flex-col items-center gap-1.5 active:scale-95 transition-all"
              style={{
                background: dark ? '#1a1035' : '#fff',
                border: `0.5px solid ${dark ? '#2d1f5e' : '#ede9fe'}`
              }}>
              {app.id === 'programme' && programmeBadge && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-amber-400" />
              )}
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                style={{ background: app.color + '18' }}>
                {app.emoji}
              </div>
              <p className="text-[10px] font-medium text-center leading-tight"
                style={{ color: dark ? '#e9d5ff' : '#1e0a3c' }}>
                {app.name}
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
