import { useState, useEffect } from 'react'
import { Search, StarOff, Wind, Droplets, ChevronRight, ArrowLeft, X } from 'lucide-react'

const DEFAULT_CITY = { name: 'Saint-Antonin-sur-Bayon', lat: 43.5308, lon: 5.6078 }

const MODELS = [
  { id: 'best_match',           label: 'ECMWF',    color: '#6A9BCC' },
  { id: 'meteofrance_seamless', label: 'Météo FR', color: '#4CAF82' },
  { id: 'gfs_seamless',         label: 'GFS',      color: '#CC6A8A' },
]

const WMO_ICONS = {
  0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
  45: '🌫️', 48: '🌫️',
  51: '🌦️', 53: '🌦️', 55: '🌧️',
  61: '🌧️', 63: '🌧️', 65: '🌧️',
  71: '🌨️', 73: '🌨️', 75: '❄️',
  80: '🌦️', 81: '🌧️', 82: '⛈️',
  95: '⛈️', 96: '⛈️', 99: '⛈️',
}

const WMO_LABELS = {
  0: 'Ciel dégagé', 1: 'Peu nuageux', 2: 'Partiellement nuageux', 3: 'Couvert',
  45: 'Brouillard', 48: 'Brouillard givrant',
  51: 'Bruine légère', 53: 'Bruine', 55: 'Bruine forte',
  61: 'Pluie légère', 63: 'Pluie', 65: 'Pluie forte',
  71: 'Neige légère', 73: 'Neige', 75: 'Neige forte',
  80: 'Averses légères', 81: 'Averses', 82: 'Averses fortes',
  95: 'Orage', 96: 'Orage avec grêle', 99: 'Orage violent',
}

const DAYS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
const MONTHS_FR = ['jan', 'fév', 'mar', 'avr', 'mai', 'jun', 'jul', 'aoû', 'sep', 'oct', 'nov', 'déc']

const n = v => v == null ? 0 : v  // helper null-safe

function formatDay(dateStr, idx) {
  const d = new Date(dateStr)
  if (idx === 0) return "Aujourd'hui"
  if (idx === 1) return 'Demain'
  return `${DAYS_FR[d.getDay()]} ${d.getDate()} ${MONTHS_FR[d.getMonth()]}`
}

function formatHour(isoStr) {
  return `${String(new Date(isoStr).getHours()).padStart(2, '0')}h`
}

async function fetchModel(lat, lon, model) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max` +
    `&hourly=temperature_2m,weathercode,precipitation,windspeed_10m,relativehumidity_2m` +
    `&timezone=Europe%2FParis&forecast_days=7&models=${model}`
  const r = await fetch(url)
  return r.json()
}

async function searchCity(query) {
  const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=fr&format=json`)
  const d = await r.json()
  return d.results || []
}

