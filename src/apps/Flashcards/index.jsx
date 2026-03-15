import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../supabase'
import {
  ChevronLeft, ChevronRight, Plus, BookOpen,
  ArrowLeft, Upload, Check, Camera
} from 'lucide-react'

const THEMES = [
  { id: 'sciences',     label: 'Sciences',        emoji: '🔬', color: '#4CAF82' },
  { id: 'histoire',     label: 'Histoire',         emoji: '🏛️', color: '#C0784A' },
  { id: 'geographie',   label: 'Géographie',       emoji: '🌍', color: '#6A9BCC' },
  { id: 'langues',      label: 'Langues',          emoji: '💬', color: '#9B6ACC' },
  { id: 'culture',      label: 'Culture générale', emoji: '🎨', color: '#CC6A8A' },
  { id: 'sciences_nat', label: 'Sciences nat.',    emoji: '🌿', color: '#7BBF44' },
  { id: 'math',         label: 'Mathématiques',    emoji: '📐', color: '#CCA46A' },
  { id: 'autre',        label: 'Autre',            emoji: '✨', color: '#7A7A8A' },
]
const TC = Object.fromEntries(THEMES.map(t => [t.id, t.color]))

const proxyImg = url => url || null

async function compressImage(file, maxPx = 800, quality = 0.7) {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height))
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w; canvas.height = h
      canvas.getContext('2d').drawImage(img, 0, 0, w, h)
      canvas.toBlob(blob => { URL.revokeObjectURL(url); resolve(blob) }, 'image/jpeg', quality)
    }
    img.src = url
  })
}

function nextReview(level, rating) {
  const newLevel = rating === 'easy' ? level + 2 : rating === 'medium' ? level + 1 : Math.max(0, level - 1)
  const days = rating === 'easy' ? Math.pow(2, newLevel) : rating === 'medium' ? newLevel + 1 : 0.25
  const next = new Date()
  next.setTime(next.getTime() + days * 24 * 60 * 60 * 1000)
  return { newLevel, next }
}

const shuffle = arr => [...arr].sort(() => Math.random() - 0.5)

