import { compressImage } from '../utils.js'
import { useState, useEffect } from 'react'
import { ArrowLeft, Camera, X, ExternalLink } from 'lucide-react'
import { supabase } from '../../../supabase'
import { THEME_COLOR, THEMES } from '../constants'

export default function StudyScreen({ profile, deck, session, currentItem, idx, sessionStats, onRate, onSkip, onBack }) {
  const [flipped, setFlipped]           = useState(false)
  const [transitioning, setTransitioning] = useState(false)

  // Upload image
  const [showImgModal, setShowImgModal] = useState(false)
  const [imgUrlInput, setImgUrlInput]   = useState('')
  const [savingImg, setSavingImg]       = useState(false)

  // Reset flip à chaque nouvelle carte
  useEffect(() => {
    setTransitioning(true)
    const t = setTimeout(() => {
      setFlipped(false)
      setTransitioning(false)
    }, 150)
    return () => clearTimeout(t)
  }, [idx])

  if (!session || !currentItem) return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3">
      <div className="text-5xl animate-bounce">🐒</div>
      <p className="text-gray-400 text-sm">Chargement de la session…</p>
    </div>
  )

  const { criteria, allCriteria, valuesMap } = session
  const { cardId, criterionId, criterion }   = currentItem

  const cardValues    = valuesMap[cardId] || {}
  const questionValue = cardValues[criterionId]   // valeur du critère interrogé
  const isImageCrit   = criterion.type === 'image'

  // Tous les critères sauf celui interrogé (y compris les non-interrogeables comme verso/description)
  const answerCriteria = allCriteria.filter(c => c.id !== criterionId)

  const color    = THEME_COLOR[deck.theme] || '#6A9BCC'
  const themeObj = THEMES.find(t => t.id === deck.theme)
  const total    = session.items.length
  const progress = ((idx + 1) / total) * 100

  // Libellé de la question
  const questionTitle = criterion.question_title || `Quel est ${criterion.name} ?`

  // Lien Wikipedia (sur la valeur du 1er critère texte non-interrogé)
  const wikiCrit = allCriteria.find(c => c.type === 'text' && c.id !== criterionId)
  const wikiTerm = wikiCrit ? cardValues[wikiCrit.id] : questionValue
  const wikiUrl  = wikiTerm
    ? `https://fr.wikipedia.org/wiki/${encodeURIComponent(wikiTerm)}`
    : null

  // Sauvegarder une image via URL
  const handleSaveImgUrl = async () => {
    if (!imgUrlInput.trim()) return
    setSavingImg(true)
    try {
      await supabase.from('card_values').upsert({
        card_id:      cardId,
        criterion_id: criterionId,
        value:        imgUrlInput.trim(),
      }, { onConflict: 'card_id,criterion_id' })

      // Mettre à jour le valuesMap local
      if (!session.valuesMap[cardId]) session.valuesMap[cardId] = {}
      session.valuesMap[cardId][criterionId] = imgUrlInput.trim()
      setImgUrlInput('')
      setShowImgModal(false)
    } catch (err) {
      alert('Erreur : ' + err.message)
    }
    setSavingImg(false)
  }

  // Upload fichier image
  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setSavingImg(true)
    try {
      const blob = await compressImage(file)
      const path = `${cardId}/${criterionId}/${Date.now()}.jpg`
      const { error } = await supabase.storage
        .from('card-images')
        .upload(path, blob, { contentType: 'image/jpeg' })
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('card-images').getPublicUrl(path)

      await supabase.from('card_values').upsert({
        card_id:      cardId,
        criterion_id: criterionId,
        value:        publicUrl,
      }, { onConflict: 'card_id,criterion_id' })

      session.valuesMap[cardId][criterionId] = publicUrl
      setShowImgModal(false)
    } catch (err) {
      alert('Erreur upload : ' + err.message)
    }
    setSavingImg(false)
    e.target.value = ''
  }

  return (
    <div className="flex flex-col h-full" style={{ background: `linear-gradient(160deg, ${color}ee, ${color}99)` }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-1 flex-shrink-0">
        <button onClick={onBack} className="text-white/70 active:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <p className="text-white font-semibold text-sm">
          {themeObj?.emoji} {deck.name}
        </p>
        <p className="text-white/70 text-sm font-medium">{idx + 1}/{total}</p>
      </div>

      {/* Barre de progression */}
      <div className="mx-4 h-1 bg-white/20 rounded-full mb-3 flex-shrink-0">
        <div className="h-full bg-white rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }} />
      </div>

      {/* Zone carte */}
      <div className="flex-1 flex flex-col items-center px-4 pb-2 min-h-0 overflow-y-auto">
        <div className="w-full max-w-sm">

          {/* Chip critère interrogé */}
          <div className="flex justify-center mb-3">
            <span className="text-xs font-semibold px-3 py-1 rounded-full text-white/90 bg-white/20">
              {questionTitle}
            </span>
          </div>

          {/* Carte — face avant ou arrière selon flipped */}
          <div
            className="w-full bg-white rounded-3xl shadow-xl overflow-hidden"
            onClick={() => !flipped && setFlipped(true)}
            style={{ transition: 'opacity 0.15s', opacity: transitioning ? 0 : 1 }}>

            {!flipped ? (
              /* ── Face avant — question ── */
              <div>
                {isImageCrit && questionValue ? (
                  <img
                    src={questionValue}
                    alt={questionTitle}
                    className="w-full object-contain bg-gray-50"
                    style={{ maxHeight: '260px' }}
                  />
                ) : isImageCrit && !questionValue ? (
                  <div className="flex flex-col items-center justify-center gap-3 p-8">
                    <div className="text-4xl">🖼️</div>
                    <p className="text-gray-400 text-sm text-center">Pas encore d'image</p>
                    <button
                      onClick={e => { e.stopPropagation(); setShowImgModal(true) }}
                      className="px-4 py-2 bg-gray-100 rounded-xl text-sm font-medium text-gray-700 active:scale-95 transition-transform">
                      + Ajouter une image
                    </button>
                    {wikiUrl && (
                      <a href={wikiUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-blue-500 text-xs font-medium"
                        onClick={e => e.stopPropagation()}>
                        <ExternalLink size={12} />
                        Chercher sur Wikipédia
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-8" style={{ minHeight: '160px' }}>
                    <p className="text-2xl font-bold text-gray-800 text-center leading-snug">
                      {questionValue || '—'}
                    </p>
                    <p className="text-gray-300 text-xs mt-4">Touche pour révéler</p>
                  </div>
                )}
              </div>
            ) : (
              /* ── Face arrière — réponse ── */
              <div>
                {/* Rappel de la question */}
                <div className="px-4 pt-4 pb-3 border-b border-gray-100">
                  {isImageCrit && questionValue ? (
                    <img src={questionValue} alt="" className="h-12 object-contain mx-auto" />
                  ) : (
                    <p className="text-center text-sm font-semibold text-gray-500">{questionValue || '—'}</p>
                  )}
                </div>

                {/* Réponses — scrollables si besoin */}
                <div className="p-4 space-y-2 overflow-y-auto" style={{ maxHeight: '320px' }}>
                  {answerCriteria.map(crit => {
                    const val = cardValues[crit.id]
                    return (
                      <div key={crit.id}
                        className="flex items-start gap-3 bg-gray-50 rounded-xl px-3 py-2.5">
                        <span className="text-xs text-gray-400 flex-shrink-0 w-16 capitalize pt-0.5">
                          {crit.name}
                        </span>
                        {crit.type === 'image' && val ? (
                          <img src={val} alt={crit.name} className="h-8 object-contain" />
                        ) : (
                          <span className="text-sm font-medium text-gray-800 leading-relaxed break-words min-w-0 flex-1">{val || '—'}</span>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Note critère */}
                <div className="px-4 py-2 border-t border-gray-100">
                  <p className="text-center text-xs text-gray-400">
                    Note pour : <span className="font-semibold text-gray-600">{criterion.name}</span>
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Bouton image + lien Wikipedia (quand critère texte) */}
          {!isImageCrit && (
            <div className="flex items-center justify-center gap-3 mt-3">
              <button
                onClick={() => setShowImgModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 text-white rounded-full text-xs font-medium active:scale-95 transition-transform">
                <Camera size={13} />
                Photo
              </button>
              {wikiUrl && (
                <a href={wikiUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 text-white rounded-full text-xs font-medium active:scale-95 transition-transform">
                  <ExternalLink size={13} />
                  Wikipédia
                </a>
              )}
            </div>
          )}

          {/* Réponses cachées avant flip */}
          {!flipped && answerCriteria.length > 0 && (
            <div className="mt-3 space-y-2">
              {answerCriteria.map(crit => (
                <div key={crit.id}
                  className="flex items-center gap-3 bg-white/15 rounded-xl px-3 py-2.5">
                  <span className="text-xs text-white/60 min-w-[72px] capitalize">{crit.name}</span>
                  <div className="flex-1 h-3 bg-white/25 rounded-full" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 pb-6 flex-shrink-0">
        {flipped ? (
          <>
            <p className="text-white/60 text-xs text-center mb-2">
              Comment tu t'en es sorti ?
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => onRate('hard')}
                className="py-3 rounded-2xl text-sm font-semibold active:scale-95 transition-transform"
                style={{ background: 'rgba(234,75,74,0.8)', color: 'white' }}>
                😅 Difficile
              </button>
              <button onClick={() => onRate('medium')}
                className="py-3 rounded-2xl text-sm font-semibold active:scale-95 transition-transform"
                style={{ background: 'rgba(186,117,23,0.8)', color: 'white' }}>
                🤔 Moyen
              </button>
              <button onClick={() => onRate('easy')}
                className="py-3 rounded-2xl text-sm font-semibold active:scale-95 transition-transform"
                style={{ background: 'rgba(99,153,34,0.8)', color: 'white' }}>
                😎 Facile
              </button>
            </div>
            <button onClick={onSkip}
              className="w-full mt-2 py-2 text-white/40 text-xs active:text-white/70 transition-colors">
              Passer sans noter →
            </button>
          </>
        ) : (
          <button onClick={() => setFlipped(true)}
            className="w-full py-4 bg-white/20 text-white rounded-2xl text-sm font-semibold active:scale-95 transition-transform">
            Retourner la carte
          </button>
        )}
      </div>

      {/* Modal image */}
      {showImgModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50"
          onClick={() => setShowImgModal(false)}>
          <div className="bg-white w-full rounded-t-3xl p-6"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg">📷 Ajouter une image</h2>
              <button onClick={() => setShowImgModal(false)}>
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Critère : <span className="font-medium text-gray-700">{criterion.name}</span>
            </p>

            {/* Upload fichier */}
            <label className="flex items-center gap-3 w-full py-3.5 px-4 bg-gray-900 text-white rounded-2xl mb-3 cursor-pointer active:scale-95 transition-transform">
              <Camera size={18} />
              <span className="font-semibold text-sm">Uploader une photo</span>
              <input type="file" accept="image/*" capture="environment" className="hidden"
                onChange={handleFileUpload} />
            </label>

            {/* URL */}
            <div className="flex gap-2 mb-3">
              <input
                value={imgUrlInput}
                onChange={e => setImgUrlInput(e.target.value)}
                placeholder="Coller une URL d'image…"
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-gray-400 text-sm"
              />
              <button onClick={handleSaveImgUrl} disabled={!imgUrlInput.trim() || savingImg}
                className="px-4 py-3 bg-gray-100 text-gray-900 rounded-xl text-sm font-semibold disabled:opacity-30 active:scale-95 transition-transform">
                OK
              </button>
            </div>

            {/* Lien Wikipedia */}
            {wikiUrl && (
              <a href={wikiUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 text-blue-500 text-sm font-medium">
                <ExternalLink size={14} />
                Chercher « {wikiTerm} » sur Wikipédia
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}