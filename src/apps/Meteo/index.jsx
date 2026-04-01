import { useState, useEffect } from 'react'
import { Search, StarOff, Wind, Droplets, ChevronRight, ArrowLeft, X } from 'lucide-react'
import { useThemeColors } from '../../hooks/useThemeColors'
import { ls } from '../../utils/localStorage'
import Spinner from '../../components/Spinner'
import { getConseil } from './meteo.utils'

// URLs préconfigurées pour certaines villes
const CITY_URLS = {
  'Saint-Antonin-sur-Bayon': {
    meteociel: 'https://www.meteociel.fr/previsions/3548/saint_antonin_sur_bayon.htm',
    weather24: 'https://meteofrance.com/previsions-meteo-france/saint-antonin-sur-bayon/13100',
  }
}

const DEFAULT_CITY = { name: 'Saint-Antonin-sur-Bayon', lat: 43.5308, lon: 5.6078, country: 'FR', isDefault: true }

const ALL_MODELS = [
  { id: 'arome_france',         label: 'AROME',    precision: '1km',   horizon: 2,  color: '#E74C3C', countries: ['FR'] },
  { id: 'icon_d2',              label: 'ICON-D2',  precision: '2.2km', horizon: 2,  color: '#9B59B6', countries: null },
  { id: 'icon_eu',              label: 'ICON-EU',  precision: '7km',   horizon: 5,  color: '#27AE60', countries: null },
  { id: 'meteofrance_seamless', label: 'Météo FR', precision: '9km',   horizon: 15, color: '#4CAF82', countries: ['FR'] },
  { id: 'best_match',           label: 'ECMWF',    precision: '9km',   horizon: 15, color: '#6A9BCC', countries: null },
  { id: 'gfs_seamless',         label: 'GFS',      precision: '13km',  horizon: 10, color: '#CC6A8A', countries: null },
]

const WMO_ICONS = {
  0:'☀️',1:'🌤️',2:'⛅',3:'☁️',45:'🌫️',48:'🌫️',
  51:'🌦️',53:'🌦️',55:'🌧️',61:'🌧️',63:'🌧️',65:'🌧️',
  71:'🌨️',73:'🌨️',75:'❄️',80:'🌦️',81:'🌧️',82:'⛈️',
  95:'⛈️',96:'⛈️',99:'⛈️',
}
const WMO_LABELS = {
  0:'Ciel dégagé',1:'Peu nuageux',2:'Partiellement nuageux',3:'Couvert',
  45:'Brouillard',48:'Brouillard givrant',51:'Bruine légère',53:'Bruine',55:'Bruine forte',
  61:'Pluie légère',63:'Pluie',65:'Pluie forte',71:'Neige légère',73:'Neige',75:'Neige forte',
  80:'Averses légères',81:'Averses',82:'Averses fortes',95:'Orage',96:'Orage avec grêle',99:'Orage violent',
}
const DAYS_FR = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam']
const MONTHS_FR = ['jan','fév','mar','avr','mai','jun','jul','aoû','sep','oct','nov','déc']

const nv = v => (v == null || isNaN(v)) ? 0 : Number(v)

function formatDay(dateStr, idx) {
  const d = new Date(dateStr)
  if (idx === 0) return "Aujourd'hui"
  if (idx === 1) return 'Demain'
  return `${DAYS_FR[d.getDay()]} ${d.getDate()} ${MONTHS_FR[d.getMonth()]}`
}
function formatHour(isoStr) {
  return `${String(new Date(isoStr).getHours()).padStart(2,'0')}h`
}
function getModelsForDay(dayIndex, countryCode) {
  const cc = (countryCode || '').toUpperCase()
  return ALL_MODELS.filter(m => {
    if (dayIndex > m.horizon) return false
    if (m.countries && !m.countries.includes(cc)) return false
    return true
  })
}

