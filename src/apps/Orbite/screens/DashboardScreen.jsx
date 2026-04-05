import { useState } from 'react'
import { getWeekEnd } from '../../../utils/dateUtils'

const ACTIVITY_LABELS = {
  walk: { emoji: '🚶', label: 'Marche', unitLabel: { steps: 'pas' } },
  run: { emoji: '🏃', label: 'Course', unitLabel: { km: 'km', min: 'min' } },
  workout: { emoji: '🏋️', label: 'Renfo', unitLabel: { min: 'min', sessions: 'séances' } },
}

const ACTIVITIES = [
  { id: 'walk', emoji: '🚶', label: 'Marche', units: [{ value: 'steps', label: 'Pas', placeholder: '8000', hint: 'Nombre de pas' }] },
  { id: 'run', emoji: '🏃', label: 'Course', units: [{ value: 'km', label: 'Kilomètres', placeholder: '5', hint: 'Distance parcourue' }, { value: 'min', label: 'Minutes', placeholder: '30', hint: 'Durée de la course' }] },
  { id: 'workout', emoji: '🏋️', label: 'Renfo', units: [{ value: 'min', label: 'Minutes', placeholder: '45', hint: 'Durée de la séance' }, { value: 'sessions', label: 'Séances', placeholder: '1', hint: 'Nombre de séances' }] },
]

