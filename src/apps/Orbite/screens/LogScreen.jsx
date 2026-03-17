import { useState } from 'react'

const ACTIVITIES = [
  {
    id: 'walk',
    emoji: '🚶',
    label: 'Marche',
    units: [{ value: 'steps', label: 'Pas', placeholder: '8000', hint: 'Nombre de pas' }],
  },
  {
    id: 'run',
    emoji: '🏃',
    label: 'Course',
    units: [
      { value: 'km', label: 'Kilomètres', placeholder: '5', hint: 'Distance parcourue' },
      { value: 'min', label: 'Minutes', placeholder: '30', hint: 'Durée de la course' },
    ],
  },
  {
    id: 'workout',
    emoji: '🏋️',
    label: 'Renfo',
    units: [
      { value: 'min', label: 'Minutes', placeholder: '45', hint: 'Durée de la séance' },
      { value: 'sessions', label: 'Séances', placeholder: '1', hint: 'Nombre de séances' },
    ],
  },
]

export default function LogScreen({ profile, hook, onBack }) {
  const { logActivity, computeProps, settings } = hook

  const [step, setStep] = useState('type') // type | detail | confirm
  const [selectedType, setSelectedType] = useState(null)
  const [selectedUnit, setSelectedUnit] = useState(null)
  const [value, setValue] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)

  const actDef = ACTIVITIES.find(a => a.id === selectedType)
  const unitDef = actDef?.units.find(u => u.value === selectedUnit)
  const preview = selectedType && selectedUnit && value
    ? computeProps(selectedType, parseFloat(value), selectedUnit)
    : null

  const handleSelectType = (id) => {
    setSelectedType(id)
    const act = ACTIVITIES.find(a => a.id === id)
    if (act.units.length === 1) {
      setSelectedUnit(act.units[0].value)
    } else {
      setSelectedUnit(null)
    }
    setValue('')
    setStep('detail')
  }

  const handleSubmit = async () => {
    if (!value || parseFloat(value) <= 0) return
    setSubmitting(true)
    const { props, error } = await logActivity(selectedType, parseFloat(value), selectedUnit)
    setSubmitting(false)
    if (!error) {
      setResult(props)
      setStep('confirm')
    }
  }

  if (step === 'confirm') {
    return (
      <div className="orbite-log">
        <div className="orbite-log-success">
          <div className="orbite-log-success-rocket">🚀</div>
          <div className="orbite-log-success-props">+{result?.toLocaleString()}</div>
          <div className="orbite-log-success-label">Props ajoutés !</div>
          <div className="orbite-log-success-sub">Tu alimentes la fusée 🔥</div>
          <div className="orbite-log-success-actions">
            <button className="orbite-btn orbite-btn--primary" onClick={() => {
              setStep('type'); setSelectedType(null); setSelectedUnit(null); setValue(''); setResult(null)
            }}>
              Logger encore
            </button>
            <button className="orbite-btn orbite-btn--ghost" onClick={onBack}>
              Retour
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'detail') {
    return (
      <div className="orbite-log">
        <button className="orbite-back" onClick={() => setStep('type')}>← Retour</button>

        <div className="orbite-log-title">
          {actDef?.emoji} {actDef?.label}
        </div>

        {/* Choix de l'unité si plusieurs */}
        {actDef?.units.length > 1 && (
          <div className="orbite-log-section">
            <div className="orbite-log-label">Unité</div>
            <div className="orbite-unit-grid">
              {actDef.units.map(u => (
                <button
                  key={u.value}
                  className={`orbite-unit-btn ${selectedUnit === u.value ? 'orbite-unit-btn--active' : ''}`}
                  onClick={() => { setSelectedUnit(u.value); setValue('') }}
                >
                  {u.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Valeur */}
        {selectedUnit && (
          <div className="orbite-log-section">
            <div className="orbite-log-label">{unitDef?.hint}</div>
            <div className="orbite-value-wrap">
              <input
                type="number"
                min="0"
                step="any"
                className="orbite-value-input"
                placeholder={unitDef?.placeholder}
                value={value}
                onChange={e => setValue(e.target.value)}
                autoFocus
              />
              <span className="orbite-value-unit">{unitDef?.label}</span>
            </div>
          </div>
        )}

        {/* Preview Props */}
        {preview !== null && (
          <div className="orbite-preview">
            <span className="orbite-preview-label">Props générés</span>
            <span className="orbite-preview-value">+{preview.toLocaleString()} 🚀</span>
          </div>
        )}

        <button
          className="orbite-btn orbite-btn--primary orbite-btn--full"
          onClick={handleSubmit}
          disabled={!value || parseFloat(value) <= 0 || !selectedUnit || submitting}
        >
          {submitting ? 'Envoi…' : 'Valider'}
        </button>
      </div>
    )
  }

  return (
    <div className="orbite-log">
      <div className="orbite-log-title">Quelle activité ?</div>
      <div className="orbite-type-grid">
        {ACTIVITIES.map(act => (
          <button key={act.id} className="orbite-type-btn" onClick={() => handleSelectType(act.id)}>
            <span className="orbite-type-emoji">{act.emoji}</span>
            <span className="orbite-type-label">{act.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
