import { useState } from 'react'

const ACTIVITY_LABELS = {
  walk: { emoji: '🚶', label: 'Marche', unitLabel: { steps: 'pas' } },
  run: { emoji: '🏃', label: 'Course', unitLabel: { km: 'km', min: 'min' } },
  workout: { emoji: '🏋️', label: 'Renfo', unitLabel: { min: 'min', sessions: 'séances' } },
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

export default function DashboardScreen({ profile, hook, onLog }) {
  const {
    allProfiles, propsByProfile, totalProps, rocketProgress, rocketLaunched,
    activities, computeStreak, encouragementMessage, settings, weekStart, weeklyTarget,
  } = hook

  const maxProps = Math.max(...allProfiles.map(p => propsByProfile[p.id] || 0), 1)
  const msg = encouragementMessage()
  const recentAll = activities.slice(0, 8)

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
        {recentAll.length === 0 ? (
          <div className="orbite-empty">Aucune activité cette semaine.<br />C'est l'heure de décoller ! 🚀</div>
        ) : (
          <div className="orbite-activity-list">
            {recentAll.map(a => {
              const act = ACTIVITY_LABELS[a.type]
              const p = allProfiles.find(x => x.id === a.profile_id)
              return (
                <div key={a.id} className="orbite-activity-item">
                  <span className="orbite-activity-emoji">{act?.emoji}</span>
                  <div className="orbite-activity-body">
                    <span className="orbite-activity-who">{p?.avatar} {p?.name}</span>
                    <span className="orbite-activity-desc">
                      {act?.label} · {a.value} {act?.unitLabel[a.unit]}
                    </span>
                  </div>
                  <div className="orbite-activity-props">
                    +{a.props.toLocaleString()}
                    <small> 🚀</small>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <button className="orbite-fab" onClick={onLog}>
        + Logger une activité
      </button>
    </div>
  )
}