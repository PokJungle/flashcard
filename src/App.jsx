import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Flashcards from './apps/Flashcards/index.jsx'
import Meteo from './apps/Meteo/index.jsx'
import Grimoire from './apps/Grimoire/index.jsx'
import Bisou from './apps/Bisou/index.jsx'
import Programme from './apps/Programme/index.jsx'
import Orbite from './apps/Orbite/index.jsx'
import { getNextOccurrence, daysUntil } from './apps/Programme/hooks/useProgramme.js'
import { useDarkMode } from './hooks/useDarkMode'

const WMO_ICONS = {
  0:'☀️',1:'🌤️',2:'⛅',3:'☁️',45:'🌫️',48:'🌫️',
  51:'🌦️',53:'🌦️',55:'🌧️',61:'🌧️',63:'🌧️',65:'🌧️',
  71:'🌨️',73:'🌨️',75:'❄️',80:'🌦️',81:'🌧️',82:'⛈️',
  95:'⛈️',96:'⛈️',99:'⛈️',
}

function getConseil(code, wind = null) {
  const windy = wind != null && wind >= 40
  if (code == null) return null
  if ([95,96,99].includes(code))
    return { icon:'☂️', text: windy ? 'Parapluie, mais franchement reste à la maison' : 'Parapluie + cirée + bottes' }
  if ([65,82].includes(code))
    return { icon:'☂️', text: windy ? 'Parapluie retourné garanti' : "Parapluie solide, c'est sérieux" }
  if ([51,53,55,61,63,80,81].includes(code))
    return { icon:'☂️', text: windy ? 'Parapluie… ou pas, il tiendra pas' : 'Petite pluie, petit parapluie' }
  if ([71,73,75].includes(code))
    return { icon:'☂️', text: windy ? 'Parapluie inutile, bonne chance quand même' : 'Ni claquettes ni parapluie, les raquettes !' }
  if ([45,48].includes(code))
    return { icon:'🩴', text: windy ? 'Brouillard venteux ? Claquettes ça se tente' : 'Claquettes dans le brouillard, pourquoi pas' }
  if ([3].includes(code))
    return { icon:'🩴', text: windy ? 'Claquettes risquées, parapluie de précaution' : 'Claquettes possibles, parapluie en veille' }
  if ([2].includes(code))
    return { icon:'🩴', text: windy ? 'Claquettes, veste et cheveux en bataille' : 'Claquettes-Chausettes au cas où...' }
  if ([1].includes(code))
    return { icon:'🩴', text: windy ? "Claquettes oui, mais attention qu'elles ne s'envolent pas" : 'Claquettes envisageables, belle journée !' }
  if ([0].includes(code))
    return { icon:'🩴', text: windy ? 'Claquettes, soleil et vent dans les oreilles' : 'Claquettes et lunette de soleil, grande journée !' }
  if (windy) return { icon:'🩴', text: 'Claquettes ok mais accroche le parapluie' }
  return { icon:'🩴', text: 'Claquettes ou parapluie… va savoir' }
}

const DEFAULT_METEO_CITY = { name:'Saint-Antonin-sur-Bayon', lat:43.5308, lon:5.6078, country:'FR' }

function getStartOfWeek() {
  const d = new Date(); const day = d.getDay()
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1))
  d.setHours(0,0,0,0); return d.toISOString().split('T')[0]
}

function getPreferredCity(profileId) {
  try {
    const pref = JSON.parse(localStorage.getItem(`bbp-meteo-city-${profileId}`))
    if (pref?.lat) return pref
  } catch { /* ignore */ }
  try {
    const favs = JSON.parse(localStorage.getItem('meteo-fav2') || 'null')
    if (favs?.length) return favs[0]
  } catch { /* ignore */ }
  return DEFAULT_METEO_CITY
}