async function fetchModel(lat, lon, modelId) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max` +
      `&hourly=temperature_2m,weathercode,precipitation,windspeed_10m,relativehumidity_2m` +
      `&timezone=Europe%2FParis&forecast_days=7&models=${modelId}`
    const r = await fetch(url)
    const d = await r.json()
    if (d.error) return null
    const hasData = d.hourly?.temperature_2m?.some(v => v != null)
    if (!hasData) return null
    if (d.daily?.temperature_2m_max?.every(v => v === null)) {
      d.daily.time.forEach((date, i) => {
        const idxs = d.hourly.time.map((t, j) => t.startsWith(date) ? j : -1).filter(j => j !== -1)
        const temps = idxs.map(j => d.hourly.temperature_2m[j]).filter(v => v != null)
        const winds = idxs.map(j => d.hourly.windspeed_10m[j]).filter(v => v != null)
        const rains = idxs.map(j => d.hourly.precipitation[j]).filter(v => v != null)
        const codes = idxs.map(j => d.hourly.weathercode[j]).filter(v => v != null)
        d.daily.temperature_2m_max[i] = temps.length ? Math.max(...temps) : null
        d.daily.temperature_2m_min[i] = temps.length ? Math.min(...temps) : null
        d.daily.windspeed_10m_max[i] = winds.length ? Math.max(...winds) : null
        d.daily.precipitation_sum[i] = rains.length ? rains.reduce((a, b) => a + b, 0) : null
        d.daily.weathercode[i] = codes.length ? codes[Math.floor(codes.length / 2)] : null
      })
    }
    return d
  } catch { return null }
}

async function searchCity(query) {
  const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=fr&format=json`)
  const d = await r.json()
  return d.results || []
}

function getCountryCode(city) {
  return (city.country_code || city.country || 'XX').toUpperCase()
}