export default function Flashcards({ profile }) {
  const [screen, setScreen] = useState('home')
  const [decks, setDecks] = useState([])
  const [activeDecks, setActiveDecks] = useState(null)
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [fading, setFading] = useState(false)
  const [loading, setLoading] = useState(false)

  const [cardImages, setCardImages] = useState({})
  const [currentImgIdx, setCurrentImgIdx] = useState({})
  const [uploadingCard, setUploadingCard] = useState(null)
  const [showImgModal, setShowImgModal] = useState(false)
  const [imgUrlInput, setImgUrlInput] = useState('')
  const [imgModalCard, setImgModalCard] = useState(null)
  const fileInputRef = useRef()

  const [dailyCards, setDailyCards] = useState([])
  const [newQ, setNewQ] = useState('')
  const [newA, setNewA] = useState('')
  const [showAddCuriosity, setShowAddCuriosity] = useState(false)

  const [showUpload, setShowUpload] = useState(false)
  const [uploadStatus, setUploadStatus] = useState(null)
  
  const [loadingNext, setLoadingNext] = useState(false)

  useEffect(() => { loadDecks() }, [])

  useEffect(() => {
    const k = (e) => {
      if (screen !== 'study') return
      if (e.key === 'ArrowLeft') go(-1)
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); setFlipped(f => !f) }
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [screen, idx, activeDecks, fading])

  const loadDecks = async () => {
    const { data } = await supabase.from('decks').select('*').order('created_at')
    setDecks(data || [])
  }

  const loadCardImages = async (cards) => {
    const ids = cards.map(c => c.id)
    const { data } = await supabase.from('card_images').select('*').in('card_id', ids)
    const map = {}, idxMap = {}
    for (const id of ids) {
      const imgs = (data || []).filter(i => i.card_id === id).map(i => i.url)
      map[id] = imgs
      if (imgs.length > 0) idxMap[id] = Math.floor(Math.random() * imgs.length)
    }
    setCardImages(map)
    setCurrentImgIdx(idxMap)
  }

  const openImgModal = (card) => { setImgModalCard(card); setImgUrlInput(''); setShowImgModal(true) }

  const saveImgUrl = async () => {
    if (!imgUrlInput.trim() || !imgModalCard) return
    try {
      await supabase.from('card_images').insert({ card_id: imgModalCard.id, url: imgUrlInput.trim() })
      setCardImages(prev => ({ ...prev, [imgModalCard.id]: [...(prev[imgModalCard.id] || []), imgUrlInput.trim()] }))
      setCurrentImgIdx(prev => ({ ...prev, [imgModalCard.id]: (cardImages[imgModalCard.id] || []).length }))
      setShowImgModal(false)
    } catch (err) { alert('Erreur : ' + err.message) }
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file || !uploadingCard) return
    try {
      const blob = await compressImage(file)
      const path = `${uploadingCard}/${Date.now()}.jpg`
      const { error } = await supabase.storage.from('card-images').upload(path, blob, { contentType: 'image/jpeg' })
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('card-images').getPublicUrl(path)
      await supabase.from('card_images').insert({ card_id: uploadingCard, url: publicUrl })
      setCardImages(prev => ({ ...prev, [uploadingCard]: [...(prev[uploadingCard] || []), publicUrl] }))
      setCurrentImgIdx(prev => ({ ...prev, [uploadingCard]: (cardImages[uploadingCard] || []).length }))
    } catch (err) { alert('Erreur upload : ' + err.message) }
    setUploadingCard(null)
    e.target.value = ''
  }

  const startDeck = async (deck) => {
    setLoading(true)
    const { data: cards } = await supabase.from('cards').select('*').eq('deck_id', deck.id)
    const { data: progress } = await supabase.from('card_progress').select('*')
      .eq('profile_id', profile.id).in('card_id', cards.map(c => c.id))
    const progressMap = Object.fromEntries((progress || []).map(p => [p.card_id, p]))
    const now = new Date()
    const due = cards.filter(c => { const p = progressMap[c.id]; return !p || new Date(p.next_review) <= now })
    const toStudy = shuffle(due.length > 0 ? due : cards)
    await loadCardImages(toStudy)
    setActiveDecks({ deck, cards: toStudy, progressMap })
    setIdx(0); setFlipped(false)
    setScreen('study')
    setLoading(false)
  }

  const rateCard = async (rating) => {
    const card = activeDecks.cards[idx]
    const existing = activeDecks.progressMap[card.id]
    const { newLevel, next } = nextReview(existing?.level || 0, rating)
    if (existing) {
      await supabase.from('card_progress').update({
        level: newLevel, next_review: next.toISOString(), last_reviewed: new Date().toISOString()
      }).eq('id', existing.id)
    } else {
      await supabase.from('card_progress').insert({
        profile_id: profile.id, card_id: card.id,
        level: newLevel, next_review: next.toISOString(), last_reviewed: new Date().toISOString()
      })
    }
    goNext()
  }

  const go = (dir) => {
    if (!activeDecks || fading) return
    const n = idx + dir
    if (n < 0 || n >= activeDecks.cards.length) return
    setFading(true)
    setTimeout(() => { setFlipped(false); setIdx(n); setFading(false) }, 180)
  }

