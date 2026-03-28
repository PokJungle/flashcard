import { useState, useEffect } from 'react'

export const DEFAULT_METEO_CITY = { name:'Saint-Antonin-sur-Bayon', lat:43.5308, lon:5.6078, country:'FR' }

export function getPreferredCity(profileId) {
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

export default function MeteoWidget({ profileId, onOpenCityPicker, onClick }) {
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
