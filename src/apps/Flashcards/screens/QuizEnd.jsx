export default function QuizEnd({ score, total, onRestart, onBack }) {
  const maxPoints = total * 5  // max si tout en Cash
  const pct = maxPoints > 0 ? Math.round((score.points / maxPoints) * 100) : 0
  const accuracy = total > 0 ? Math.round((score.correct / total) * 100) : 0

  const emoji   = accuracy >= 80 ? '🎉' : accuracy >= 50 ? '💪' : '🐒'
  const message = accuracy >= 80 ? 'Excellent !' : accuracy >= 50 ? 'Pas mal !' : 'Continue à t\'entraîner !'

  return (
    <div className="flex flex-col h-full bg-gray-50 items-center justify-center px-6 text-center">
      <div className="text-5xl mb-3">{emoji}</div>
      <p className="text-xl font-bold text-gray-900 mb-1">{message}</p>
      <p className="text-sm text-gray-400 mb-8">{total} question{total > 1 ? 's' : ''}</p>

      {/* Score points */}
      <div className="mb-6 w-full max-w-xs">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center shadow-sm mb-3">
          <p className="text-4xl font-bold text-gray-900">{score.points}</p>
          <p className="text-sm text-gray-400 mt-1">points sur {maxPoints} max</p>
          <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${pct}%`,
                background: pct >= 80 ? '#639922' : pct >= 50 ? '#533AB7' : '#E24B4A'
              }} />
          </div>
        </div>

        {/* Stats bonnes/mauvaises */}
        <div className="flex gap-3">
          <div className="flex-1 rounded-2xl py-3 text-center"
            style={{ background: '#EAF3DE' }}>
            <p className="text-2xl font-bold" style={{ color: '#27500A' }}>{score.correct}</p>
            <p className="text-xs mt-0.5" style={{ color: '#3B6D11' }}>✓ correctes</p>
          </div>
          <div className="flex-1 rounded-2xl py-3 text-center"
            style={{ background: '#FCEBEB' }}>
            <p className="text-2xl font-bold" style={{ color: '#791F1F' }}>{score.wrong}</p>
            <p className="text-xs mt-0.5" style={{ color: '#A32D2D' }}>✗ fausses</p>
          </div>
          <div className="flex-1 rounded-2xl py-3 text-center"
            style={{ background: '#EEEDFE' }}>
            <p className="text-2xl font-bold" style={{ color: '#534AB7' }}>{accuracy}%</p>
            <p className="text-xs mt-0.5" style={{ color: '#7F77DD' }}>précision</p>
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
          className="w-full py-4 bg-white border border-gray-200 text-gray-700 rounded-2xl text-sm font-semibold active:scale-95 transition-transform">
          Retour
        </button>
      </div>
    </div>
  )
}