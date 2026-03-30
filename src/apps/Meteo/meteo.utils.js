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

export const WMO_ICONS = {
  0:'☀️',1:'🌤️',2:'⛅',3:'☁️',45:'🌫️',48:'🌫️',
  51:'🌦️',53:'🌦️',55:'🌧️',61:'🌧️',63:'🌧️',65:'🌧️',
  71:'🌨️',73:'🌨️',75:'❄️',80:'🌦️',81:'🌧️',82:'⛈️',
  95:'⛈️',96:'⛈️',99:'⛈️',
}

export function getConseil(code, wind = null) {
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

export async function fetchWeatherForCity(city) {
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

export async function fetchCurrentHourWeather(city) {
  const ALL_MODELS = [
    { id: 'arome_france', countries: ['FR'] },
    { id: 'icon_d2', countries: null },
    { id: 'icon_eu', countries: null },
    { id: 'meteofrance_seamless', countries: ['FR'] },
    { id: 'best_match', countries: null },
    { id: 'gfs_seamless', countries: null },
  ]

  try {
    const cc = (city.country || 'FR').toUpperCase()
    const applicable = ALL_MODELS.filter(m => !m.countries || m.countries.includes(cc))
    
    const modelPromises = applicable.map(async (model) => {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}` +
          `&hourly=temperature_2m,weathercode,precipitation,windspeed_10m` +
          `&daily=temperature_2m_max,temperature_2m_min` +
          `&timezone=Europe%2FParis&forecast_days=1&models=${model.id}`
        
        const r = await fetch(url)
        const d = await r.json()
        if (d.error || !d.hourly || !d.daily) return null
        
        const now = new Date()
        const today = new Date().toISOString().split('T')[0]
        
        // Utiliser la même logique que l'app météo pour trouver l'heure actuelle
        const currentHourData = d.hourly.time
          .map((timeString, index) => ({ timeString, index }))
          .filter(({ timeString }) => {
            // Garder uniquement les heures d'aujourd'hui
            return timeString.startsWith(today)
          })
          .map(({ index }) => ({
            temp: d.hourly.temperature_2m[index],
            code: d.hourly.weathercode[index] ?? 0,
            rain: d.hourly.precipitation[index],
            wind: d.hourly.windspeed_10m[index],
            hour: new Date(d.hourly.time[index]).getHours(),
            hasData: d.hourly.temperature_2m[index] != null,
          }))
        
        // Trouver l'heure exacte ou la plus proche
        const currentHour = currentHourData.find(h => h.hour === now.getHours()) || 
                           currentHourData[0] // fallback: première heure disponible
        
        if (!currentHour) return null
        
        return {
          ...currentHour,
          tMin: d.daily.temperature_2m_min?.[0] ?? null,
          tMax: d.daily.temperature_2m_max?.[0] ?? null,
        }
      } catch { return null }
    })
    
    const results = await Promise.all(modelPromises)
    const validResults = results.filter(r => r != null)
    
    if (validResults.length === 0) return null
    
    const avg = arr => {
      const valid = arr.filter(v => v != null && !isNaN(v))
      return valid.length ? Math.round(valid.reduce((a, b) => a + b, 0) / valid.length) : null
    }
    
    const avgF = arr => {
      const valid = arr.filter(v => v != null && !isNaN(v))
      return valid.length ? (valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(1) : null
    }
    
    const temps = validResults.map(r => r.temp)
    const codes = validResults.map(r => r.code)
    const rains = validResults.map(r => r.rain)
    const winds = validResults.map(r => r.wind)
    const tMins = validResults.map(r => r.tMin)
    const tMaxs = validResults.map(r => r.tMax)
    
    return {
      code: codes[Math.floor(codes.length / 2)] ?? null,
      avg: avg(temps), // Température actuelle (moyenne des modèles)
      tMin: avg(tMins), // Température min de la journée (moyenne des modèles)
      tMax: avg(tMaxs), // Température max de la journée (moyenne des modèles)
      rain: avgF(rains),
      wind: avg(winds),
    }
  } catch { return null }
}
