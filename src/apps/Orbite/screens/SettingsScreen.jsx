import { useState } from 'react'

export default function SettingsScreen({ profile, hook }) {
  const { settings, saveSettings } = hook
  const [form, setForm] = useState({ ...settings })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleChange = (key, val) => {
    setForm(prev => ({ ...prev, [key]: parseFloat(val) || 0 }))
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true)
    await saveSettings(form)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const Field = ({ label, hint, fieldKey }) => (
    <div className="orbite-setting-field">
      <div className="orbite-setting-field-info">
        <span className="orbite-setting-field-label">{label}</span>
        <span className="orbite-setting-field-hint">{hint}</span>
      </div>
      <input
        type="number"
        min="0"
        step="any"
        className="orbite-setting-input"
        value={form[fieldKey]}
        onChange={e => handleChange(fieldKey, e.target.value)}
      />
    </div>
  )

  return (
    <div className="orbite-settings">
      <div className="orbite-settings-title">Paramètres</div>

      <div className="orbite-settings-section">
        <div className="orbite-settings-section-title">🎯 Objectif journalier</div>
        <Field
          label="Props / jour pour le streak"
          hint="Atteindre cet objectif chaque jour maintient le streak"
          fieldKey="daily_goal"
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
        <Field label="1 séance =" hint="Props par séance" fieldKey="rate_workout_sessions" />
      </div>

      <div className="orbite-settings-preview">
        <div className="orbite-settings-preview-title">Aperçu conversions</div>
        <div className="orbite-settings-preview-list">
          <span>10 000 pas → {Math.round(10000 * form.rate_walk).toLocaleString()} Props</span>
          <span>5 km → {Math.round(5 * form.rate_run_km).toLocaleString()} Props</span>
          <span>30 min course → {Math.round(30 * form.rate_run_min).toLocaleString()} Props</span>
          <span>1 séance renfo → {Math.round(form.rate_workout_sessions).toLocaleString()} Props</span>
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
