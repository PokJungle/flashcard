export default function HistoryScreen({ profile, hook }) {
  const { weekHistory, allProfiles } = hook

  const getProfile = (id) => allProfiles.find(p => p.id === id)

  return (
    <div className="orbite-history">
      <div className="orbite-history-title">Historique des semaines</div>

      {weekHistory.length === 0 ? (
        <div className="orbite-empty">Pas encore d'historique.<br />Revenez la semaine prochaine ! 🚀</div>
      ) : (
        <div className="orbite-week-list">
          {weekHistory.map((week, i) => {
            const winnerProfile = week.winner ? getProfile(week.winner) : null
            const weekLabel = week.weekStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })

            return (
              <div key={i} className={`orbite-week-card ${week.rocketLaunched ? 'orbite-week-card--launched' : ''}`}>
                <div className="orbite-week-card-header">
                  <span className="orbite-week-card-date">Sem. du {weekLabel}</span>
                  {week.rocketLaunched && <span className="orbite-week-badge">🚀 DÉCOLLAGE</span>}
                </div>

                {/* Props par profil */}
                <div className="orbite-week-profiles">
                  {allProfiles
                    .sort((a, b) => (week.propsByProfile[b.id] || 0) - (week.propsByProfile[a.id] || 0))
                    .map(p => {
                      const props = week.propsByProfile[p.id] || 0
                      const isWinner = week.winner === p.id && props > 0
                      return (
                        <div key={p.id} className={`orbite-week-profile ${isWinner ? 'orbite-week-profile--winner' : ''}`}>
                          <span>{p.avatar} {p.name}</span>
                          <span className="orbite-week-profile-props">
                            {isWinner && '🏆 '}{props.toLocaleString()} Props
                          </span>
                        </div>
                      )
                    })}
                </div>

                {/* Total + rocket progress */}
                <div className="orbite-week-footer">
                  <span className="orbite-week-total">Total : {week.totalProps.toLocaleString()} / 10 000</span>
                  <div className="orbite-week-mini-bar">
                    <div
                      className="orbite-week-mini-fill"
                      style={{ width: `${Math.min(week.totalProps / 10000 * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
