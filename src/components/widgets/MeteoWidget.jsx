import { useState, useEffect } from 'react'
import { getPreferredCity, fetchCurrentHourWeather, WMO_ICONS, getConseil } from '../../apps/Meteo/meteo.utils'

export default function MeteoWidget({ profileId, onOpenCityPicker, onClick }) {
  const [weather, setWeather] = useState(null)
  const [city, setCity]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profileId) return
    const loadWeather = async () => {
      setLoading(true)
      const c = getPreferredCity(profileId)
      setCity(c)
      const w = await fetchCurrentHourWeather(c)
      setWeather(w)
      setLoading(false)
    }
    loadWeather()
  }, [profileId])

  const conseil = weather ? getConseil(weather.code, weather.wind) : null
  const icon    = loading ? '…' : (WMO_ICONS[weather?.code] ?? '🌡️')

  return (
    <button onClick={onClick}
      className="text-left rounded-2xl px-3 py-2.5 active:scale-95 transition-all relative overflow-hidden flex flex-col justify-between flex-1"
      style={{ background:'#4f3ea0' }}>
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