const goNext = () => {
  if (idx < activeDecks.cards.length - 1) {
    setLoadingNext(true) // singe immédiatement
    setFlipped(false)    // retournement
    setTimeout(() => {   // on attend la fin du retournement
      setIdx(i => i + 1)
      setImgError(false)
    }, 400)
  } else {
    setFlipped(false)
    setTimeout(() => setScreen('home'), 300)
  }
}
  
  const startCuriosities = async () => {
    setLoading(true)
    const { data: curios } = await supabase.from('curiosities').select('*')
      .eq('profile_id', profile.id).order('created_at', { ascending: false }).limit(20)
    const { data: randomCards } = await supabase.from('cards').select('*').limit(50)
    const mixed = [
      ...shuffle(curios || []).slice(0, 5).map(c => ({ front: c.question, back: c.answer, isCuriosity: true })),
      ...shuffle(randomCards || []).slice(0, 5).map(c => ({ front: c.front, back: c.back }))
    ].sort(() => Math.random() - 0.5)
    setDailyCards(mixed); setIdx(0); setFlipped(false)
    setScreen('curiosities')
    setLoading(false)
  }

  const addCuriosity = async () => {
    if (!newQ.trim() || !newA.trim()) return
    await supabase.from('curiosities').insert({ profile_id: profile.id, question: newQ, answer: newA })
    setNewQ(''); setNewA(''); setShowAddCuriosity(false)
  }

  const handleUploadJSON = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploadStatus('loading')
    try {
      const json = JSON.parse(await file.text())
      const { data: deck } = await supabase.from('decks').insert({
        name: json.name, theme: json.theme || 'autre', description: json.description || ''
      }).select().single()
      await supabase.from('cards').insert(
        json.cards.map(c => ({ deck_id: deck.id, front: c.front, back: c.back, image_url: c.imageUrl || c.image_url || null }))
      )
      await loadDecks()
      setUploadStatus('success')
      setTimeout(() => { setShowUpload(false); setUploadStatus(null) }, 2000)
    } catch { setUploadStatus('error') }
  }

  const color = activeDecks ? (TC[activeDecks.deck.theme] || '#6A9BCC') : '#6A9BCC'
  const themeObj = THEMES.find(t => t.id === activeDecks?.deck?.theme)

  // ─── HOME ─────────────────────────────────────────────────────────────────
  if (screen === 'home') {
    const themesPresents = THEMES.filter(t => decks.some(d => d.theme === t.id))
    return (
      <div className="h-full bg-gray-50 pb-24 overflow-y-auto">
        <div className="px-5 py-5 max-w-lg mx-auto">
          <button onClick={startCuriosities}
            className="w-full mb-6 rounded-2xl p-5 text-left text-white active:scale-95 transition-transform shadow-lg"
            style={{ background: 'linear-gradient(135deg, #f093fb, #f5576c)' }}>
            <div className="flex items-center gap-3">
              <span className="text-3xl">✨</span>
              <div>
                <p className="font-bold text-base">Curiosités du jour</p>
                <p className="text-white/75 text-xs mt-0.5">10 cartes · mix perso + thèmes</p>
              </div>
              <ChevronRight size={20} className="ml-auto text-white/75" />
            </div>
          </button>

          {decks.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-3">🎴</div>
              <p className="text-gray-500 font-medium mb-1">Aucun jeu disponible</p>
              <p className="text-gray-400 text-sm">Clique sur + pour importer un fichier JSON</p>
            </div>
          ) : (
            themesPresents.map(t => (
              <div key={t.id} className="mb-6">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{t.emoji} {t.label}</h2>
                <div className="space-y-2">
                  {decks.filter(d => d.theme === t.id).map(deck => (
                    <button key={deck.id} onClick={() => startDeck(deck)}
                      className="w-full bg-white rounded-2xl p-4 border border-gray-100 text-left active:scale-95 transition-transform shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                          style={{ background: (TC[deck.theme] || '#7A7A8A') + '18' }}>
                          {t.emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm truncate">{deck.name}</p>
                          {deck.description && <p className="text-xs text-gray-400 truncate mt-0.5">{deck.description}</p>}
                        </div>
                        <BookOpen size={15} style={{ color: TC[deck.theme] || '#7A7A8A' }} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        <button onClick={() => setShowUpload(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gray-900 text-white rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform z-40">
          <Upload size={20} />
        </button>

        {showUpload && (
          <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={() => setShowUpload(false)}>
            <div className="bg-white w-full rounded-t-3xl p-6" onClick={e => e.stopPropagation()}>
              <h2 className="font-bold text-lg text-gray-900 mb-2">Importer un jeu</h2>
              <p className="text-gray-400 text-sm mb-5">Sélectionne un fichier JSON</p>
              {uploadStatus === 'success' ? (
                <div className="flex items-center gap-2 text-green-600 font-semibold justify-center py-4">
                  <Check size={20} /> Jeu importé !
                </div>
              ) : uploadStatus === 'error' ? (
                <p className="text-red-500 text-center py-4">Erreur — vérifie le format</p>
              ) : (
                <label className="block w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-center text-gray-500 cursor-pointer hover:border-gray-400 transition-colors">
                  <Upload size={24} className="mx-auto mb-2 text-gray-400" />
                  {uploadStatus === 'loading' ? 'Import en cours…' : 'Touche pour choisir un fichier'}
                  <input type="file" accept=".json" className="hidden" onChange={handleUploadJSON} />
                </label>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ─── STUDY ────────────────────────────────────────────────────────────────
  if (screen === 'study' && activeDecks) {
    const card = activeDecks.cards[idx]
    const imgs = cardImages[card.id] || []
    const imgUrl = imgs.length > 0 ? imgs[currentImgIdx[card.id] || 0] : proxyImg(card.image_url)

    return (
      <div className="flex flex-col" style={{ height: '100%', minHeight: 0, background: `linear-gradient(160deg, ${color}ee, ${color}aa)` }}>
        <div className="flex items-center justify-between px-5 pt-4 pb-2 flex-shrink-0">
          <button onClick={() => setScreen('home')} className="text-white/75 active:text-white">
            <ArrowLeft size={20} />
          </button>
          <p className="text-white font-semibold text-sm">{themeObj?.emoji} {activeDecks.deck.name}</p>
          <p className="text-white/75 text-sm font-semibold">{idx + 1}/{activeDecks.cards.length}</p>
        </div>

        <div className="mx-5 h-1 bg-white/20 rounded-full mb-4 flex-shrink-0">
          <div className="h-full bg-white rounded-full transition-all duration-500"
            style={{ width: `${((idx + 1) / activeDecks.cards.length) * 100}%` }} />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-5 pb-4 min-h-0">
          <div className={`w-full max-w-sm transition-all duration-180 ${fading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
            style={{ perspective: '1000px' }}>
            <div onClick={() => setFlipped(f => !f)}
              style={{
                height: '22rem', cursor: 'pointer',
                transformStyle: 'preserve-3d',
                transition: 'transform 0.55s cubic-bezier(.4,0,.2,1)',
                transform: flipped ? 'rotateX(180deg)' : 'rotateX(0deg)',
                position: 'relative'
              }}>
              <div className="absolute inset-0 bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
                style={{ backfaceVisibility: 'hidden' }}>
				{loadingNext && (
					<div className="absolute inset-0 bg-white rounded-3xl flex items-center justify-center z-10">
						<div className="text-5xl animate-bounce">🐒</div>
					  </div>
				)}
                {imgUrl ? (
                  <>
                    <div className="flex-1 min-h-0 overflow-hidden">
                      <img src={imgUrl} alt={card.front} className="w-full h-full object-contain bg-gray-50"
						  onLoad={() => setLoadingNext(false)}
						  onError={() => { setImgError(true); setLoadingNext(false) }} />
                    </div>
                    <div className="px-4 py-2 text-center border-t border-gray-100 flex-shrink-0">
                      <p className="text-gray-400 text-xs">Touche pour révéler</p>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-7">
                    <p className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color }}>Question</p>
                    <h2 className="text-2xl font-bold text-gray-800 text-center leading-snug">{card.front}</h2>
                    <p className="text-gray-300 text-xs mt-6">Touche pour révéler</p>
                  </div>
                )}
              </div>
              <div className="absolute inset-0 bg-white rounded-3xl shadow-2xl flex flex-col items-center justify-center p-7"
                style={{ backfaceVisibility: 'hidden', transform: 'rotateX(180deg)' }}>
                <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color }}>Réponse</p>
                {imgUrl && <p className="text-base font-bold text-gray-600 mb-3">{card.front}</p>}
                <p className="text-lg text-gray-700 text-center leading-relaxed">{card.back}</p>
              </div>
            </div>
          </div>

          <button onClick={(e) => { e.stopPropagation(); openImgModal(card) }}
            className="mt-4 flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-full text-xs font-medium active:scale-95 transition-transform">
            <Camera size={14} />
            {imgs.length > 0 ? `${imgs.length} photo${imgs.length > 1 ? 's' : ''} · Ajouter` : 'Ajouter une photo'}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageUpload} />

          {showImgModal && imgModalCard && (
            <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={() => setShowImgModal(false)}>
              <div className="bg-white w-full rounded-t-3xl p-6" onClick={e => e.stopPropagation()}>
                <h2 className="font-bold text-lg text-gray-900 mb-1">Ajouter une image</h2>
                <p className="text-gray-400 text-sm mb-5">{imgModalCard.front}</p>
                <label className="flex items-center gap-3 w-full py-3.5 px-4 bg-gray-900 text-white rounded-2xl mb-3 cursor-pointer active:scale-95 transition-transform">
                  <Camera size={18} />
                  <span className="font-semibold text-sm">Uploader une photo</span>
                  <input type="file" accept="image/*" capture="environment" className="hidden"
                    onChange={(e) => { setUploadingCard(imgModalCard.id); setShowImgModal(false); handleImageUpload(e) }} />
                </label>
                <div className="mb-3">
                  <input value={imgUrlInput} onChange={e => setImgUrlInput(e.target.value)}
                    placeholder="Coller une URL d'image…"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-gray-400 text-sm mb-2" />
                  <button onClick={saveImgUrl} disabled={!imgUrlInput.trim()}
                    className="w-full py-3 bg-gray-100 text-gray-900 rounded-xl font-semibold text-sm disabled:opacity-30 active:scale-95 transition-transform">
                    Enregistrer l'URL
                  </button>
                </div>
                <a href={`https://fr.wikipedia.org/wiki/${encodeURIComponent(imgModalCard.front)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 text-blue-500 text-sm font-medium">
                  🔍 Chercher "{imgModalCard.front}" sur Wikipedia
                </a>
              </div>
            </div>
          )}
        </div>

        <div className="px-5 pb-8 flex-shrink-0">
          {flipped ? (
            <div className="space-y-3">
              <p className="text-white/60 text-xs text-center mb-2">Comment tu t'en es sorti ?</p>
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => rateCard('hard')}
                  className="py-3.5 bg-red-500/80 text-white rounded-2xl text-sm font-semibold active:scale-95 transition-transform">
                  😅 Difficile
                </button>
                <button onClick={() => rateCard('medium')}
                  className="py-3.5 bg-orange-400/80 text-white rounded-2xl text-sm font-semibold active:scale-95 transition-transform">
                  🤔 Moyen
                </button>
                <button onClick={() => rateCard('easy')}
                  className="py-3.5 bg-green-500/80 text-white rounded-2xl text-sm font-semibold active:scale-95 transition-transform">
                  😎 Facile
                </button>
              </div>
              <button onClick={goNext}
                className="w-full py-3 text-white/50 text-xs font-medium active:text-white/80 transition-colors">
                Passer sans noter →
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <button onClick={() => setFlipped(true)}
                className="w-full py-4 bg-white/15 text-white rounded-full text-sm font-semibold active:scale-95 transition-transform">
                Retourner la carte
              </button>
              <button onClick={goNext}
                className="w-full py-3 text-white/50 text-xs font-medium active:text-white/80 transition-colors">
                Passer sans noter →
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ─── CURIOSITÉS ───────────────────────────────────────────────────────────
  if (screen === 'curiosities') {
    const card = dailyCards[idx]
    const isLast = idx === dailyCards.length - 1
    const bgColor = '#f5576c'

    return (
      <div className="flex flex-col" style={{ height: '100%', minHeight: 0, background: 'linear-gradient(160deg, #f093fbee, #f5576caa)' }}>
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

        <div className="mx-5 h-1 bg-white/20 rounded-full mb-4 flex-shrink-0">
          <div className="h-full bg-white rounded-full transition-all duration-500"
            style={{ width: `${((idx + 1) / dailyCards.length) * 100}%` }} />
        </div>

        {dailyCards.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-white text-center px-8">
            <div className="text-5xl mb-4">✨</div>
            <p className="font-bold text-lg mb-2">Aucune curiosité encore</p>
            <button onClick={() => setShowAddCuriosity(true)}
              className="px-6 py-3 bg-white/20 rounded-full font-semibold text-sm mt-4">
              + Ajouter une curiosité
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 flex flex-col items-center justify-center px-5 pb-4 min-h-0">
              <div className="w-full max-w-sm" style={{ perspective: '1000px' }}>
                <div onClick={() => setFlipped(f => !f)}
                  style={{
                    height: '16rem', cursor: 'pointer',
                    transformStyle: 'preserve-3d',
                    transition: 'transform 0.55s cubic-bezier(.4,0,.2,1)',
                    transform: flipped ? 'rotateX(180deg)' : 'rotateX(0deg)',
                    position: 'relative'
                  }}>
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

            <div className="px-5 pb-8 flex-shrink-0">
              <div className="flex items-center justify-center gap-4">
                <button onClick={() => { if (idx > 0) { setFading(true); setTimeout(() => { setFlipped(false); setIdx(i => i - 1); setFading(false) }, 180) } }}
                  disabled={idx === 0}
                  className="w-14 h-14 rounded-full bg-white/15 flex items-center justify-center text-white active:scale-90 disabled:opacity-25 transition-transform">
                  <ChevronLeft size={26} />
                </button>
                <button onClick={() => setFlipped(f => !f)}
                  className="flex-1 max-w-xs py-3.5 bg-white/15 text-white rounded-full text-sm font-semibold active:scale-95 transition-transform">
                  Retourner
                </button>
                <button onClick={() => {
                  if (!isLast) { setFading(true); setTimeout(() => { setFlipped(false); setIdx(i => i + 1); setFading(false) }, 180) }
                  else setScreen('home')
                }}
                  className="w-14 h-14 rounded-full bg-white/15 flex items-center justify-center text-white active:scale-90 transition-transform">
                  {isLast ? <Check size={22} /> : <ChevronRight size={26} />}
                </button>
              </div>
            </div>
          </>
        )}

        {showAddCuriosity && (
          <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={() => setShowAddCuriosity(false)}>
            <div className="bg-white w-full rounded-t-3xl p-6" onClick={e => e.stopPropagation()}>
              <h2 className="font-bold text-lg text-gray-900 mb-4">✨ Nouvelle curiosité</h2>
              <input value={newQ} onChange={e => setNewQ(e.target.value)}
                placeholder="La question ou le fait…"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-gray-400 text-sm mb-3" />
              <textarea value={newA} onChange={e => setNewA(e.target.value)}
                placeholder="La réponse ou l'explication…"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-gray-400 text-sm resize-none h-24 mb-4" />
              <button onClick={addCuriosity} disabled={!newQ.trim() || !newA.trim()}
                className="w-full py-3.5 bg-gray-900 text-white rounded-full font-semibold text-sm disabled:opacity-30">
                Ajouter
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return null
}