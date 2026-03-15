import { ArrowLeft, ChevronLeft, ChevronRight, Check } from 'lucide-react'

export default function CuriositiesScreen({
  dailyCards, idx, setIdx,
  flipped, setFlipped,
  fading, setFading,
  showAddCuriosity, setShowAddCuriosity,
  newQ, setNewQ,
  newA, setNewA,
  addCuriosity,
  setScreen,
}) {
  const card = dailyCards[idx]
  const isLast = idx === dailyCards.length - 1
  const bgColor = '#f5576c'

  const goTo = (dir) => {
    setFading(true)
    setTimeout(() => { setFlipped(false); setIdx(i => i + dir); setFading(false) }, 180)
  }

  return (
    <div className="flex flex-col" style={{ height: '100%', minHeight: 0, background: 'linear-gradient(160deg, #f093fbee, #f5576caa)' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2 flex-shrink-0">
        <button onClick={() => setScreen('home')} className="text-white/75 active:text-white">
          <ArrowLeft size={20} />
        </button>
        <p className="text-white/80 text-xs font-medium">
          {card?.isCuriosity ? '✨ Ta curiosité' : '🎴 Carte thématique'}
        </p>
        <button onClick={() => setShowAddCuriosity(true)} className="text-white/75 active:text-white">
          <span className="text-lg">+</span>
        </button>
      </div>

      {/* Progress bar */}
      <div className="mx-5 h-1 bg-white/20 rounded-full mb-4 flex-shrink-0">
        <div
          className="h-full bg-white rounded-full transition-all duration-500"
          style={{ width: `${((idx + 1) / dailyCards.length) * 100}%` }}
        />
      </div>

      {dailyCards.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-white text-center px-8">
          <div className="text-5xl mb-4">✨</div>
          <p className="font-bold text-lg mb-2">Aucune curiosité encore</p>
          <button
            onClick={() => setShowAddCuriosity(true)}
            className="px-6 py-3 bg-white/20 rounded-full font-semibold text-sm mt-4"
          >
            + Ajouter une curiosité
          </button>
        </div>
      ) : (
        <>
          {/* Card */}
          <div className="flex-1 flex flex-col items-center justify-center px-5 pb-4 min-h-0">
            <div className="w-full max-w-sm" style={{ perspective: '1000px' }}>
              <div
                onClick={() => setFlipped(f => !f)}
                style={{
                  height: '16rem', cursor: 'pointer',
                  transformStyle: 'preserve-3d',
                  transition: 'transform 0.55s cubic-bezier(.4,0,.2,1)',
                  transform: flipped ? 'rotateX(180deg)' : 'rotateX(0deg)',
                  position: 'relative',
                }}
              >
                <div className="absolute inset-0 bg-white rounded-3xl shadow-2xl flex flex-col items-center justify-center p-7"
                  style={{ backfaceVisibility: 'hidden' }}>
                  <p className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: bgColor }}>Question</p>
                  <h2 className="text-xl font-bold text-gray-800 text-center leading-snug">{card?.front}</h2>
                  <p className="text-gray-300 text-xs mt-6">Touche pour révéler</p>
                </div>
                <div className="absolute inset-0 bg-white rounded-3xl shadow-2xl flex flex-col items-center justify-center p-7"
                  style={{ backfaceVisibility: 'hidden', transform: 'rotateX(180deg)' }}>
                  <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: bgColor }}>Réponse</p>
                  <p className="text-lg text-gray-700 text-center leading-relaxed">{card?.back}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="px-5 pb-8 flex-shrink-0">
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => idx > 0 && goTo(-1)}
                disabled={idx === 0}
                className="w-14 h-14 rounded-full bg-white/15 flex items-center justify-center text-white active:scale-90 disabled:opacity-25 transition-transform"
              >
                <ChevronLeft size={26} />
              </button>
              <button
                onClick={() => setFlipped(f => !f)}
                className="flex-1 max-w-xs py-3.5 bg-white/15 text-white rounded-full text-sm font-semibold active:scale-95 transition-transform"
              >
                Retourner
              </button>
              <button
                onClick={() => !isLast ? goTo(1) : setScreen('home')}
                className="w-14 h-14 rounded-full bg-white/15 flex items-center justify-center text-white active:scale-90 transition-transform"
              >
                {isLast ? <Check size={22} /> : <ChevronRight size={26} />}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Modal ajout curiosité */}
      {showAddCuriosity && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={() => setShowAddCuriosity(false)}>
          <div className="bg-white w-full rounded-t-3xl p-6" onClick={e => e.stopPropagation()}>
            <h2 className="font-bold text-lg text-gray-900 mb-4">✨ Nouvelle curiosité</h2>
            <input
              value={newQ} onChange={e => setNewQ(e.target.value)}
              placeholder="La question ou le fait…"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-gray-400 text-sm mb-3"
            />
            <textarea
              value={newA} onChange={e => setNewA(e.target.value)}
              placeholder="La réponse ou l'explication…"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-gray-400 text-sm resize-none h-24 mb-4"
            />
            <button
              onClick={addCuriosity} disabled={!newQ.trim() || !newA.trim()}
              className="w-full py-3.5 bg-gray-900 text-white rounded-full font-semibold text-sm disabled:opacity-30"
            >
              Ajouter
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