function formatActivityDate(isoStr) {
  const d = new Date(isoStr)
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
}
function getTodayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
function isoToDateStr(isoStr) {
  const d = new Date(isoStr)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function RocketLaunch({ progress, launched, weeklyTarget }) {
  const pct = Math.round(progress * 100)

  return (
    <div className="orbite-rocket-container">
      <div className="orbite-rocket-track">
        <div className="orbite-rocket-label">
          {launched ? '💥 DÉCOLLAGE !' : `Mission : ${pct}%`}
        </div>
        <div className="orbite-rocket-bar-wrap">
          <div className="orbite-rocket-bar-bg">
            <div className="orbite-rocket-bar-fill" style={{ width: `${pct}%` }} />
          </div>
          <div
            className={`orbite-rocket-icon ${launched ? 'orbite-rocket-launched' : ''}`}
            style={{ left: `calc(${Math.min(pct, 95)}% - 14px)` }}
          >
            {launched ? '💥' : '🚀'}
          </div>
        </div>
        <div className="orbite-rocket-targets">
          <span>0</span>
          <span>Objectif : {(weeklyTarget || 10000).toLocaleString()} Props</span>
        </div>
      </div>
    </div>
  )
}

function ProfileBar({ profile, props, maxProps, isMe, streak }) {
  const pct = maxProps > 0 ? Math.round((props / maxProps) * 100) : 0
  const streakOk = streak > 0

  return (
    <div className={`orbite-pbar ${isMe ? 'orbite-pbar--me' : 'orbite-pbar--other'}`}>
      <div className="orbite-pbar-header">
        <span className="orbite-pbar-avatar">{profile?.avatar}</span>
        <div className="orbite-pbar-info">
          <span className="orbite-pbar-name">{profile?.name}</span>
          <span className="orbite-pbar-streak">
            {streakOk ? `🔥 ${streak} jour${streak > 1 ? 's' : ''}` : '—'}
          </span>
        </div>
        <span className="orbite-pbar-props">{props.toLocaleString()}<small> Props</small></span>
      </div>
      <div className="orbite-pbar-track">
        <div className="orbite-pbar-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function EditActivityModal({ activity, allProfiles, computeProps, onSave, onClose }) {
  const [type, setType] = useState(activity.type)
  const [unit, setUnit] = useState(activity.unit)
  const [value, setValue] = useState(String(activity.value))
  const [dateStr, setDateStr] = useState(isoToDateStr(activity.created_at))
  const [submitting, setSubmitting] = useState(false)

  const actDef = ACTIVITIES.find(a => a.id === type)
  const unitDef = actDef?.units.find(u => u.value === unit)
  const preview = type && unit && value ? computeProps(type, parseFloat(value), unit) : null
  const todayStr = getTodayStr()

  const handleTypeChange = (newType) => {
    setType(newType)
    const act = ACTIVITIES.find(a => a.id === newType)
    setUnit(act.units[0].value)
    setValue('')
  }

  const handleSave = async () => {
    if (!value || parseFloat(value) <= 0 || !unit) return
    document.activeElement?.blur()
    setSubmitting(true)
    await onSave(activity.id, { type, value: parseFloat(value), unit, dateStr })
    setSubmitting(false)
  }

  return (
    <div className="orbite-edit-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="orbite-edit-panel">
        <div className="orbite-edit-header">
          <span className="orbite-edit-title">MODIFIER L'ACTIVITÉ</span>
          <button className="orbite-edit-close" onClick={onClose}>✕</button>
        </div>

        <div className="orbite-log-section">
          <div className="orbite-log-label">Type</div>
          <div className="orbite-type-grid">
            {ACTIVITIES.map(act => (
              <button
                key={act.id}
                className={`orbite-type-btn ${type === act.id ? 'orbite-type-btn--active' : ''}`}
                onClick={() => handleTypeChange(act.id)}
              >
                <span className="orbite-type-emoji">{act.emoji}</span>
                <span className="orbite-type-label">{act.label}</span>
              </button>
            ))}
          </div>
        </div>

        {actDef?.units.length > 1 && (
          <div className="orbite-log-section">
            <div className="orbite-log-label">Unité</div>
            <div className="orbite-unit-grid">
              {actDef.units.map(u => (
                <button
                  key={u.value}
                  className={`orbite-unit-btn ${unit === u.value ? 'orbite-unit-btn--active' : ''}`}
                  onClick={() => { setUnit(u.value); setValue('') }}
                >
                  {u.label}
                </button>
              ))}
            </div>
          </div>
        )}

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
            />
            <span className="orbite-value-unit">{unitDef?.label}</span>
          </div>
        </div>

        <div className="orbite-log-section">
          <div className="orbite-log-label">Date</div>
          <div className="orbite-date-row">
            <button
              className={`orbite-date-btn ${dateStr === todayStr ? 'orbite-date-btn--active' : ''}`}
              onClick={() => setDateStr(todayStr)}
            >
              Auj.
            </button>
            <label className={`orbite-date-btn orbite-date-btn--pick ${dateStr !== todayStr ? 'orbite-date-btn--active' : ''}`}
              style={{ position: 'relative' }}>
              {dateStr !== todayStr ? formatActivityDate(dateStr + 'T12:00:00') : 'Autre…'}
              <input
                type="date"
                value={dateStr}
                max={todayStr}
                onChange={e => e.target.value && setDateStr(e.target.value)}
                style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', top: 0, left: 0, cursor: 'pointer' }}
              />
            </label>
          </div>
        </div>

        {preview !== null && (
          <div className="orbite-preview">
            <span className="orbite-preview-label">Props générés</span>
            <span className="orbite-preview-value">+{preview.toLocaleString()} 🚀</span>
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
          <button
            className="orbite-btn orbite-btn--ghost"
            onClick={onClose}
            style={{ flex: 1 }}
          >
            Annuler
          </button>
          <button
            className="orbite-btn orbite-btn--primary"
            onClick={handleSave}
            disabled={!value || parseFloat(value) <= 0 || !unit || submitting}
            style={{ flex: 2 }}
          >
            {submitting ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function DashboardScreen({ profile, hook, onLog }) {
  const {
    allProfiles, propsByProfile, totalProps, rocketProgress, rocketLaunched,
    activities, pastActivities, updateActivity, computeProps, computeStreak,
    encouragementMessage, settings, weekStart, weeklyTarget,
  } = hook

  const prevWeekStart = new Date(weekStart)
  prevWeekStart.setDate(prevWeekStart.getDate() - 7)
  const prevWeekEnd = getWeekEnd(prevWeekStart)
  const prevWeekActivities = (pastActivities || []).filter(a => {
    const d = new Date(a.created_at)
    return d >= prevWeekStart && d <= prevWeekEnd
  })

  const [editingActivity, setEditingActivity] = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const maxProps = Math.max(...allProfiles.map(p => propsByProfile[p.id] || 0), 1)
  const msg = encouragementMessage()

  const handleSave = async (id, fields) => {
    await updateActivity(id, fields)
    setEditingActivity(null)
  }

  const handleDelete = async (id) => {
    setDeleting(true)
    await hook.deleteActivity(id)
    setDeleting(false)
    setConfirmDeleteId(null)
  }

  const renderActivity = (a) => {
    const act = ACTIVITY_LABELS[a.type]
    const p = allProfiles.find(x => x.id === a.profile_id)
    const isConfirmDelete = confirmDeleteId === a.id
    return (
      <div key={a.id} className="orbite-activity-item">
        <span className="orbite-activity-emoji">{act?.emoji}</span>
        <div className="orbite-activity-body">
          <span className="orbite-activity-who">
            {p?.avatar} {p?.name}
            <span className="orbite-activity-date"> · {formatActivityDate(a.created_at)}</span>
          </span>
          <span className="orbite-activity-desc">
            {act?.label} · {a.value} {act?.unitLabel[a.unit]}
          </span>
        </div>
        <div className="orbite-activity-props">
          +{a.props.toLocaleString()}
          <small> 🚀</small>
        </div>
        {isConfirmDelete ? (
          <div className="orbite-confirm-delete">
            <button
              className="orbite-confirm-delete-yes"
              onClick={() => handleDelete(a.id)}
              disabled={deleting}
            >
              {deleting ? '…' : 'Supprimer ?'}
            </button>
            <button className="orbite-confirm-delete-no" onClick={() => setConfirmDeleteId(null)}>
              Annuler
            </button>
          </div>
        ) : (
          <div className="orbite-activity-actions">
            <button
              className="orbite-activity-action-btn"
              onClick={() => setEditingActivity(a)}
              title="Modifier"
            >
              ✏️
            </button>
            <button
              className="orbite-activity-action-btn orbite-activity-action-btn--danger"
              onClick={() => setConfirmDeleteId(a.id)}
              title="Supprimer"
            >
              🗑️
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="orbite-dashboard">
      <div className="orbite-week-label">
        Semaine du {weekStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
      </div>

      {msg && (
        <div className="orbite-encourage">
          <span className="orbite-encourage-icon">⚡</span>
          {msg}
        </div>
      )}

      {/* Face à face */}
      <div className="orbite-section">
        <div className="orbite-section-title">CLASSEMENT SEMAINE</div>
        <div className="orbite-face2face">
          {allProfiles
            .sort((a, b) => (propsByProfile[b.id] || 0) - (propsByProfile[a.id] || 0))
            .map(p => (
              <ProfileBar
                key={p.id}
                profile={p}
                props={propsByProfile[p.id] || 0}
                maxProps={maxProps}
                isMe={p.id === profile.id}
                streak={computeStreak(p.id)}
              />
            ))}
        </div>
        <div className="orbite-total">
          Total combiné : <strong>{totalProps.toLocaleString()} Props</strong>
        </div>
      </div>

      {/* Fusée */}
      <div className="orbite-section">
        <div className="orbite-section-title">MISSION DÉCOLLAGE</div>
        <RocketLaunch
          progress={rocketProgress}
          launched={rocketLaunched}
          weeklyTarget={weeklyTarget}
        />
      </div>

      {/* Activités récentes */}
      <div className="orbite-section">
        <div className="orbite-section-title">ACTIVITÉS RÉCENTES</div>

        {/* Semaine courante */}
        <div className="orbite-week-sep">
          <span className="orbite-week-sep-line" />
          <span className="orbite-week-sep-label">
            Semaine du {weekStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
          </span>
          <span className="orbite-week-sep-line" />
        </div>
        {activities.length === 0 ? (
          <div className="orbite-empty" style={{ fontSize: '12px', padding: '8px 0 4px' }}>Aucune activité cette semaine.</div>
        ) : (
          <div className="orbite-activity-list">
            {activities.map(a => renderActivity(a))}
          </div>
        )}

        {/* Semaine précédente */}
        <div className="orbite-week-sep" style={{ marginTop: '16px' }}>
          <span className="orbite-week-sep-line" />
          <span className="orbite-week-sep-label">
            Semaine du {prevWeekStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
          </span>
          <span className="orbite-week-sep-line" />
        </div>
        {prevWeekActivities.length === 0 ? (
          <div className="orbite-empty" style={{ fontSize: '12px', padding: '8px 0 4px' }}>Aucune activité cette semaine.</div>
        ) : (
          <div className="orbite-activity-list">
            {prevWeekActivities.map(a => renderActivity(a))}
          </div>
        )}
      </div>

      {editingActivity && (
        <EditActivityModal
          activity={editingActivity}
          allProfiles={allProfiles}
          computeProps={computeProps}
          onSave={handleSave}
          onClose={() => setEditingActivity(null)}
        />
      )}

      <button className="orbite-fab" onClick={onLog}>
        + Logger une activité
      </button>
    </div>
  )
}
