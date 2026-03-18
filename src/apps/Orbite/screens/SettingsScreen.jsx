import { useRef, useEffect, useState } from 'react'

const FIELDS = [
  {
    section: '🎯 Objectifs',
    fields: [
      { key: 'daily_goal',            label: '1 jour (streak)',    hint: 'Props/jour pour maintenir le streak',          default: 1000  },
      { key: 'weekly_rocket_target',  label: '1 semaine (fusée)',  hint: 'Total combiné pour faire décoller la fusée',   default: 10000 },
    ],
  },
  {
    section: '🚶 Marche',
    fields: [
      { key: 'rate_walk',             label: '1 pas =',            hint: 'Props par pas',                               default: 1     },
    ],
  },
  {
    section: '🏃 Course',
    fields: [
      { key: 'rate_run_km',           label: '1 km =',             hint: 'Props par kilomètre',                         default: 1750  },
      { key: 'rate_run_min',          label: '1 min =',            hint: 'Props par minute de course',                  default: 250   },
    ],
  },
  {
    section: '🏋️ Renfo',
    fields: [
      { key: 'rate_workout_min',      label: '1 min =',            hint: 'Props par minute',                            default: 150   },
      { key: 'rate_workout_sessions', label: '1 séance =',         hint: 'Props par séance complète',                   default: 500   },
    ],
  },
]

const ALL_FIELDS = FIELDS.flatMap(s => s.fields)

export default function SettingsScreen({ profile, hook }) {
  const { settings, saveSettings } = hook
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Map key → ref sur l'élément input
  const inputRefs = useRef({})

  // Dès que settings arrive (ou change), on met à jour les inputs via le DOM
  // On ne conditionne PAS l'affichage à "ready" — les inputs sont toujours rendus
  useEffect(() => {
    if (!settings) return
    ALL_FIELDS.forEach(({ key, default: def }) => {
      const el = inputRefs.current[key]
      if (el) el.value = String(settings[key] ?? def)
    })
  }, [settings])

  const handleSave = async () => {
    const numeric = {}
    ALL_FIELDS.forEach(({ key }) => {
      const el = inputRefs.current[key]
      const raw = el ? el.value.replace(',', '.') : '0'
      numeric[key] = parseFloat(raw) || 0
    })
    setSaving(true)
    await saveSettings(numeric)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="orbite-settings">
      <div className="orbite-settings-title">Paramètres</div>

      {FIELDS.map(({ section, fields }) => (
        <div key={section} className="orbite-settings-section">
          <div className="orbite-settings-section-title">{section}</div>
          {fields.map(({ key, label, hint, default: def }) => (
            <div key={key} className="orbite-setting-field">
              <div className="orbite-setting-field-info">
                <span className="orbite-setting-field-label">{label}</span>
                <span className="orbite-setting-field-hint">{hint}</span>
              </div>
              <input
                ref={el => { inputRefs.current[key] = el }}
                type="text"
                inputMode="decimal"
                className="orbite-setting-input"
                defaultValue={String(settings?.[key] ?? def)}
                onFocus={e => e.target.select()}
              />
            </div>
          ))}
        </div>
      ))}

      <div className="orbite-settings-preview">
        <div className="orbite-settings-preview-title">BARÈME PAR DÉFAUT</div>
        <div className="orbite-settings-preview-list">
          <span>10 000 pas · 5 km · 30 min course · 1 séance renfo</span>
          <span style={{ color: 'rgba(255,122,30,0.4)', fontSize: 11 }}>
            Sauvegardez pour voir l'effet dans l'app
          </span>
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