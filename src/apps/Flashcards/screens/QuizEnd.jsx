export default function QuizEnd({ score, total, onRestart, onBack, dark }) {
  const maxPoints = total * 5
  const pct      = maxPoints > 0 ? Math.round((score.points / maxPoints) * 100) : 0
  const accuracy = total > 0 ? Math.round((score.correct / total) * 100) : 0
  const emoji    = accuracy >= 80 ? '🎉' : accuracy >= 50 ? '💪' : '🐒'
  const message  = accuracy >= 80 ? 'Excellent !' : accuracy >= 50 ? 'Pas mal !' : 'Continue à t\'entraîner !'

  const bg      = dark ? '#0f0a1e' : '#f9fafb'
  const card    = dark ? '#1a1035' : '#ffffff'
  const border  = dark ? '#2d1f5e' : '#e5e7eb'
  const textPri = dark ? '#e9d5ff' : '#111827'
  const textSec = dark ? '#a78bfa' : '#9ca3af'

  return (
    <div className="flex flex-col h-full items-center justify-center px-6 text-center"
      style={{ background: bg }}>
      <div className="text-5xl mb-3">{emoji}</div>
      <p className="text-xl font-bold mb-1" style={{ color: textPri }}>{message}</p>
      <p className="text-sm mb-8" style={{ color: textSec }}>{total} question{total > 1 ? 's' : ''}</p>

      <div className="mb-6 w-full max-w-xs">
        <div className="rounded-2xl p-5 text-center shadow-sm mb-3"
          style={{ background: card, border: `1px solid ${border}` }}>
          <p className="text-4xl font-bold" style={{ color: textPri }}>{score.points}</p>
          <p className="text-sm mt-1" style={{ color: textSec }}>points sur {maxPoints} max</p>
          <div className="mt-3 h-2 rounded-full overflow-hidden"
            style={{ background: dark ? '#2d1f5e' : '#f3f4f6' }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${pct}%`,
                background: pct >= 80 ? '#639922' : pct >= 50 ? '#533AB7' : '#E24B4A'
              }} />
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex-1 rounded-2xl py-3 text-center"
            style={{ background: dark ? '#14291a' : '#EAF3DE' }}>
            <p className="text-2xl font-bold" style={{ color: '#27500A' }}>{score.correct}</p>
            <p className="text-xs mt-0.5" style={{ color: dark ? '#86efac' : '#3B6D11' }}>✓ correctes</p>
          </div>
          <div className="flex-1 rounded-2xl py-3 text-center"
            style={{ background: dark ? '#2d1a1a' : '#FCEBEB' }}>
            <p className="text-2xl font-bold" style={{ color: '#791F1F' }}>{score.wrong}</p>
            <p className="text-xs mt-0.5" style={{ color: dark ? '#fca5a5' : '#A32D2D' }}>✗ fausses</p>
          </div>
          <div className="flex-1 rounded-2xl py-3 text-center"
            style={{ background: dark ? '#1e1b4b' : '#EEEDFE' }}>
            <p className="text-2xl font-bold" style={{ color: '#534AB7' }}>{accuracy}%</p>
            <p className="text-xs mt-0.5" style={{ color: dark ? '#a5b4fc' : '#7F77DD' }}>précision</p>
          </div>
        </div>
      </div>

      <div className="w-full max-w-xs space-y-3">
        <button onClick={onRestart}
          className="w-full py-4 rounded-2xl text-sm font-semibold text-white active:scale-95 transition-transform"
          style={{ background: '#533AB7' }}>
          Rejouer ⚡
        </button>
        <button onClick={onBack}
          className="w-full py-4 rounded-2xl text-sm font-semibold active:scale-95 transition-transform"
          style={{ background: card, border: `1px solid ${border}`, color: dark ? '#c4b5fd' : '#374151' }}>
          Retour
        </button>
      </div>
    </div>
  )
}