const APPS = [
  { id:'flashcards', name:'Mémoire de Singe',         emoji:'🐒', color:'#6A9BCC', component:Flashcards },
  { id:'meteo',      name:'Parapluie ou Claquettes ?', emoji:'🌦️', color:'#4CAF82', component:Meteo },
  { id:'recettes',   name:'Le Grimoire Gourmand',      emoji:'📖', color:'#E67E22', component:Grimoire },
  { id:'bisou',      name:'Bisou',                     emoji:'💌', color:'#E91E8C', component:Bisou },
  { id:'programme',  name:'Demandez le Programme !',   emoji:'🗞️', color:'#8B5CF6', component:Programme },
  { id:'orbite',     name:'Mise en Orbite',            emoji:'💥', color:'#FF7A1E', component:Orbite },
]
const HUB_APPS   = APPS.filter(a => a.id !== 'bisou')
const HUB_LABELS = { flashcards:'Mémoire de Singe', meteo:'Parapluie ou Claquettes ?', recettes:'Le Grimoire Gourmand', programme:'Demandez le Programme !', orbite:'Mise en Orbite' }
const APPS_EN_PREP = [
  { emoji:'🍵', name:'Tisane & Chauffeuse' },
  { emoji:'🐌', name:'Ça Traîne' },
  { emoji:'🎸', name:'Jukebox' },
  { emoji:'👣', name:'Nos Empreintes' },
  { emoji:'💧', name:'Arrose-moi' },
  { emoji:'🌙', name:'Parenthèse' },
]

