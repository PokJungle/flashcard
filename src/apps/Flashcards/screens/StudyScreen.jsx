import { useState, useEffect } from 'react'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { THEME_COLOR, THEMES } from '../constants'

export default function StudyScreen({ profile, deck, session, currentItem, idx, onRate, onSkip, onBack, dark }) {
  const [revealed, setRevealed] = useState(false)
  const [visible, setVisible]   = useState(true)

  useEffect(() => { setVisible(true) }, [idx])

  const handleRate = (rating) => {
    setRevealed(false)
    setVisible(false)
    setTimeout(() => onRate(rating), 150)
  }
  const handleSkip = () => {
    setRevealed(false)
    setVisible(false)
    setTimeout(() => onSkip(), 150)
  }

  if (!session || !currentItem) return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3">
      <div className="text-5xl animate-bounce">🐒</div>
      <p className="text-gray-400 text-sm">Chargement de la session…</p>
    </div>
  )

  const { allCriteria, valuesMap } = session
  const { cardId, criterionId, criterion } = currentItem

  const cardValues    = valuesMap[cardId] || {}
  const questionValue = cardValues[criterionId]
  const isImageCrit   = criterion.type === 'image'
  const answerCriteria = allCriteria.filter(c => c.id !== criterionId)

  const color     = THEME_COLOR[deck.theme] || '#6A9BCC'
  const themeObj  = THEMES.find(t => t.id === deck.theme)
  const total     = session.items.length
  const progress  = ((idx + 1) / total) * 100
  const questionTitle = criterion.question_title || `Quel est ${criterion.name} ?`

  const wikiCrit = allCriteria.find(c => c.name === 'nom' && c.id !== criterionId)
    || allCriteria.find(c => c.type === 'text' && c.id !== criterionId)
  const wikiTerm = wikiCrit ? cardValues[wikiCrit.id] : (isImageCrit ? null : questionValue)
  const wikiUrl  = wikiTerm ? `https://fr.wikipedia.org/wiki/${encodeURIComponent(wikiTerm)}` : null

  // Les cartes blanches s'adaptent au dark mode
  const cardBg   = dark ? '#1a1035' : '#ffffff'
  const cardText = dark ? '#e9d5ff' : '#1f2937'
  const cardSub  = dark ? '#a78bfa' : '#9ca3af'
  const revealBg = dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.15)'

  return (
    <div className="flex flex-col h-full" style={{ background: `linear-gradient(160deg, ${color}ee, ${color}99)` }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-1 flex-shrink-0">
        <button onClick={onBack} className="text-white/70 active:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <p className="text-white font-semibold text-sm">{themeObj?.emoji} {deck.name}</p>
        <p className="text-white/70 text-sm font-medium">{idx + 1}/{total}</p>
      </div>

      {/* Barre de progression */}
      <div className="mx-4 h-1 bg-white/20 rounded-full mb-4 flex-shrink-0">
        <div className="h-full bg-white rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }} />
      </div>

      {/* Zone principale */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-2">
        <div className="w-full max-w-sm mx-auto"
          style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.15s' }}>

          {/* Chip question */}
          <div className="flex justify-center mb-3">
            <span className="text-xs font-semibold px-3 py-1 rounded-full text-white/90 bg-white/20">
              {questionTitle}
            </span>
          </div>

          {/* Bloc question */}
          <div className="rounded-2xl shadow-lg overflow-hidden mb-3" style={{ background: cardBg }}>
            {isImageCrit && questionValue ? (
              <img src={questionValue} alt={questionTitle}
                className="w-full object-contain"
                style={{ maxHeight: '240px', background: dark ? '#0f0a1e' : '#f9fafb' }} />
            ) : isImageCrit && !questionValue ? (
              <div className="flex flex-col items-center justify-center gap-2 py-8 px-6">
                <div className="text-4xl">🖼️</div>
                <p className="text-sm text-center" style={{ color: cardSub }}>Pas encore d'image</p>
                {wikiUrl && (
                  <a href={wikiUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-blue-400 text-xs font-medium mt-1">
                    <ExternalLink size={12} /> Chercher sur Wikipédia
                  </a>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center px-6 py-6" style={{ minHeight: '100px' }}>
                <p className="text-2xl font-bold text-center leading-snug" style={{ color: cardText }}>
                  {questionValue || '—'}
                </p>
              </div>
            )}
          </div>

          {/* Blocs réponses */}
          {answerCriteria.length > 0 && (
            <div className="space-y-2 mb-3">
              {answerCriteria.map(crit => {
                const val = cardValues[crit.id]
                return (
                  <div key={crit.id}
                    className="rounded-xl px-4 py-3 flex items-start gap-3 cursor-pointer"
                    style={{ background: revealBg }}
                    onClick={() => !revealed && setRevealed(true)}>
                    <span className="text-xs text-white/60 flex-shrink-0 w-16 capitalize pt-0.5">
                      {crit.name}
                    </span>
                    {revealed ? (
                      crit.type === 'image' && val ? (
                        <img src={val} alt={crit.name} className="h-10 object-contain rounded" />
                      ) : (
                        <span className="text-sm font-semibold text-white leading-relaxed break-words min-w-0 flex-1">
                          {val || '—'}
                        </span>
                      )
                    ) : (
                      <div className="flex-1 flex items-center gap-1 pt-1">
                        <div className="flex-1 h-2.5 bg-white/25 rounded-full" />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Lien Wikipedia */}
          {wikiUrl && (
            <div className="flex justify-center mb-2">
              <a href={wikiUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 text-white/70 rounded-full text-xs">
                <ExternalLink size={11} /> Wikipédia
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 pb-6 flex-shrink-0">
        {revealed ? (
          <>
            <p className="text-white/60 text-xs text-center mb-2">
              Note pour : <span className="font-semibold text-white/80">{criterion.name}</span>
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => handleRate('hard')}
                className="py-3 rounded-2xl text-sm font-semibold active:scale-95 transition-transform"
                style={{ background: 'rgba(234,75,74,0.85)', color: 'white' }}>
                😅 Difficile
              </button>
              <button onClick={() => handleRate('medium')}
                className="py-3 rounded-2xl text-sm font-semibold active:scale-95 transition-transform"
                style={{ background: 'rgba(186,117,23,0.85)', color: 'white' }}>
                🤔 Moyen
              </button>
              <button onClick={() => handleRate('easy')}
                className="py-3 rounded-2xl text-sm font-semibold active:scale-95 transition-transform"
                style={{ background: 'rgba(99,153,34,0.85)', color: 'white' }}>
                😎 Facile
              </button>
            </div>
            <button onClick={handleSkip}
              className="w-full mt-2 py-2 text-white/40 text-xs active:text-white/70 transition-colors">
              Passer sans noter →
            </button>
          </>
        ) : (
          <button onClick={() => setRevealed(true)}
            className="w-full py-4 bg-white/20 text-white rounded-2xl text-sm font-semibold active:scale-95 transition-transform">
            Révéler la réponse
          </button>
        )}
      </div>
    </div>
  )
}