export default function Meteo() {
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('meteo-favorites') || 'null') || [DEFAULT_CITY] }
    catch { return [DEFAULT_CITY] }
  })
  const [activeCity, setActiveCity] = useState(favorites[0])
  const [models, setModels] = useState({})
  const [loading, setLoading] = useState(false)
  const [selectedDay, setSelectedDay] = useState(null)
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    localStorage.setItem('meteo-favorites', JSON.stringify(favorites))
  }, [favorites])

  useEffect(() => { if (activeCity) loadWeather() }, [activeCity])

  const loadWeather = async () => {
    setLoading(true)
    setSelectedDay(null)
    setModels({})
    try {
      const results = await Promise.all(MODELS.map(m => fetchModel(activeCity.lat, activeCity.lon, m.id)))
      const map = {}
      MODELS.forEach((m, i) => { map[m.id] = results[i] })
      setModels(map)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setSearching(true)
    setSearchResults(await searchCity(searchQuery))
    setSearching(false)
  }

  const addFavorite = (city) => {
    const c = { name: city.name + (city.admin1 ? `, ${city.admin1}` : ''), lat: city.latitude, lon: city.longitude }
    if (!favorites.find(f => f.lat === c.lat && f.lon === c.lon)) setFavorites(prev => [...prev, c])
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

  const getHours = (modelId) => {
    const data = models[modelId]
    if (!data || selectedDay === null) return []
    const dateStr = ref?.daily?.time?.[selectedDay]
    if (!dateStr) return []
    return data.hourly.time
      .map((t, i) => ({ t, i }))
      .filter(({ t }) => t.startsWith(dateStr))
      .map(({ t, i }) => ({
        hour: formatHour(t),
        temp: Math.round(n(data.hourly.temperature_2m[i])),
        code: data.hourly.weathercode[i] ?? 0,
        rain: n(data.hourly.precipitation[i]).toFixed(1),
        wind: Math.round(n(data.hourly.windspeed_10m[i])),
        humidity: Math.round(n(data.hourly.relativehumidity_2m[i])),
      }))
  }

  const ref = models['best_match']
  const dates = ref?.daily?.time || []

  const windy = `https://www.windy.com/?${activeCity.lat},${activeCity.lon},12`
  const meteoCiel = `https://www.meteociel.fr/previsions/${activeCity.name.split(',')[0].toLowerCase().replace(/ /g, '-')}.htm`
  const weather24 = `https://fr.weather24.com/france/${activeCity.name.split(',')[0].toLowerCase().replace(/ /g, '-')}`

  return (
    <div className="h-full bg-gray-50 overflow-y-auto">

      {/* Favoris */}
      <div className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {favorites.map((city, i) => (
            <button key={i} onClick={() => setActiveCity(city)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${activeCity.lat === city.lat ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}>
              {city.name.split(',')[0]}
            </button>
          ))}
          <button onClick={() => setShowSearch(true)}
            className="flex-shrink-0 w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
            <Search size={16} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full animate-spin" style={{ border: '3px solid #e5e7eb', borderTopColor: '#374151' }} />
        </div>

      ) : selectedDay === null ? (

        // ─── 7 JOURS ─────────────────────────────────────────────────────
        <div className="px-4 py-4 max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{activeCity.name.split(',')[0]}</h2>
              <p className="text-xs text-gray-400">Comparatif 3 modèles · 7 jours</p>
            </div>
            {favorites.length > 1 && (
              <button onClick={() => removeFavorite(activeCity)} className="p-2 text-gray-300 hover:text-red-400 transition-colors">
                <StarOff size={18} />
              </button>
            )}
          </div>

          {/* Légende */}
          <div className="flex gap-3 mb-4">
            {MODELS.map(m => (
              <div key={m.id} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: m.color }} />
                <span className="text-xs text-gray-500 font-medium">{m.label}</span>
              </div>
            ))}
          </div>

          {/* 7 jours */}
          <div className="space-y-2 mb-6">
            {dates.map((date, i) => (
              <button key={i} onClick={() => setSelectedDay(i)}
                className="w-full bg-white rounded-2xl px-4 py-3 border border-gray-100 shadow-sm text-left active:scale-98 transition-transform">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{WMO_ICONS[ref?.daily?.weathercode?.[i] ?? 0] || '🌡️'}</span>
                  <p className="text-sm font-bold text-gray-900 flex-1">{formatDay(date, i)}</p>
                  <p className="text-xs text-gray-400">{WMO_LABELS[ref?.daily?.weathercode?.[i] ?? 0] || ''}</p>
                  <ChevronRight size={14} className="text-gray-300" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {MODELS.map(m => {
                    const d = models[m.id]?.daily
                    if (!d) return <div key={m.id} className="rounded-xl px-2 py-1.5 text-center animate-pulse bg-gray-100 h-16" />
                    return (
                      <div key={m.id} className="rounded-xl px-2 py-1.5 text-center" style={{ background: m.color + '15' }}>
                        <p className="text-xs font-bold mb-0.5" style={{ color: m.color }}>{m.label}</p>
                        <p className="text-xs font-bold text-gray-800">
                          {Math.round(n(d.temperature_2m_min[i]))}° / {Math.round(n(d.temperature_2m_max[i]))}°
                        </p>
                        <div className="flex items-center justify-center gap-1 mt-0.5">
                          <Droplets size={9} className="text-blue-400" />
                          <span className="text-xs text-gray-400">{n(d.precipitation_sum[i]).toFixed(1)}mm</span>
                        </div>
                        <div className="flex items-center justify-center gap-1">
                          <Wind size={9} className="text-gray-400" />
                          <span className="text-xs text-gray-400">{Math.round(n(d.windspeed_10m_max[i]))}km/h</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </button>
            ))}
          </div>

          {/* Liens externes */}
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Voir aussi</p>
          <div className="grid grid-cols-3 gap-2 mb-6">
            {[
              { label: '🌬️ Windy', url: windy },
              { label: '🌦️ MétéoCiel', url: meteoCiel },
              { label: '🌡️ Weather24', url: weather24 },
            ].map((l, i) => (
              <a key={i} href={l.url} target="_blank" rel="noopener noreferrer"
                className="bg-white rounded-xl py-3 text-center text-xs font-semibold text-gray-700 border border-gray-100 shadow-sm">
                {l.label}
              </a>
            ))}
          </div>
        </div>

      ) : (

        // ─── HEURE PAR HEURE ─────────────────────────────────────────────
        <div className="px-4 py-4 max-w-lg mx-auto">
          <button onClick={() => setSelectedDay(null)}
            className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 mb-4 text-sm">
            <ArrowLeft size={16} /> Retour aux 7 jours
          </button>

          <h3 className="font-bold text-gray-900 mb-1">{formatDay(dates[selectedDay], selectedDay)}</h3>
          <p className="text-xs text-gray-400 mb-4">Comparatif heure par heure · 3 modèles</p>

          <div className="flex gap-3 mb-3">
            {MODELS.map(m => (
              <div key={m.id} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: m.color }} />
                <span className="text-xs text-gray-500 font-medium">{m.label}</span>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            {getHours('best_match').map((h, i) => {
              const mf = getHours('meteofrance_seamless')[i]
              const gfs = getHours('gfs_seamless')[i]
              return (
                <div key={i} className="bg-white rounded-2xl px-4 py-3 border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-bold text-gray-400 w-8">{h.hour}</span>
                    <span className="text-lg">{WMO_ICONS[h.code] || '🌡️'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { model: MODELS[0], data: h },
                      { model: MODELS[1], data: mf },
                      { model: MODELS[2], data: gfs },
                    ].map(({ model, data }) => !data ? null : (
                      <div key={model.id} className="rounded-xl px-2 py-1.5 text-center" style={{ background: model.color + '15' }}>
                        <p className="text-xs font-bold mb-1" style={{ color: model.color }}>{model.label}</p>
                        <p className="text-sm font-bold text-gray-800">{data.temp}°</p>
                        <div className="flex items-center justify-center gap-1 mt-0.5">
                          <Droplets size={9} className="text-blue-400" />
                          <span className="text-xs text-gray-400">{data.rain}mm</span>
                        </div>
                        <div className="flex items-center justify-center gap-1">
                          <Wind size={9} className="text-gray-400" />
                          <span className="text-xs text-gray-400">{data.wind}km/h</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Modal recherche */}
      {showSearch && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={() => setShowSearch(false)}>
          <div className="bg-white w-full rounded-t-3xl p-6 max-h-96 overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg">Ajouter une ville</h2>
              <button onClick={() => setShowSearch(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="flex gap-2 mb-4">
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="Nom de ville…"
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none text-sm" />
              <button onClick={handleSearch} disabled={searching}
                className="px-4 py-3 bg-gray-900 text-white rounded-xl text-sm disabled:opacity-40">
                {searching ? '…' : 'OK'}
              </button>
            </div>
            <div className="space-y-2">
              {searchResults.map((city, i) => (
                <button key={i} onClick={() => addFavorite(city)}
                  className="w-full text-left px-4 py-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <p className="font-semibold text-gray-900 text-sm">{city.name}</p>
                  <p className="text-xs text-gray-400">{city.admin1}, {city.country}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}