import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import {
  ChevronLeft, ChevronRight, Plus, BookOpen,
  ArrowLeft, RotateCcw, Sparkles, Upload, X, Check
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

// Algorithme répétition espacée simple
function nextReview(level, rating) {
  const newLevel = rating === 'easy' ? level + 2 : rating === 'medium' ? level + 1 : Math.max(0, level - 1)
  const days = rating === 'easy' ? Math.pow(2, newLevel) : rating === 'medium' ? newLevel + 1 : 0.25
  const next = new Date()
  next.setTime(next.getTime() + days * 24 * 60 * 60 * 1000)
  return { newLevel, next }
}

export default function App() {
  const [screen, setScreen] = useState('profiles')
  const [profiles, setProfiles] = useState([])
  const [profile, setProfile] = useState(null)
  const [decks, setDecks] = useState([])
  const [activeDecks, setActiveDecks] = useState(null) // { deck, cards }
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [fading, setFading] = useState(false)
  const [imgError, setImgError] = useState(false)
  const [loading, setLoading] = useState(false)

  // Curiosités
  const [dailyCards, setDailyCards] = useState([])
  const [newQ, setNewQ] = useState('')
  const [newA, setNewA] = useState('')
  const [showAddCuriosity, setShowAddCuriosity] = useState(false)

  // Upload JSON
  const [showUpload, setShowUpload] = useState(false)
  const [uploadStatus, setUploadStatus] = useState(null)

  // Chargement initial
  useEffect(() => {
    supabase.from('profiles').select('*').then(({ data }) => {
      setProfiles(data || [])
      // Restaurer profil mémorisé
      const saved = localStorage.getItem('flashcard-profile')
      if (saved) {
        const p = (data || []).find(p => p.id === saved)
        if (p) { setProfile(p); setScreen('home') }
      }
    })
  }, [])

  useEffect(() => {
    if (profile) loadDecks()
  }, [profile])

  const loadDecks = async () => {
    const { data } = await supabase.from('decks').select('*').order('created_at')
    setDecks(data || [])
  }

  const selectProfile = (p) => {
    setProfile(p)
    localStorage.setItem('flashcard-profile', p.id)
    setScreen('home')
  }

  // Démarrer un jeu thématique
  const startDeck = async (deck) => {
    setLoading(true)
    const { data: cards } = await supabase.from('cards').select('*').eq('deck_id', deck.id)
    // Récupérer la progression
    const { data: progress } = await supabase
      .from('card_progress').select('*')
      .eq('profile_id', profile.id)
      .in('card_id', cards.map(c => c.id))

    const progressMap = Object.fromEntries((progress || []).map(p => [p.card_id, p]))
    const now = new Date()

    // Cartes dues aujourd'hui
    const due = cards.filter(c => {
      const p = progressMap[c.id]
      if (!p) return true
      return new Date(p.next_review) <= now
    })

    // Ordre aléatoire
    const shuffle = arr => [...arr].sort(() => Math.random() - 0.5)
    const toStudy = shuffle(due.length > 0 ? due : cards)
    setActiveDecks({ deck, cards: toStudy, allCards: cards, progressMap })
    setIdx(0); setFlipped(false); setImgError(false)
    setScreen('study')
    setLoading(false)
  }

  // Notation répétition espacée
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

  const goNext = () => {
    if (idx < activeDecks.cards.length - 1) {
      setFading(true)
      setTimeout(() => { setFlipped(false); setImgError(false); setIdx(i => i + 1); setFading(false) }, 180)
    } else {
      setScreen('home')
    }
  }

  // Curiosités du jour
  const startCuriosities = async () => {
    setLoading(true)
    // 5 curiosités perso
    const { data: curios } = await supabase
      .from('curiosities').select('*').eq('profile_id', profile.id).order('created_at', { ascending: false }).limit(20)

    // 5 cartes aléatoires dans les jeux
    const { data: randomCards } = await supabase
      .from('cards').select('*').limit(50)

    const shuffledCurios = (curios || []).sort(() => Math.random() - 0.5).slice(0, 5)
    const shuffledCards = (randomCards || []).sort(() => Math.random() - 0.5).slice(0, 5)

    const mixed = [...shuffledCurios.map(c => ({ front: c.question, back: c.answer, isCuriosity: true })),
                   ...shuffledCards.map(c => ({ front: c.front, back: c.back }))
    ].sort(() => Math.random() - 0.5)

    setDailyCards(mixed)
    setIdx(0); setFlipped(false)
    setScreen('curiosities')
    setLoading(false)
  }

  const addCuriosity = async () => {
    if (!newQ.trim() || !newA.trim()) return
    await supabase.from('curiosities').insert({ profile_id: profile.id, question: newQ, answer: newA })
    setNewQ(''); setNewA(''); setShowAddCuriosity(false)
  }

  // Upload JSON
  const handleUploadJSON = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploadStatus('loading')
    try {
      const text = await file.text()
      const json = JSON.parse(text)
      // Insérer le deck
      const { data: deck } = await supabase.from('decks').insert({
        name: json.name, theme: json.theme || 'autre', description: json.description || ''
      }).select().single()
      // Insérer les cartes
      const cards = json.cards.map(c => ({ deck_id: deck.id, front: c.front, back: c.back, image_url: c.imageUrl || c.image_url || null }))
      await supabase.from('cards').insert(cards)
      await loadDecks()
      setUploadStatus('success')
      setTimeout(() => { setShowUpload(false); setUploadStatus(null) }, 2000)
    } catch {
      setUploadStatus('error')
    }
  }

  const color = activeDecks ? (TC[activeDecks.deck.theme] || '#6A9BCC') : '#6A9BCC'
  const themeObj = THEMES.find(t => t.id === activeDecks?.deck?.theme)

  // ─── PROFILS ──────────────────────────────────────────────────────────────
  if (screen === 'profiles') return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6">
      <div className="text-5xl mb-4">🃏</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Mes Flashcards</h1>
      <p className="text-gray-400 text-sm mb-10">Qui est-ce ?</p>
      <div className="w-full max-w-xs space-y-3">
        {profiles.map(p => (
          <button key={p.id} onClick={() => selectProfile(p)}
            className="w-full bg-white rounded-2xl p-4 border border-gray-100 flex items-center gap-4 shadow-sm active:scale-95 transition-transform">
            <span className="text-3xl">{p.avatar}</span>
            <span className="font-semibold text-gray-900 text-lg">{p.name}</span>
          </button>
        ))}
      </div>
    </div>
  )

  // ─── HOME ─────────────────────────────────────────────────────────────────
  if (screen === 'home') {
    const themesPresents = THEMES.filter(t => decks.some(d => d.theme === t.id))
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-100 px-5 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-gray-900">🃏 Flashcards</h1>
              <p className="text-xs text-gray-400">{profile?.avatar} {profile?.name}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowUpload(true)}
                className="p-2.5 bg-gray-100 rounded-xl text-gray-600 active:scale-95 transition-transform">
                <Upload size={18} />
              </button>
              <button onClick={() => setProfile(null) || setScreen('profiles')}
                className="p-2.5 bg-gray-100 rounded-xl text-gray-600 active:scale-95 transition-transform">
                <X size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="px-5 py-5 max-w-lg mx-auto">
          {/* Curiosités du jour */}
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

          {/* Jeux thématiques */}
          {decks.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-3">🎴</div>
              <p className="text-gray-500 font-medium mb-1">Aucun jeu disponible</p>
              <p className="text-gray-400 text-sm">Uploade un fichier JSON pour commencer</p>
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
                        <div className="text-xs font-semibold flex items-center gap-1 flex-shrink-0" style={{ color: TC[deck.theme] || '#7A7A8A' }}>
                          <BookOpen size={13} />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal upload */}
        {showUpload && (
          <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={() => setShowUpload(false)}>
            <div className="bg-white w-full rounded-t-3xl p-6" onClick={e => e.stopPropagation()}>
              <h2 className="font-bold text-lg text-gray-900 mb-2">Importer un jeu</h2>
              <p className="text-gray-400 text-sm mb-5">Sélectionne un fichier JSON généré par Claude</p>
              {uploadStatus === 'success' ? (
                <div className="flex items-center gap-2 text-green-600 font-semibold justify-center py-4">
                  <Check size={20} /> Jeu importé avec succès !
                </div>
              ) : uploadStatus === 'error' ? (
                <p className="text-red-500 text-center py-4">Erreur — vérifie le format du fichier</p>
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

  // ─── STUDY (répétition espacée) ───────────────────────────────────────────
  if (screen === 'study' && activeDecks) {
    const card = activeDecks.cards[idx]
    const hasImage = card.image_url && !imgError
    const isLast = idx === activeDecks.cards.length - 1

    return (
      <div className="min-h-screen flex flex-col" style={{ background: `linear-gradient(160deg, ${color}ee, ${color}aa)` }}>
        <div className="flex items-center justify-between px-5 pt-12 pb-4">
          <button onClick={() => setScreen('home')} className="text-white/75 active:text-white">
            <ArrowLeft size={22} />
          </button>
          <div className="text-center">
            <p className="text-white font-bold text-sm">{activeDecks.deck.name}</p>
            <p className="text-white/50 text-xs">{themeObj?.emoji} {themeObj?.label}</p>
          </div>
          <p className="text-white/75 text-sm font-semibold">{idx + 1}/{activeDecks.cards.length}</p>
        </div>

        <div className="mx-5 h-1 bg-white/20 rounded-full mb-6">
          <div className="h-full bg-white rounded-full transition-all duration-500"
            style={{ width: `${((idx + 1) / activeDecks.cards.length) * 100}%` }} />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-5 pb-4">
          <div className={`w-full max-w-sm transition-all duration-180 ${fading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
            style={{ perspective: '1000px' }}>
            <div onClick={() => setFlipped(f => !f)}
              style={{
                height: hasImage ? '22rem' : '16rem', cursor: 'pointer',
                transformStyle: 'preserve-3d',
                transition: 'transform 0.55s cubic-bezier(.4,0,.2,1)',
                transform: flipped ? 'rotateX(180deg)' : 'rotateX(0deg)',
                position: 'relative'
              }}>
              {/* Recto */}
              <div className="absolute inset-0 bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
                style={{ backfaceVisibility: 'hidden' }}>
                {hasImage ? (
                  <>
                    <img src={card.image_url} alt={card.front} className="flex-1 w-full object-cover"
                      onError={() => setImgError(true)} />
                    <div className="px-4 py-3 text-center border-t border-gray-100">
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
              {/* Verso */}
              <div className="absolute inset-0 bg-white rounded-3xl shadow-2xl flex flex-col items-center justify-center p-7"
                style={{ backfaceVisibility: 'hidden', transform: 'rotateX(180deg)' }}>
                <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color }}>Réponse</p>
                {hasImage && <p className="text-sm font-semibold text-gray-400 mb-3">{card.front}</p>}
                <p className="text-lg text-gray-700 text-center leading-relaxed">{card.back}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Boutons notation */}
        <div className="px-5 pb-12">
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
          {isLast && !flipped && (
            <button onClick={() => setScreen('home')}
              className="w-full mt-3 flex items-center justify-center gap-2 py-3 text-white/60 text-sm">
              <RotateCcw size={14} /> Terminer la session
            </button>
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
      <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(160deg, #f093fbee, #f5576caa)' }}>
        <div className="flex items-center justify-between px-5 pt-12 pb-4">
          <button onClick={() => setScreen('home')} className="text-white/75 active:text-white">
            <ArrowLeft size={22} />
          </button>
          <div className="text-center">
            <p className="text-white font-bold text-sm">✨ Curiosités du jour</p>
            <p className="text-white/50 text-xs">{card?.isCuriosity ? 'Ta curiosité' : 'Carte thématique'}</p>
          </div>
          <button onClick={() => setShowAddCuriosity(true)} className="text-white/75 active:text-white">
            <Plus size={22} />
          </button>
        </div>

        <div className="mx-5 h-1 bg-white/20 rounded-full mb-6">
          <div className="h-full bg-white rounded-full transition-all duration-500"
            style={{ width: `${((idx + 1) / dailyCards.length) * 100}%` }} />
        </div>

        {dailyCards.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-white text-center px-8">
            <div className="text-5xl mb-4">✨</div>
            <p className="font-bold text-lg mb-2">Aucune curiosité encore</p>
            <p className="text-white/70 text-sm mb-6">Ajoute ta première curiosité !</p>
            <button onClick={() => setShowAddCuriosity(true)}
              className="px-6 py-3 bg-white/20 rounded-full font-semibold text-sm">
              + Ajouter une curiosité
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 flex flex-col items-center justify-center px-5 pb-4">
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

            <div className="px-5 pb-12">
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

        {/* Modal ajout curiosité */}
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