import { useState, useEffect, useRef } from 'react'

const WEEKLY_ROCKET_TARGET_DEFAULT = 10000

export default function SettingsScreen({ profile, hook }) {
  const { settings, saveSettings } = hook

  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Ref pour savoir si on a déjà initialisé — évite tout re-sync parasite
  const initialized = useRef(false)

  useEffect(() => {
    if (settings && !initialized.current) {
      initialized.current = true
      setForm({
        daily_goal: String(settings.daily_goal ?? 1000),
        weekly_rocket_target: String(settings.weekly_rocket_target ?? WEEKLY_ROCKET_TARGET_DEFAULT),
        rate_walk: String(settings.rate_walk ?? 1),
        rate_run_km: String(settings.rate_run_km ?? 1750),
        rate_run_min: String(settings.rate_run_min ?? 250),
        rate_workout_min: String(settings.rate_workout_min ?? 150),
        rate_workout_sessions: String(settings.rate_workout_sessions ?? 500),
      })
    }
  }, [settings])

  const handleChange = (key) => (e) => {
    setForm(prev => ({ ...prev, [key]: e.target.value }))
    setSaved(false)
  }

  const handleSave = async () => {
    const numeric = {}
    Object.entries(form).forEach(([k, v]) => {
      numeric[k] = parseFloat(v.replace(',', '.')) || 0
    })
    setSaving(true)
    await saveSettings(numeric)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (!form) return (
    <div className="orbite-settings">
      <div className="orbite-empty" style={{ paddingTop: 60 }}>Chargement…</div>
    </div>
  )

  const f = {}
  Object.entries(form).forEach(([k, v]) => { f[k] = parseFloat(v.replace(',', '.')) || 0 })

  // type="text" inputMode="numeric" = clavier numérique SANS le bug de re-render de type="number"
  const Field = ({ label, hint, fieldKey }) => (
    <div className="orbite-setting-field">
      <div className="orbite-setting-field-info">
        <span className="orbite-setting-field-label">{label}</span>
        <span className="orbite-setting-field-hint">{hint}</span>
      </div>
      <input
        type="text"
        inputMode="decimal"
        pattern="[0-9]*[.,]?[0-9]*"
        className="orbite-setting-input"
        value={form[fieldKey]}
        onChange={handleChange(fieldKey)}
        onFocus={e => e.target.select()}
      />
    </div>
  )

  return (
    <div className="orbite-settings">
      <div className="orbite-settings-title">Paramètres</div>

      <div className="orbite-settings-section">
        <div className="orbite-settings-section-title">🎯 Objectifs</div>
        <Field
          label="Props / jour (streak)"
          hint="Objectif journalier pour maintenir le streak"
          fieldKey="daily_goal"
        />
        <Field
          label="Props / semaine (fusée)"
          hint="Total combiné des deux pour faire décoller la fusée"
          fieldKey="weekly_rocket_target"
        />
      </div>

      <div className="orbite-settings-section">
        <div className="orbite-settings-section-title">🚶 Marche</div>
        <Field label="1 pas =" hint="Props par pas" fieldKey="rate_walk" />
      </div>

      <div className="orbite-settings-section">
        <div className="orbite-settings-section-title">🏃 Course</div>
        <Field label="1 km =" hint="Props par kilomètre" fieldKey="rate_run_km" />
        <Field label="1 min =" hint="Props par minute de course" fieldKey="rate_run_min" />
      </div>

      <div className="orbite-settings-section">
        <div className="orbite-settings-section-title">🏋️ Renfo</div>
        <Field label="1 min =" hint="Props par minute de renfo" fieldKey="rate_workout_min" />
        <Field label="1 séance =" hint="Props par séance complète" fieldKey="rate_workout_sessions" />
      </div>

      <div className="orbite-settings-preview">
        <div className="orbite-settings-preview-title">APERÇU CONVERSIONS</div>
        <div className="orbite-settings-preview-list">
          <span>10 000 pas → {Math.round(10000 * f.rate_walk).toLocaleString()} Props</span>
          <span>5 km → {Math.round(5 * f.rate_run_km).toLocaleString()} Props</span>
          <span>30 min course → {Math.round(30 * f.rate_run_min).toLocaleString()} Props</span>
          <span>45 min renfo → {Math.round(45 * f.rate_workout_min).toLocaleString()} Props</span>
          <span>1 séance → {Math.round(f.rate_workout_sessions).toLocaleString()} Props</span>
        </div>
      </div>

      <button
        className={`orbite-btn orbite-btn--full ${saved ? 'orbite-btn--saved' : 'orbite-btn--primary'}`}
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? 'Sauvegarde…' : saved ? '✓ Sauvegardé !' : 'Sauvegarder'}
      </button>
    </div>
  )
}