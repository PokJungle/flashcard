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

function getTodayStr() {
  return new Date().toISOString().split('T')[0]
}

function getYesterdayStr() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().split('T')[0]
}

function formatDateLabel(dateStr) {
  const today = getTodayStr()
  const yesterday = getYesterdayStr()
  if (dateStr === today) return "Aujourd'hui"
  if (dateStr === yesterday) return 'Hier'
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
}

export default function LogScreen({ profile, hook, onBack }) {
  const { logActivity, computeProps, settings } = hook

  const [step, setStep] = useState('type') // type | detail | confirm
  const [selectedType, setSelectedType] = useState(null)
  const [selectedUnit, setSelectedUnit] = useState(null)
  const [value, setValue] = useState('')
  const [activityDate, setActivityDate] = useState(getTodayStr)
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
    const dateToLog = activityDate === getTodayStr() ? null : activityDate
    const { props, error } = await logActivity(selectedType, parseFloat(value), selectedUnit, dateToLog)
    setSubmitting(false)
    if (!error) {
      setResult({ props, date: activityDate })
      setStep('confirm')
    }
  }

  if (step === 'confirm') {
    const isToday = result?.date === getTodayStr()
    return (
      <div className="orbite-log">
        <div className="orbite-log-success">
          <div className="orbite-log-success-rocket">🚀</div>
          <div className="orbite-log-success-props">+{result?.props?.toLocaleString()}</div>
          <div className="orbite-log-success-label">Props ajoutés !</div>
          <div className="orbite-log-success-sub">
            {isToday ? 'Tu alimentes la fusée 🔥' : `Ajouté pour le ${formatDateLabel(result.date)} 📅`}
          </div>
          <div className="orbite-log-success-actions">
            <button className="orbite-btn orbite-btn--primary" onClick={() => {
              setStep('type'); setSelectedType(null); setSelectedUnit(null); setValue('')
              setResult(null); setActivityDate(getTodayStr())
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
    const today = getTodayStr()
    const yesterday = getYesterdayStr()
    const isToday = activityDate === today
    const isYesterday = activityDate === yesterday
    const isOther = !isToday && !isYesterday

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

        {/* Sélecteur de date */}
        <div className="orbite-log-section">
          <div className="orbite-log-label">Date</div>
          <div className="orbite-date-row">
            <button
              className={`orbite-date-btn ${isToday ? 'orbite-date-btn--active' : ''}`}
              onClick={() => setActivityDate(today)}
            >
              Auj.
            </button>
            <button
              className={`orbite-date-btn ${isYesterday ? 'orbite-date-btn--active' : ''}`}
              onClick={() => setActivityDate(yesterday)}
            >
              Hier
            </button>
            <label className={`orbite-date-btn orbite-date-btn--pick ${isOther ? 'orbite-date-btn--active' : ''}`}
              style={{ position: 'relative' }}>
              {isOther ? formatDateLabel(activityDate) : 'Autre…'}
              <input
                type="date"
                value={activityDate}
                max={today}
                onChange={e => e.target.value && setActivityDate(e.target.value)}
                style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', top: 0, left: 0, cursor: 'pointer' }}
              />
            </label>
          </div>
        </div>

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
