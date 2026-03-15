import { useRef } from 'react'
import { ArrowLeft, Camera } from 'lucide-react'
import { THEMES, TC } from '../constants'
import FlipCard from '../components/FlipCard'
import ImageModal from '../components/ImageModal'

export default function StudyScreen({
  activeDecks, idx,
  flipped, setFlipped,
  fading,
  loadingNext, setLoadingNext,
  imgError, setImgError,
  cardImages,
  showImgModal, setShowImgModal,
  imgUrlInput, setImgUrlInput,
  imgModalCard,
  uploadingCard, setUploadingCard,
  fileInputRef,
  setScreen,
  rateCard,
  goNext,
  openImgModal,
  saveImgUrl,
  handleImageUpload,
}) {
  const color = TC[activeDecks.deck.theme] || '#6A9BCC'
  const themeObj = THEMES.find(t => t.id === activeDecks.deck.theme)
  const card = activeDecks.cards[idx]
  const imgs = cardImages[card.id] || []
  const imgUrl = imgs.length > 0 ? imgs[0] : null

  return (
    <div className="flex flex-col" style={{ height: '100%', minHeight: 0, background: `linear-gradient(160deg, ${color}ee, ${color}aa)` }}>

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2 flex-shrink-0">
        <button onClick={() => setScreen('home')} className="text-white/75 active:text-white">
          <ArrowLeft size={20} />
        </button>
        <p className="text-white font-semibold text-sm">{themeObj?.emoji} {activeDecks.deck.name}</p>
        <p className="text-white/75 text-sm font-semibold">{idx + 1}/{activeDecks.cards.length}</p>
      </div>

      {/* Progress bar */}
      <div className="mx-5 h-1 bg-white/20 rounded-full mb-4 flex-shrink-0">
        <div
          className="h-full bg-white rounded-full transition-all duration-500"
          style={{ width: `${((idx + 1) / activeDecks.cards.length) * 100}%` }}
        />
      </div>

      {/* Card */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 pb-4 min-h-0">
        <div
          className={`w-full max-w-sm transition-all duration-180 ${fading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
        >
          <FlipCard
            front={card.front}
            back={card.back}
            flipped={flipped}
            onFlip={() => setFlipped(f => !f)}
            color={color}
            imgUrl={imgUrl}
            loadingNext={loadingNext}
            setLoadingNext={setLoadingNext}
            setImgError={setImgError}
          />
        </div>

        {/* Add photo button */}
        <button
          onClick={(e) => { e.stopPropagation(); openImgModal(card) }}
          className="mt-4 flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-full text-xs font-medium active:scale-95 transition-transform"
        >
          <Camera size={14} />
          {imgs.length > 0 ? `${imgs.length} photo${imgs.length > 1 ? 's' : ''} · Ajouter` : 'Ajouter une photo'}
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageUpload} />

        {showImgModal && imgModalCard && (
          <ImageModal
            card={imgModalCard}
            imgUrlInput={imgUrlInput}
            setImgUrlInput={setImgUrlInput}
            onSaveUrl={saveImgUrl}
            onUpload={(e) => { setUploadingCard(imgModalCard.id); setShowImgModal(false); handleImageUpload(e) }}
            onClose={() => setShowImgModal(false)}
          />
        )}
      </div>

      {/* Actions */}
      <div className="px-5 pb-8 flex-shrink-0">
        {flipped ? (
          <div className="space-y-3">
            <p className="text-white/60 text-xs text-center mb-2">Comment tu t'en es sorti ?</p>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => rateCard('hard')} className="py-3.5 bg-red-500/80 text-white rounded-2xl text-sm font-semibold active:scale-95 transition-transform">
                😅 Difficile
              </button>
              <button onClick={() => rateCard('medium')} className="py-3.5 bg-orange-400/80 text-white rounded-2xl text-sm font-semibold active:scale-95 transition-transform">
                🤔 Moyen
              </button>
              <button onClick={() => rateCard('easy')} className="py-3.5 bg-green-500/80 text-white rounded-2xl text-sm font-semibold active:scale-95 transition-transform">
                😎 Facile
              </button>
            </div>
            <button onClick={goNext} className="w-full py-3 text-white/50 text-xs font-medium active:text-white/80 transition-colors">
              Passer sans noter →
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <button onClick={() => setFlipped(true)} className="w-full py-4 bg-white/15 text-white rounded-full text-sm font-semibold active:scale-95 transition-transform">
              Retourner la carte
            </button>
            <button onClick={goNext} className="w-full py-3 text-white/50 text-xs font-medium active:text-white/80 transition-colors">
              Passer sans noter →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
