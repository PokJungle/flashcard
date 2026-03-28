// Utilitaires de dates partagés par toutes les apps

/** Retourne le lundi de la semaine courante (ou de la date fournie) à 00:00:00 */
export function getWeekStart(date = new Date()) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

/** Retourne le dimanche de la semaine (dernier jour à 23:59:59) */
export function getWeekEnd(weekStart) {
  const d = new Date(weekStart)
  d.setDate(d.getDate() + 6)
  d.setHours(23, 59, 59, 999)
  return d
}

/** Retourne la date du lundi courant au format YYYY-MM-DD */
export function getStartOfWeekKey() {
  const d = getWeekStart()
  return d.toISOString().split('T')[0]
}

/** Retourne la date du jour au format YYYY-MM-DD (pour les clés localStorage) */
export function getTodayKey() {
  return new Date().toISOString().slice(0, 10)
}

/** Formate un timestamp ISO en temps relatif ("à l'instant", "il y a 5 min", etc.) */
export function timeAgo(isoStr) {
  const diff = Math.floor((Date.now() - new Date(isoStr)) / 1000)
  if (diff < 60) return "à l'instant"
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`
  const d = new Date(isoStr)
  return `${d.getDate()}/${d.getMonth() + 1}`
}

/** Nombre de jours jusqu'à une date (gère les récurrences annuelles) */
export function daysUntil(dateStr, isAnnual = false) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  let target = new Date(dateStr + 'T00:00:00')
  if (isAnnual) {
    target.setFullYear(today.getFullYear())
    if (target < today) target.setFullYear(today.getFullYear() + 1)
  }
  return Math.round((target - today) / 86400000)
}
