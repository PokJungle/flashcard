export default function FlipCard({ front, back, flipped, onFlip, color, imgUrl, loadingNext, setLoadingNext, setImgError }) {
  return (
    <div style={{ perspective: '1000px' }}>
      <div
        onClick={onFlip}
        style={{
          height: '22rem',
          cursor: 'pointer',
          transformStyle: 'preserve-3d',
          transition: 'transform 0.55s cubic-bezier(.4,0,.2,1)',
          transform: flipped ? 'rotateX(180deg)' : 'rotateX(0deg)',
          position: 'relative',
        }}
      >
        {/* Recto */}
        <div
          className="absolute inset-0 bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
          style={{ backfaceVisibility: 'hidden' }}
        >
          {loadingNext && (
            <div className="absolute inset-0 bg-white rounded-3xl flex items-center justify-center z-10">
              <div className="text-5xl animate-bounce">🐒</div>
            </div>
          )}
          {imgUrl ? (
            <>
              <div className="flex-1 min-h-0 overflow-hidden">
                <img
                  src={imgUrl}
                  alt={front}
                  className="w-full h-full object-contain bg-gray-50"
                  onLoad={() => setLoadingNext?.(false)}
                  onError={() => { setImgError?.(true); setLoadingNext?.(false) }}
                />
              </div>
              <div className="px-4 py-2 text-center border-t border-gray-100 flex-shrink-0">
                <p className="text-gray-400 text-xs">Touche pour révéler</p>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-7">
              <p className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color }}>Question</p>
              <h2 className="text-2xl font-bold text-gray-800 text-center leading-snug">{front}</h2>
              <p className="text-gray-300 text-xs mt-6">Touche pour révéler</p>
            </div>
          )}
        </div>

        {/* Verso */}
        <div
          className="absolute inset-0 bg-white rounded-3xl shadow-2xl flex flex-col items-center justify-center p-7"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateX(180deg)' }}
        >
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color }}>Réponse</p>
          {imgUrl && <p className="text-base font-bold text-gray-600 mb-3">{front}</p>}
          <p className="text-lg text-gray-700 text-center leading-relaxed">{back}</p>
        </div>
      </div>
    </div>
  )
}
