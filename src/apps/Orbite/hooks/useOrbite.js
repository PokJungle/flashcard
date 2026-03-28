import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../../supabase'
import { getWeekStart, getWeekEnd } from '../../../utils/dateUtils'

const DEFAULT_SETTINGS = {
  daily_goal: 1000,
  weekly_rocket_target: 10000,
  rate_walk: 1,
  rate_run_km: 1750,
  rate_run_min: 250,
  rate_workout_min: 150,
  rate_workout_sessions: 500,
}


export function useOrbite(profile) {
  const [activities, setActivities] = useState([])
  const [allProfiles, setAllProfiles] = useState([])
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [weekHistory, setWeekHistory] = useState([])
  const [loading, setLoading] = useState(true)

  const weekStart = getWeekStart()
  const weekEnd = getWeekEnd(weekStart)

  const fetchAll = useCallback(async () => {
    if (!profile) return
    setLoading(true)

    const { data: profilesData } = await supabase.from('profiles').select('*')
    setAllProfiles(profilesData || [])

    const { data: acts } = await supabase
      .from('orbite_activities')
      .select('*')
      .gte('created_at', weekStart.toISOString())
      .lte('created_at', weekEnd.toISOString())
      .order('created_at', { ascending: false })
    setActivities(acts || [])

    const { data: settingsData } = await supabase
      .from('orbite_settings')
      .select('*')
      .eq('profile_id', profile.id)
      .single()
    if (settingsData) setSettings({ ...DEFAULT_SETTINGS, ...settingsData })

    // Historique 8 semaines
    const eightWeeksAgo = new Date(weekStart)
    eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56)
    const { data: histActs } = await supabase
      .from('orbite_activities')
      .select('*')
      .gte('created_at', eightWeeksAgo.toISOString())
      .lt('created_at', weekStart.toISOString())
      .order('created_at', { ascending: false })

    const target = settingsData?.weekly_rocket_target ?? DEFAULT_SETTINGS.weekly_rocket_target

    const weeks = []
    for (let i = 1; i <= 8; i++) {
      const wStart = new Date(weekStart)
      wStart.setDate(wStart.getDate() - i * 7)
      const wEnd = getWeekEnd(wStart)
      const wActs = (histActs || []).filter(a => {
        const d = new Date(a.created_at)
        return d >= wStart && d <= wEnd
      })
      const propsByProfile = {}
      wActs.forEach(a => {
        propsByProfile[a.profile_id] = (propsByProfile[a.profile_id] || 0) + a.props
      })
      const totalProps = Object.values(propsByProfile).reduce((s, v) => s + v, 0)
      const winner = Object.entries(propsByProfile).sort((a, b) => b[1] - a[1])[0]
      weeks.push({
        weekStart: wStart,
        propsByProfile,
        totalProps,
        winner: winner ? winner[0] : null,
        rocketLaunched: totalProps >= target,
      })
    }
    setWeekHistory(weeks)
    setLoading(false)
  }, [profile])

  useEffect(() => { fetchAll() }, [fetchAll])

  const computeProps = useCallback((type, value, unit, s = settings) => {
    if (type === 'walk') return Math.round(value * s.rate_walk)
    if (type === 'run') {
      if (unit === 'km') return Math.round(value * s.rate_run_km)
      return Math.round(value * s.rate_run_min)
    }
    if (type === 'workout') {
      if (unit === 'sessions') return Math.round(value * s.rate_workout_sessions)
      return Math.round(value * s.rate_workout_min)
    }
    return 0
  }, [settings])

  const logActivity = useCallback(async (type, value, unit) => {
    const props = computeProps(type, value, unit)
    const { data, error } = await supabase.from('orbite_activities').insert({
      profile_id: profile.id,
      type,
      value,
      unit,
      props,
    }).select().single()
    if (!error) setActivities(prev => [data, ...prev])
    return { props, error }
  }, [profile, computeProps])

  const saveSettings = useCallback(async (newSettings) => {
    const merged = { ...settings, ...newSettings, profile_id: profile.id }
    const { error } = await supabase
      .from('orbite_settings')
      .upsert(merged, { onConflict: 'profile_id' })
    if (!error) setSettings(merged)
    return { error }
  }, [profile, settings])

  const deleteActivity = useCallback(async (id) => {
    const { error } = await supabase.from('orbite_activities').delete().eq('id', id)
    if (!error) setActivities(prev => prev.filter(a => a.id !== id))
    return { error }
  }, [])

  // Stats semaine courante
  const propsByProfile = {}
  activities.forEach(a => {
    propsByProfile[a.profile_id] = (propsByProfile[a.profile_id] || 0) + a.props
  })
  const myProps = propsByProfile[profile?.id] || 0
  const totalProps = Object.values(propsByProfile).reduce((s, v) => s + v, 0)
  const weeklyTarget = settings.weekly_rocket_target || DEFAULT_SETTINGS.weekly_rocket_target
  const rocketProgress = Math.min(totalProps / weeklyTarget, 1)
  const rocketLaunched = totalProps >= weeklyTarget

  // Streak
  const computeStreak = useCallback((profileId) => {
    const dayProps = {}
    activities
      .filter(a => a.profile_id === profileId)
      .forEach(a => {
        const day = new Date(a.created_at).toDateString()
        dayProps[day] = (dayProps[day] || 0) + a.props
      })
    let streak = 0
    const today = new Date()
    for (let i = 0; i < 30; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const key = d.toDateString()
      if ((dayProps[key] || 0) >= settings.daily_goal) streak++
      else if (i > 0) break
    }
    return streak
  }, [activities, settings.daily_goal])

  const encouragementMessage = useCallback(() => {
    if (allProfiles.length < 2) return null
    const other = allProfiles.find(p => p.id !== profile?.id)
    if (!other) return null
    const myP = propsByProfile[profile?.id] || 0
    const otherP = propsByProfile[other.id] || 0
    if (myP >= otherP) return null
    const diff = otherP - myP
    const msgs = [
      `${other.avatar} a ${diff.toLocaleString()} Props d'avance… La fusée t'attend ! 🔥`,
      `Tu es à ${diff.toLocaleString()} Props de rattraper ${other.name}. Allez ! 💪`,
      `${diff.toLocaleString()} Props séparent la victoire de toi. C'est rien ! 🚀`,
    ]
    return msgs[Math.floor(Math.random() * msgs.length)]
  }, [profile, allProfiles, propsByProfile])

  return {
    activities,
    allProfiles,
    settings,
    weekHistory,
    loading,
    propsByProfile,
    myProps,
    totalProps,
    rocketProgress,
    rocketLaunched,
    weekStart,
    weeklyTarget,
    logActivity,
    saveSettings,
    deleteActivity,
    computeProps,
    computeStreak,
    encouragementMessage,
    refresh: fetchAll,
  }
}