export default function Meteo({ initialCity, dark }) {
  const [favorites, setFavorites] = useState(() => ls.get('meteo-fav2') || [DEFAULT_CITY])
  const [activeCity, setActiveCity] = useState(favorites[0])
  const [modelData, setModelData] = useState({})
  const [loading, setLoading] = useState(false)
  const [selectedDay, setSelectedDay] = useState(null)
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)

  // Appliquer la ville initiale passée depuis le hub
  useEffect(() => {
    if (!initialCity) return
    const match = favorites.find(f => f.lat === initialCity.lat)
    if (match) setActiveCity(match)
    else {
      const c = { name: initialCity.name, lat: initialCity.lat, lon: initialCity.lon, country: initialCity.country || 'FR' }
      setActiveCity(c)
    }
  }, []) // une seule fois au mount

  useEffect(() => { ls.set('meteo-fav2', favorites) }, [favorites])
  useEffect(() => { if (activeCity) loadWeather() }, [activeCity])

  const loadWeather = async () => {
    setLoading(true)
    setSelectedDay(null)
    setModelData({})
    const cc = getCountryCode(activeCity)
    const applicable = ALL_MODELS.filter(m => !m.countries || m.countries.includes(cc))
    const map = {}
    for (const m of applicable) {
      const data = await fetchModel(activeCity.lat, activeCity.lon, m.id)
      if (data) map[m.id] = data
      await new Promise(r => setTimeout(r, 300))
    }
    setModelData(map)
    setLoading(false)
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setSearching(true)
    setSearchResults(await searchCity(searchQuery))
    setSearching(false)
  }

  const addFavorite = (city) => {
    const c = { name: city.name + (city.admin1 ? `, ${city.admin1}` : ''), lat: city.latitude, lon: city.longitude, country: city.country_code || 'XX' }
    if (!favorites.find(f => f.lat === c.lat)) setFavorites(prev => [...prev, c])
    setActiveCity(c)
    setShowSearch(false)
    setSearchQuery('')
    setSearchResults([])
  }

  const removeFavorite = (city) => {
    const next = favorites.filter(f => !(f.lat === city.lat && f.lon === city.lon))
    const safe = next.length > 0 ? next : [DEFAULT_CITY]
    setFavorites(safe)
    if (activeCity.lat === city.lat) setActiveCity(safe[0])
  }

  const getHours = (modelId, dayIdx) => {
    const data = modelData[modelId]
    if (!data || dayIdx === null) return []
    const dateStr = dates[dayIdx]
    if (!dateStr) return []

    // ── FIX : pour aujourd'hui, on ne montre que l'heure courante et après ──
    const now = new Date()

    return data.hourly.time
      .map((t, i) => ({ t, i }))
      .filter(({ t }) => {
        if (!t.startsWith(dateStr)) return false
        if (dayIdx === 0 && new Date(t) < now) return false
        return true
      })
      .map(({ t, i }) => ({
        hour: formatHour(t),
        temp: data.hourly.temperature_2m[i],
        code: data.hourly.weathercode[i] ?? 0,
        rain: data.hourly.precipitation[i],
        wind: data.hourly.windspeed_10m[i],
        humidity: data.hourly.relativehumidity_2m[i],
        hasData: data.hourly.temperature_2m[i] != null,
      }))
  }

  const ref = modelData['best_match'] || modelData[Object.keys(modelData)[0]]
  const dates = ref?.daily?.time || []
  const cc = getCountryCode(activeCity)

  const avg = arr => {
    const valid = arr.filter(v => v != null && !isNaN(v))
    return valid.length ? Math.round(valid.reduce((a, b) => a + b, 0) / valid.length) : null
  }
  const avgF = arr => {
    const valid = arr.filter(v => v != null && !isNaN(v))
    return valid.length ? (valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(1) : null
  }

  const cityName = activeCity.name.split(',')[0]
  const cityUrls = CITY_URLS[cityName] || {}
  const windy = `https://www.windy.com/?${activeCity.lat},${activeCity.lon},12`
  const meteoCiel = cityUrls.meteociel || `https://www.google.com/search?q=meteociel+${encodeURIComponent(cityName)}`
  const weather24 = cityUrls.weather24 || `https://www.google.com/search?q=weather24+${encodeURIComponent(cityName)}`
  const meteoCielLabel = cityUrls.meteociel ? '🌦️ MétéoCiel' : '🔍 MétéoCiel'
  const weather24Label = cityUrls.weather24 ? '🇫🇷 Météo France' : '🔍 Weather24'

  const { bg, card, border, textPri, textSec, textMed } = useThemeColors(dark)

  return (
    <div className="h-full overflow-y-auto" style={{ background: bg }}>

      {/* Favoris */}
      <div className="px-4 py-3" style={{ background: card, borderBottom: `1px solid ${border}` }}>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {favorites.map((city, i) => (
            <button key={i} onClick={() => setActiveCity(city)}
              className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all"
              style={activeCity.lat === city.lat
                ? { background: dark ? '#7c3aed' : '#111827', color: '#fff' }
                : { background: dark ? '#2d1f5e' : '#f3f4f6', color: textMed }
              }>
              {city.name.split(',')[0]}
            </button>
          ))}
          <button onClick={() => setShowSearch(true)}
            className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: dark ? '#2d1f5e' : '#f3f4f6', color: textSec }}>
            <Search size={16} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Spinner color={dark ? '#a78bfa' : '#374151'} />
          <p className="text-xs" style={{ color: textSec }}>Chargement des modèles météo…</p>
        </div>

      ) : selectedDay === null ? (

        // ─── 7 JOURS ─────────────────────────────────────────────────────
        <div className="px-4 py-4 max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-bold" style={{ color: textPri }}>{activeCity.name.split(',')[0]}</h2>
              <p className="text-xs" style={{ color: textSec }}>Modèles adaptés à l'horizon · 7 jours</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Conseil parapluie/claquettes */}
              {(() => {
                const currentHour = new Date().getHours()
                const todayIdx = 0
                const todayModels = getModelsForDay(todayIdx, cc).filter(m => modelData[m.id])
                const todayHours = todayModels.length > 0 ? getHours(todayModels[0].id, todayIdx) : []
                const currentHourData = todayHours.find(h => h.hasData && parseInt(h.hour) === currentHour) || todayHours.find(h => h.hasData)
                
                if (currentHourData) {
                  const conseil = getConseil(currentHourData.code, currentHourData.wind)
                  if (conseil) {
                    return (
                      <div className="px-2 py-1.5 rounded-lg" style={{ background: card, border: `1px solid ${border}` }}>
                        <p className="text-xs font-semibold" style={{ color: textPri }}>
                          Parapluie ou Claquettes ? <span className="text-base">{conseil.icon}</span>
                        </p>
                        <p className="text-[9px] mt-0.5" style={{ color: textSec, lineHeight: '1.2' }}>
                          {conseil.text}
                        </p>
                      </div>
                    )
                  }
                }
                return null
              })()}
              {!activeCity.isDefault && favorites.length > 1 && (
                <button onClick={() => removeFavorite(activeCity)} className="p-2" style={{ color: textSec }}>
                  <StarOff size={18} />
                </button>
              )}
            </div>
          </div>

          {/* Légende */}
          <div className="flex flex-wrap gap-2 mb-4">
            {ALL_MODELS.filter(m => modelData[m.id]).map(m => (
              <div key={m.id} className="flex items-center gap-1 px-2 py-1 rounded-full" style={{ background: m.color + '20' }}>
                <div className="w-2 h-2 rounded-full" style={{ background: m.color }} />
                <span className="text-xs font-semibold" style={{ color: m.color }}>{m.label}</span>
                <span className="text-xs" style={{ color: textSec }}>{m.precision}</span>
              </div>
            ))}
          </div>

          {/* 7 jours */}
          <div className="space-y-2 mb-6">
            {dates.map((date, dayIdx) => {
              const dayModels = getModelsForDay(dayIdx, cc).filter(m => modelData[m.id])
              const refDay = ref?.daily
              const validModels = dayModels.filter(m => {
                const d = modelData[m.id]?.daily
                return d && (d.temperature_2m_min[dayIdx] != null || d.temperature_2m_max[dayIdx] != null)
              })
              const temps_min = validModels.map(m => modelData[m.id]?.daily?.temperature_2m_min?.[dayIdx])
              const temps_max = validModels.map(m => modelData[m.id]?.daily?.temperature_2m_max?.[dayIdx])
              const rains = validModels.map(m => modelData[m.id]?.daily?.precipitation_sum?.[dayIdx])
              const winds = validModels.map(m => modelData[m.id]?.daily?.windspeed_10m_max?.[dayIdx])

              return (
                <button key={dayIdx} onClick={() => setSelectedDay(dayIdx)}
                  className="w-full rounded-2xl px-4 py-3 shadow-sm text-left active:scale-98 transition-transform"
                  style={{ background: card, border: `1px solid ${border}` }}>

                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">{WMO_ICONS[refDay?.weathercode?.[dayIdx] ?? 0] || '🌡️'}</span>
                    <p className="text-sm font-bold flex-1" style={{ color: textPri }}>{formatDay(date, dayIdx)}</p>
                    <p className="text-xs" style={{ color: textSec }}>{WMO_LABELS[refDay?.weathercode?.[dayIdx] ?? 0] || ''}</p>
                    <ChevronRight size={14} style={{ color: dark ? '#4338ca' : '#d1d5db' }} />
                  </div>

                  <div className="flex items-center gap-4 mb-3 px-1">
                    <div className="flex items-baseline gap-1">
                      <span className="text-blue-500 font-bold text-lg">{avg(temps_min) ?? '—'}°</span>
                      <span style={{ color: dark ? '#4338ca' : '#d1d5db' }}>/</span>
                      <span className="text-orange-500 font-bold text-lg">{avg(temps_max) ?? '—'}°</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Droplets size={13} className="text-blue-400" />
                      <span className="text-sm font-semibold" style={{ color: textMed }}>{avgF(rains) ?? '—'}mm</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Wind size={13} style={{ color: textSec }} />
                      <span className="text-sm font-semibold" style={{ color: textMed }}>{avg(winds) ?? '—'}km/h</span>
                    </div>
                    <span className="text-xs ml-auto" style={{ color: dark ? '#4338ca' : '#d1d5db' }}>{validModels.length} modèles</span>
                  </div>

                  <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${Math.min(validModels.length, 6)}, 1fr)` }}>
                    {validModels.map(m => {
                      const d = modelData[m.id]?.daily
                      const tMin = d.temperature_2m_min[dayIdx]
                      const tMax = d.temperature_2m_max[dayIdx]
                      const rain = d.precipitation_sum[dayIdx]
                      const wind = d.windspeed_10m_max[dayIdx]
                      return (
                        <div key={m.id} className="rounded-xl px-1 py-1.5 text-center" style={{ background: m.color + '15' }}>
                          <p className="font-bold" style={{ color: m.color, fontSize: '9px' }}>{m.label}</p>
                          <p style={{ fontSize: '8px', color: textSec }}>{m.precision}</p>
                          <p className="font-bold mt-0.5" style={{ fontSize: '9px', color: textMed }}>
                            {tMin != null ? Math.round(tMin) : '—'}°/{tMax != null ? Math.round(tMax) : '—'}°
                          </p>
                          <div className="flex items-center justify-center gap-0.5 mt-0.5">
                            <Droplets size={7} className="text-blue-400" />
                            <span style={{ fontSize: '8px', color: textSec }}>{rain != null ? nv(rain).toFixed(1) : '—'}</span>
                          </div>
                          <div className="flex items-center justify-center gap-0.5">
                            <Wind size={7} style={{ color: textSec }} />
                            <span style={{ fontSize: '8px', color: textSec }}>{wind != null ? Math.round(wind) : '—'}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Liens externes */}
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: textSec }}>Voir aussi</p>
          <div className="grid grid-cols-3 gap-2 mb-6">
            {[
              { label: meteoCielLabel, url: meteoCiel },
              { label: '🌬️ Windy', url: windy },
              { label: weather24Label, url: weather24 },
            ].map((l, i) => (
              <a key={i} href={l.url} target="_blank" rel="noopener noreferrer"
                className="rounded-xl py-3 text-center text-xs font-semibold shadow-sm"
                style={{ background: card, border: `1px solid ${border}`, color: textMed }}>
                {l.label}
              </a>
            ))}
          </div>
        </div>

      ) : (

        // ─── HEURE PAR HEURE ─────────────────────────────────────────────
        <div className="px-4 py-4 max-w-lg mx-auto">
          <button onClick={() => setSelectedDay(null)}
            className="flex items-center gap-1.5 mb-4 text-sm"
            style={{ color: textSec }}>
            <ArrowLeft size={16} /> Retour aux 7 jours
          </button>

          <h3 className="font-bold mb-1" style={{ color: textPri }}>{formatDay(dates[selectedDay], selectedDay)}</h3>

          {(() => {
            const dayModels = getModelsForDay(selectedDay, cc).filter(m => modelData[m.id])
            const refModelId = dayModels.reduce((best, m) => {
              const hrs = getHours(m.id, selectedDay).filter(h => h.hasData).length
              const bestHrs = getHours(best, selectedDay).filter(h => h.hasData).length
              return hrs > bestHrs ? m.id : best
            }, dayModels[0]?.id)
            const refHours = getHours(refModelId, selectedDay).filter(h => h.hasData)

            return (
              <>
                <div className="flex flex-wrap gap-2 mb-4">
                  {dayModels.map(m => (
                    <div key={m.id} className="flex items-center gap-1 px-2 py-1 rounded-full" style={{ background: m.color + '20' }}>
                      <div className="w-2 h-2 rounded-full" style={{ background: m.color }} />
                      <span className="text-xs font-semibold" style={{ color: m.color }}>{m.label}</span>
                      <span className="text-xs" style={{ color: textSec }}>{m.precision}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  {refHours.map((h, i) => {
                    const hourDataByModel = dayModels.map(m => {
                      const hrs = getHours(m.id, selectedDay)
                      return hrs.find(hh => hh.hour === h.hour && hh.hasData) || null
                    }).filter(Boolean)

                    if (hourDataByModel.length === 0) return null

                    const avgTemp = avg(hourDataByModel.map(x => x.temp))
                    const avgRain = avgF(hourDataByModel.map(x => x.rain))
                    const avgWind = avg(hourDataByModel.map(x => x.wind))

                    const validForHour = dayModels.filter(m => {
                      const hrs = getHours(m.id, selectedDay)
                      return hrs.find(hh => hh.hour === h.hour && hh.hasData)
                    })

                    return (
                      <div key={i} className="rounded-2xl px-4 py-3 shadow-sm"
                        style={{ background: card, border: `1px solid ${border}` }}>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-sm font-bold w-8" style={{ color: textSec }}>{h.hour}</span>
                          <span className="text-lg">{WMO_ICONS[h.code] || '🌡️'}</span>
                          <span className="text-lg font-bold" style={{ color: textPri }}>{avgTemp ?? '—'}°</span>
                          <div className="flex items-center gap-1">
                            <Droplets size={11} className="text-blue-400" />
                            <span className="text-xs" style={{ color: textMed }}>{avgRain ?? '—'}mm</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Wind size={11} style={{ color: textSec }} />
                            <span className="text-xs" style={{ color: textMed }}>{avgWind ?? '—'}km/h</span>
                          </div>
                        </div>
                        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${Math.min(validForHour.length, 6)}, 1fr)` }}>
                          {validForHour.map(m => {
                            const hrs = getHours(m.id, selectedDay)
                            const hh = hrs.find(x => x.hour === h.hour && x.hasData)
                            if (!hh) return null
                            return (
                              <div key={m.id} className="rounded-xl px-1 py-1.5 text-center" style={{ background: m.color + '15' }}>
                                <p className="font-bold" style={{ color: m.color, fontSize: '9px' }}>{m.label}</p>
                                <p className="font-bold mt-0.5" style={{ fontSize: '10px', color: textMed }}>{hh.temp != null ? Math.round(hh.temp) : '—'}°</p>
                                <div className="flex items-center justify-center gap-0.5 mt-0.5">
                                  <Droplets size={7} className="text-blue-400" />
                                  <span style={{ fontSize: '8px', color: textSec }}>{hh.rain != null ? nv(hh.rain).toFixed(1) : '—'}</span>
                                </div>
                                <div className="flex items-center justify-center gap-0.5">
                                  <Wind size={7} style={{ color: textSec }} />
                                  <span style={{ fontSize: '8px', color: textSec }}>{hh.wind != null ? Math.round(hh.wind) : '—'}</span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )
          })()}
        </div>
      )}

      {/* Modal recherche */}
      {showSearch && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={() => setShowSearch(false)}>
          <div className="w-full rounded-t-3xl p-6 max-h-96 overflow-y-auto"
            style={{ background: card }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg" style={{ color: textPri }}>Ajouter une ville</h2>
              <button onClick={() => setShowSearch(false)}>
                <X size={20} style={{ color: textSec }} />
              </button>
            </div>
            <div className="flex gap-2 mb-4">
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="Nom de ville…"
                className="flex-1 px-4 py-3 rounded-xl text-sm focus:outline-none"
                style={{
                  background: dark ? '#0f0a1e' : '#f9fafb',
                  border: `1px solid ${dark ? '#4338ca' : '#e5e7eb'}`,
                  color: textPri,
                }} />
              <button onClick={handleSearch} disabled={searching}
                className="px-4 py-3 rounded-xl text-sm disabled:opacity-40"
                style={{ background: dark ? '#7c3aed' : '#111827', color: '#fff' }}>
                {searching ? '…' : 'OK'}
              </button>
            </div>
            <div className="space-y-2">
              {searchResults.map((city, i) => (
                <button key={i} onClick={() => addFavorite(city)}
                  className="w-full text-left px-4 py-3 rounded-xl transition-colors"
                  style={{ background: dark ? '#2d1f5e' : '#f9fafb' }}>
                  <p className="font-semibold text-sm" style={{ color: textPri }}>{city.name}</p>
                  <p className="text-xs" style={{ color: textSec }}>{city.admin1}, {city.country}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}