async function fetchWeatherForCity(city) {
  try {
    const r = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}` +
      `&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max&timezone=Europe%2FParis&forecast_days=1&models=best_match`
    )
    const d = await r.json()
    if (d.error || !d.daily) return null
    const tMin = d.daily.temperature_2m_min?.[0] ?? null
    const tMax = d.daily.temperature_2m_max?.[0] ?? null
    return {
      code: d.daily.weathercode?.[0] ?? null, tMin, tMax,
      avg:  tMin != null && tMax != null ? Math.round((tMin+tMax)/2) : null,
      rain: d.daily.precipitation_sum?.[0] ?? null,
      wind: d.daily.windspeed_10m_max?.[0] ?? null,
    }
  } catch { return null }
}

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
    let favs = [DEFAULT_METEO_CITY]
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

// ─── Widget Météo ─────────────────────────────────────────────────────────────
function MeteoWidget({ profileId, onOpenCityPicker, onClick }) {
  const [weather, setWeather] = useState(null)
  const [city, setCity]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profileId) return
    setLoading(true)
    const c = getPreferredCity(profileId)
    setCity(c)
    fetchWeatherForCity(c).then(w => { setWeather(w); setLoading(false) })
  }, [profileId])

  const conseil = weather ? getConseil(weather.code, weather.wind) : null
  const icon    = loading ? '…' : (WMO_ICONS[weather?.code] ?? '🌡️')

  return (
    <button onClick={onClick}
      className="text-left rounded-2xl px-3 py-2.5 active:scale-95 transition-all relative overflow-hidden flex flex-col justify-between flex-shrink-0"
      style={{ background:'#4f3ea0', width:170 }}>
      <span className="absolute -top-14 -right-14 w-40 h-40 rounded-full bg-white opacity-[0.07] pointer-events-none" />
      <div className="flex justify-between items-start">
        <div className="min-w-0 flex-1 mr-1">
          <p className="text-[11px] font-medium text-white leading-tight truncate">{city?.name?.split(',')[0] ?? '…'}</p>
          <span onClick={e => { e.stopPropagation(); onOpenCityPicker() }}
            className="text-[10px] text-white/40 underline underline-offset-2 mt-0.5 leading-none cursor-pointer"
            style={{ WebkitTapHighlightColor:'transparent' }}>
            Changer ›
          </span>
        </div>
        <span className="text-[48px] leading-none flex-shrink-0">{icon}</span>
      </div>
      <p className="text-[34px] font-medium text-white leading-none tracking-tight mt-1.5">
        {loading ? '…' : weather?.avg != null ? `${weather.avg}°` : '—'}
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
            <span className="text-[10px] text-white/60 flex items-center gap-0.5">
              💧 {weather.rain === 0 ? '0' : weather.rain < 1 ? '<1' : Math.round(weather.rain)} mm
            </span>
          )}
          {weather.wind != null && (
            <span className="text-[10px] text-white/60 flex items-center gap-0.5">
              💨 {Math.round(weather.wind)} km/h
            </span>
          )}
        </div>
      )}
      {conseil && (
        <div className="mt-1.5 rounded-lg px-1.5 py-1 text-[10px] text-white/80 flex items-center gap-1.5"
          style={{ background:'rgba(255,255,255,0.12)' }}>
          <span className="text-[22px] leading-none flex-shrink-0">{conseil.icon}</span>
          <span className="leading-snug">{conseil.text}</span>
        </div>
      )}
    </button>
  )
}

// ─── Widget Bisou ─────────────────────────────────────────────────────────────
function BisouWidget({ profile, hasBadge, onClick, dark }) {
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

// ─── Widget Courses ────────────────────────────────────────────────────────────
function CoursesWidget({ profileId, onClick }) {
  const [hasItems, setHasItems] = useState(false)

  useEffect(() => {
    if (!profileId) return
    const week = getStartOfWeek()
    supabase.from('meal_plan')
      .select('meals').eq('profile_id', profileId).eq('week_start', week).maybeSingle()
      .then(({ data }) => {
        setHasItems(!!(data?.meals?.some(({ recipe }) => recipe?.ingredients?.length > 0)))
      })
  }, [profileId])

  return (
    <button onClick={onClick}
      className="flex items-center justify-center rounded-2xl active:scale-95 transition-all relative flex-shrink-0"
      style={{ width:48, alignSelf:'stretch',
               background:'#fef9c3', border:'0.5px solid #fde68a',
               boxShadow:'2px 2px 0 #fde047' }}>
      <span className="text-[22px]">🛒</span>
      {hasItems && (
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-orange-400"
          style={{ border:'1.5px solid #f5f0ff' }} />
      )}
    </button>
  )
}

// ─── Widget Agenda ────────────────────────────────────────────────────────────
function AgendaWidget({ onClick, dark }) {
  const [nextEvent, setNextEvent] = useState(null)
  const [loaded, setLoaded]       = useState(false)

  useEffect(() => {
    supabase.from('programme_events').select('*').order('event_date', { ascending:true })
      .then(({ data }) => {
        if (!data) { setLoaded(true); return }
        const today = new Date(); today.setHours(0,0,0,0)
        const future = data.filter(e => {
          if (e.is_annual) return true
          const [y,m,d] = e.event_date.split('-').map(Number)
          return new Date(y,m-1,d) >= today
        })
        future.sort((a,b) => getNextOccurrence(a) - getNextOccurrence(b))
        setNextEvent(future[0] || null)
        setLoaded(true)
      })
  }, [])

  if (!loaded || !nextEvent) return null

  const days      = daysUntil(nextEvent)
  const isUrgent  = days <= 3
  const countdown = days === 0 ? "Aujourd'hui 🎉" : days === 1 ? 'Demain' : `dans ${days} jours`
  const dateObj   = getNextOccurrence(nextEvent)
  const day       = dateObj.getDate()
  const mon       = dateObj.toLocaleDateString('fr-FR', { month:'short' }).replace('.','')

  return (
    <button onClick={onClick}
      className="w-full rounded-2xl p-3 text-left active:scale-95 transition-all"
      style={{
        background: dark ? '#1e1b4b' : '#fff',
        border: `0.5px solid ${dark ? '#4338ca' : '#ede9fe'}`
      }}>
      <p className="text-[11px] mb-1.5" style={{ color:'#c4b5fd' }}>Prochain événement</p>
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-xl flex flex-col items-center justify-center flex-shrink-0"
          style={{ background: dark ? '#312e81' : '#f5f0ff', border:`0.5px solid ${dark ? '#4338ca' : '#e9d5ff'}` }}>
          <span className="text-[14px] font-medium leading-none" style={{ color:'#5b21b6' }}>{day}</span>
          <span className="text-[9px] uppercase" style={{ color:'#a78bfa' }}>{mon}</span>
        </div>
        <div className="min-w-0">
          <p className="text-[12px] font-medium truncate" style={{ color: dark ? '#e9d5ff' : '#111827' }}>{nextEvent.emoji} {nextEvent.title}</p>
          <p className={`text-[11px] ${isUrgent ? 'text-amber-500' : 'text-gray-400'}`}>{countdown}</p>
        </div>
      </div>
    </button>
  )
}

// ─── Widget Orbite ────────────────────────────────────────────────────────────
function OrbiteWidget({ profile, onClick }) {
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

// ─── Fêtes spéciales ──────────────────────────────────────────────────────────
const FETES_SPECIALES = [
  { nom:'Marie',              icon:'❤️‍🔥' },
  { nom:'Benoît',             icon:'🐵' },
  { nom:'Patrick',            icon:'🍀' },
  { nom:'Joseph',             icon:'🍷' },
  { nom:'Valentin',           icon:'💝' },
  { nom:'Noël',               icon:'🎄' },
  { nom:'Toussaint',          icon:'🕯️' },
  { nom:'Nicolas',            icon:'🎅' },
  { nom:'Lucie',              icon:'🔆' },
  { nom:'Hervé',              icon:'😡' },
  { nom:"Jour de l'an",       icon:'🥂' },
  { nom:'Fête de la musique', icon:'🎵' },
  { nom:'Fête Nationale',     icon:'🎆' },
  { nom:'Fête du Travail',    icon:'💮' },
  { nom:'Victoire 45',        icon:'🕊️' },
  { nom:'Armistice',          icon:'🕊️' },
  { nom:'Pâques',             icon:'🥚' },
]

function isFeteSpeciale(fete) {
  return FETES_SPECIALES.some(f => f.nom === fete)
}
function getFeteIcon(fete) {
  return FETES_SPECIALES.find(f => f.nom === fete)?.icon ?? '🎉'
}

// ─── Composant entête date + fête ─────────────────────────────────────────────
function DayHeader({ profile, dark }) {
  const [fete, setFete] = useState(null)

  useEffect(() => {
    const FETES = {
      '1/1':"Jour de l'an",'2/1':'Basile','3/1':'Geneviève','4/1':'Odilon','5/1':'Edouard',
      '6/1':'Melchior','7/1':'Raymond','8/1':'Lucien','9/1':'Alix','10/1':'Guillaume',
      '11/1':'Paulin','12/1':'Tatiana','13/1':'Yvette','14/1':'Nina','15/1':'Rémi',
      '16/1':'Marcel','17/1':'Roseline','18/1':'Prisca','19/1':'Marius','20/1':'Sébastien',
      '21/1':'Agnès','22/1':'Vincent','23/1':'Barnard','24/1':'François de Sales','25/1':'Conv. de Paul',
      '26/1':'Timothée','27/1':'Angèle','28/1':'Thomas d\'Aquin','29/1':'Gildas','30/1':'Martine',
      '31/1':'Marcelle',
      '1/2':'Ella','2/2':'Présentation','3/2':'Blaise','4/2':'Véronique','5/2':'Agathe',
      '6/2':'Gaston','7/2':'Eugénie','8/2':'Jacqueline','9/2':'Apolline','10/2':'Arnaud',
      '11/2':'Héloïse','12/2':'Félix','13/2':'Béatrice','14/2':'Valentin','15/2':'Claude',
      '16/2':'Julienne','17/2':'Alexis','18/2':'Bernadette','19/2':'Gabin','20/2':'Aimée',
      '21/2':'Damien','22/2':'Isabelle','23/2':'Lazare','24/2':'Modeste','25/2':'Roméo',
      '26/2':'Nestor','27/2':'Honorine','28/2':'Romain','29/2':'Auguste',
      '1/3':'Aubin','2/3':'Charles le Bon','3/3':'Guénolé','4/3':'Casimir','5/3':'Olive',
      '6/3':'Colette','7/3':'Félicité','8/3':'Jean de Dieu','9/3':'Françoise','10/3':'Vivien',
      '11/3':'Rosine','12/3':'Justine','13/3':'Rodrigue','14/3':'Mathilde','15/3':'Louise',
      '16/3':'Bénédicte','17/3':'Cyrille','18/3':'Cyrille','19/3':'Joseph','20/3':'Herbert',
      '21/3':'Clémence','22/3':'Léa','23/3':'Victorien','24/3':'Cath. de Suède','25/3':'Annonciation',
      '26/3':'Larissa','27/3':'Habib','28/3':'Gontran','29/3':'Gwladys','30/3':'Amédée',
      '31/3':'Benjamin',
      '1/4':'Hugues','2/4':'Sandrine','3/4':'Richard','4/4':'Isidore','5/4':'Pâques',
      '6/4':'Marcellin','7/4':'Jean-Baptiste','8/4':'Julie','9/4':'Gautier','10/4':'Fulbert',
      '11/4':'Stanislas','12/4':'Jules','13/4':'Ida','14/4':'Maxime','15/4':'Paterne',
      '16/4':'Benoît-Joseph','17/4':'Anicet','18/4':'Parfait','19/4':'Emma','20/4':'Odette',
      '21/4':'Anselme','22/4':'Alexandre','23/4':'Georges','24/4':'Fidèle','25/4':'Marc',
      '26/4':'Alida','27/4':'Zita','28/4':'Valérie','29/4':'Catherine de Sienne','30/4':'Robert',
      '1/5':'Fête du Travail','2/5':'Boris','3/5':'Philippe','4/5':'Sylvain','5/5':'Judith',
      '6/5':'Prudence','7/5':'Gisèle','8/5':'Victoire 45','9/5':'Pacôme','10/5':'Solange',
      '11/5':'Estelle','12/5':'Achille','13/5':'Rolande','14/5':'Matthias','15/5':'Denise',
      '16/5':'Honoré','17/5':'Pascal','18/5':'Éric','19/5':'Yves','20/5':'Bernardin',
      '21/5':'Constantin','22/5':'Émile','23/5':'Didier','24/5':'Donatien','25/5':'Sophie',
      '26/5':'Bérenger','27/5':'Augustin','28/5':'Germain','29/5':'Aymar','30/5':'Ferdinand',
      '31/5':'Visitation',
      '1/6':'Justin','2/6':'Blandine','3/6':'Kévin','4/6':'Clotilde','5/6':'Igor',
      '6/6':'Norbert','7/6':'Gilbert','8/6':'Médard','9/6':'Diane','10/6':'Landry',
      '11/6':'Barnabé','12/6':'Guy','13/6':'Antoine de Padoue','14/6':'Élisée','15/6':'Germaine',
      '16/6':'Jean-François','17/6':'Hervé','18/6':'Léonce','19/6':'Romuald','20/6':'Silvère',
      '21/6':'Fête de la musique','22/6':'Alban','23/6':'Audrey','24/6':'Jean-Baptiste','25/6':'Prosper',
      '26/6':'Anthelme','27/6':'Fernand','28/6':'Irénée','29/6':'Pierre et Paul','30/6':'Martial',
      '1/7':'Thierry','2/7':'Martinien','3/7':'Thomas','4/7':'Florent','5/7':'Antoine',
      '6/7':'Mariette','7/7':'Raoul','8/7':'Thibaut','9/7':'Amandine','10/7':'Ulrich',
      '11/7':'Benoît','12/7':'Olivier','13/7':'Henri','14/7':'Fête Nationale','15/7':'Donald',
      '16/7':'N-D du Carmel','17/7':'Charlotte','18/7':'Frédéric','19/7':'Arsène','20/7':'Marina',
      '21/7':'Victor','22/7':'Marie-Madeleine','23/7':'Brigitte','24/7':'Christine','25/7':'Jacques',
      '26/7':'Anne et Joachim','27/7':'Nathalie','28/7':'Samson','29/7':'Marthe','30/7':'Juliette',
      '31/7':'Ignace de Loyola',
      '1/8':'Alphonse','2/8':'Julien Eymard','3/8':'Lydie','4/8':'Jean-Marie Vianney','5/8':'Abel',
      '6/8':'Transfiguration','7/8':'Gaëtan','8/8':'Dominique','9/8':'Amour','10/8':'Laurent',
      '11/8':'Claire','12/8':'Clarisse','13/8':'Hippolyte','14/8':'Evrard','15/8':'Marie',
      '16/8':'Armel','17/8':'Hyacinthe','18/8':'Hélène','19/8':'Jean-Eudes','20/8':'Bernard',
      '21/8':'Christophe','22/8':'Fabrice','23/8':'Rose de Lima','24/8':'Barthélemy','25/8':'Louis',
      '26/8':'Natacha','27/8':'Monique','28/8':'Augustin','29/8':'Sabine','30/8':'Fiacre',
      '31/8':'Aristide',
      '1/9':'Gilles','2/9':'Ingrid','3/9':'Grégoire le Grand','4/9':'Rosalie','5/9':'Raïssa',
      '6/9':'Bertrand','7/9':'Reine','8/9':'Nativité','9/9':'Alain','10/9':'Inès',
      '11/9':'Adelphe','12/9':'Apollinaire','13/9':'Aimé','14/9':'Croix Glorieuse','15/9':'Roland',
      '16/9':'Edith','17/9':'Renaud','18/9':'Nadège','19/9':'Émilie','20/9':'Davy',
      '21/9':'Matthieu','22/9':'Maurice','23/9':'Constance','24/9':'Thècle','25/9':'Hermann',
      '26/9':'Côme et Damien','27/9':'Vinc. de Paul','28/9':'Venceslas','29/9':'Michel','30/9':'Jérôme',
      '1/10':'Thérèse de l\'E-J','2/10':'Léger','3/10':'Gérard','4/10':'François d\'Assise','5/10':'Fleur',
      '6/10':'Bruno','7/10':'Serge','8/10':'Pélagie','9/10':'Denis','10/10':'Ghislain',
      '11/10':'Firmin','12/10':'Wilfrid','13/10':'Géraud','14/10':'Juste','15/10':'Thérèse d\'Avila',
      '16/10':'Edwige','17/10':'Baudouin','18/10':'Luc','19/10':'René','20/10':'Adeline',
      '21/10':'Céline','22/10':'Élodie','23/10':'Jean de Capistran','24/10':'Florentin','25/10':'Crépin',
      '26/10':'Dimitri','27/10':'Émeline','28/10':'Simon et Jude','29/10':'Narcisse','30/10':'Bienvenu',
      '31/10':'Quentin',
      '1/11':'Toussaint','2/11':'Défunts','3/11':'Hubert','4/11':'Charles','5/11':'Sylvie',
      '6/11':'Bertille','7/11':'Carine','8/11':'Geoffrey','9/11':'Théodore','10/11':'Léon',
      '11/11':'Armistice','12/11':'Christian','13/11':'Brice','14/11':'Sidoine','15/11':'Albert',
      '16/11':'Marguerite d\'Écosse','17/11':'Élisabeth','18/11':'Aude','19/11':'Tanguy','20/11':'Edmond',
      '21/11':'Prés. de Marie','22/11':'Cécile','23/11':'Clément','24/11':'Flora','25/11':'Catherine',
      '26/11':'Delphine','27/11':'Sévrin','28/11':'Jacques de la Marche','29/11':'Saturnin','30/11':'André',
      '1/12':'Florence','2/12':'Viviane','3/12':'François-Xavier','4/12':'Barbara','5/12':'Gérald',
      '6/12':'Nicolas','7/12':'Ambroise','8/12':'Immaculée Conception','9/12':'Pierre Fourier','10/12':'Romaric',
      '11/12':'Daniel','12/12':'Jeanne de Chantal','13/12':'Lucie','14/12':'Odile','15/12':'Ninon',
      '16/12':'Alice','17/12':'Gaël','18/12':'Gatien','19/12':'Urbain','20/12':'Abraham',
      '21/12':'Pierre Canisius','22/12':'Françoise-Xavière','23/12':'Armand','24/12':'Adèle','25/12':'Noël',
      '26/12':'Étienne','27/12':'Jean','28/12':'Innocents','29/12':'David','30/12':'Roger',
      '31/12':'Sylvestre',
    }
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

      <div className="px-3 pt-1.5 pb-8 max-w-lg mx-auto">

        <div className="mb-2">
          <AgendaWidget onClick={() => openApp('programme')} dark={dark} />
        </div>

        <div className="flex gap-2 items-stretch mb-2">
          <MeteoWidget key={meteoKey} profileId={profile?.id}
            onOpenCityPicker={() => setShowCityPicker(true)} onClick={openMeteo} />
          <BisouWidget profile={profile} hasBadge={bisouBadge} dark={dark}
            onClick={() => openApp('bisou')} />
          <OrbiteWidget profile={profile} onClick={() => openApp('orbite')} />
        </div>

        <p className="text-[11px] uppercase tracking-widest mt-3 mb-2" style={{ color:'#a78bfa' }}>
          Applications
        </p>
        <div className="grid grid-cols-4 gap-2 mb-1">
          {HUB_APPS.map(app => (
            <button key={app.id}
              onClick={() => app.id === 'meteo' ? openMeteo() : openApp(app.id)}
              className="rounded-2xl py-2.5 px-1 flex flex-col items-center gap-1.5 active:scale-95 transition-all"
              style={{
                background: dark ? '#1a1035' : '#fff',
                border: `0.5px solid ${dark ? '#2d1f5e' : '#ede9fe'}`
              }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                style={{ background:app.color+'18' }}>
                {app.emoji}
              </div>
              <p className="text-[10px] font-medium text-center leading-tight" style={{ color: dark ? '#c4b5fd' : '#1e0a3c' }}>
                {HUB_LABELS[app.id] ?? app.name}
              </p>
            </button>
          ))}
        </div>

        <p className="text-[11px] uppercase tracking-widest mt-3 mb-2" style={{ color:'#a78bfa' }}>
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