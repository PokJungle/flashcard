import { useState } from 'react'
import { Check, Upload, X } from 'lucide-react'
import { supabase } from '../../supabase'
import { TABS, SCREENS } from './constants'
import { useMemoire } from './hooks/useMemoire'
import { useStudySession } from './hooks/useStudySession'
import HomeMemoire from './screens/HomeMemoire'
import StudyScreen from './screens/StudyScreen'
import SessionEnd from './screens/SessionEnd'
import ManageDeck from './screens/ManageDeck'

const Placeholder = ({ label }) => (
  <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
    🚧 {label}
  </div>
)

const Loader = () => (
  <div className="flex-1 flex flex-col items-center justify-center gap-3">
    <div className="text-5xl animate-bounce">🐒</div>
    <p className="text-gray-400 text-sm">Chargement…</p>
  </div>
)

export default function Flashcards({ profile }) {
  const [tab, setTab]               = useState(TABS.MEMOIRE)
  const [screen, setScreen]         = useState(SCREENS.HOME)
  const [activeDeck, setActiveDeck] = useState(null)
  const [showUpload, setShowUpload]     = useState(false)
  const [uploadStatus, setUploadStatus] = useState(null)

  const { decks, dueMap, totalDue, loading: memoireLoading, reload } = useMemoire(profile)
  const {
    session, currentItem, idx,
    loading: studyLoading, sessionReady, isFinished, sessionStats,
    startSession, rateItem, goNext,
  } = useStudySession(profile)

  // ── Navigation ─────────────────────────────────────────────
  const goHome = () => { setScreen(SCREENS.HOME); setActiveDeck(null) }

  const handleStartDeck = async (deck) => {
    setActiveDeck(deck)
    setScreen(SCREENS.STUDY)   // on va sur STUDY tout de suite (le loader s'affiche)
    await startSession(deck)   // puis la session se charge (sessionReady devient true)
  }

  const handleManageDeck = (deck) => {
    setActiveDeck(deck)
    setScreen(SCREENS.MANAGE_DECK)
  }

  const handleRate = async (rating) => { await rateItem(rating) }
  const handleSkip = () => { goNext() }

  // ── Import JSON ────────────────────────────────────────────
  const handleUploadJSON = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploadStatus('loading')
    try {
      const json = JSON.parse(await file.text())

      const { data: deck, error: deckErr } = await supabase
        .from('decks')
        .insert({ name: json.name, theme: json.theme || 'autre', description: json.description || '' })
        .select().single()
      if (deckErr) throw deckErr

      // Nouveau format multi-critères
      if (json.criteria && Array.isArray(json.criteria)) {
        const { data: insertedCriteria } = await supabase
          .from('deck_criteria')
          .insert(json.criteria.map((c, i) => ({
            deck_id: deck.id,
            name: c.name,
            type: c.type || 'text',
            question_title: c.question_title || `Quel est ${c.name} ?`,
            position: i,
          }))).select()

        const criteriaMap = Object.fromEntries((insertedCriteria || []).map(c => [c.name, c.id]))

        for (const cardData of json.cards) {
          const { data: card } = await supabase
            .from('cards').insert({ deck_id: deck.id }).select().single()
          const values = Object.entries(cardData.values || {})
            .filter(([name]) => criteriaMap[name])
            .map(([name, value]) => ({ card_id: card.id, criterion_id: criteriaMap[name], value: String(value) }))
          if (values.length > 0) await supabase.from('card_values').insert(values)
        }
      }
      // Ancien format front/back
      else if (json.cards && Array.isArray(json.cards)) {
        const { data: criteria } = await supabase
          .from('deck_criteria')
          .insert([
            { deck_id: deck.id, name: 'recto', type: 'text', question_title: 'Quelle est la réponse ?', position: 0 },
            { deck_id: deck.id, name: 'verso',  type: 'text', question_title: '', position: 1 },
          ]).select()

        const rectoId = criteria?.find(c => c.name === 'recto')?.id
        const versoId = criteria?.find(c => c.name === 'verso')?.id

        for (const cardData of json.cards) {
          const { data: card } = await supabase
            .from('cards')
            .insert({ deck_id: deck.id, front: cardData.front, back: cardData.back })
            .select().single()
          await supabase.from('card_values').insert([
            { card_id: card.id, criterion_id: rectoId, value: cardData.front },
            { card_id: card.id, criterion_id: versoId, value: cardData.back },
          ])
        }
      }

      await reload()
      setUploadStatus('success')
      setTimeout(() => { setShowUpload(false); setUploadStatus(null) }, 2000)
    } catch (err) {
      console.error(err)
      setUploadStatus('error')
    }
    e.target.value = ''
  }

  // ── Render ─────────────────────────────────────────────────
  const renderContent = () => {
    if (tab === TABS.MEMOIRE) {

      if (screen === SCREENS.HOME) {
        return (
          <HomeMemoire
            decks={decks}
            dueMap={dueMap}
            totalDue={totalDue}
            loading={memoireLoading}
            onStartDeck={handleStartDeck}
            onManageDeck={handleManageDeck}
            onShowUpload={() => setShowUpload(true)}
          />
        )
      }

      if (screen === SCREENS.STUDY) {
        // Session terminée
        if (isFinished) {
          reload()
          return (
            <SessionEnd
              deck={activeDeck}
              stats={sessionStats}
              onBack={goHome}
              onRestart={() => handleStartDeck(activeDeck)}
            />
          )
        }
        // Session en cours de chargement
        if (!sessionReady || studyLoading) {
          return <Loader />
        }
        // Session prête
        return (
          <StudyScreen
            profile={profile}
            deck={activeDeck}
            session={session}
            currentItem={currentItem}
            idx={idx}
            sessionStats={sessionStats}
            onRate={handleRate}
            onSkip={handleSkip}
            onBack={goHome}
          />
        )
      }

      if (screen === SCREENS.SESSION_END) {
        return (
          <SessionEnd
            deck={activeDeck}
            stats={sessionStats}
            onBack={goHome}
            onRestart={() => handleStartDeck(activeDeck)}
          />
        )
      }

      if (screen === SCREENS.MANAGE_DECK) {
        return (
          <ManageDeck
            deck={activeDeck}
            onBack={goHome}
            onDelete={async (d) => {
              await supabase.from('decks').delete().eq('id', d.id)
              await reload()
              goHome()
            }}
          />
        )
      }
    }

    if (tab === TABS.QUIZ) {
      if (screen === SCREENS.HOME_QUIZ || screen === SCREENS.HOME) {
        return <Placeholder label="HomeQuiz — en cours" />
      }
      if (screen === SCREENS.QUIZ_PLAY) {
        return <Placeholder label="QuizScreen — en cours" />
      }
      if (screen === SCREENS.MANAGE_QUESTIONS) {
        return <Placeholder label="ManageQuestions — en cours" />
      }
    }

    return null
  }

  return (
    <div className="flex flex-col" style={{ height: '100%' }}>
      <div className="flex-1 flex flex-col min-h-0">
        {renderContent()}
      </div>

      <BottomNav
        tab={tab}
        totalDue={totalDue}
        onSelectTab={(t) => { setTab(t); setScreen(SCREENS.HOME); setActiveDeck(null) }}
      />

      {showUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50"
          onClick={() => { setShowUpload(false); setUploadStatus(null) }}>
          <div className="bg-white w-full rounded-t-3xl p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-bold text-lg text-gray-900">Importer un jeu</h2>
              <button onClick={() => { setShowUpload(false); setUploadStatus(null) }}>
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            <p className="text-gray-400 text-sm mb-5">
              Format classique <code className="text-xs bg-gray-100 px-1 rounded">front/back</code> ou
              nouveau format <code className="text-xs bg-gray-100 px-1 rounded">criteria/values</code>
            </p>
            {uploadStatus === 'success' ? (
              <div className="flex items-center gap-2 text-green-600 font-semibold justify-center py-4">
                <Check size={20} /> Jeu importé !
              </div>
            ) : uploadStatus === 'error' ? (
              <p className="text-red-500 text-center py-4">Erreur — vérifie le format JSON</p>
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

function BottomNav({ tab, totalDue, onSelectTab }) {
  const items = [
    { id: TABS.MEMOIRE, emoji: '🧠', label: 'Mémoire', badge: totalDue },
    { id: TABS.QUIZ,    emoji: '⚡', label: 'Quiz',    badge: 0 },
  ]
  return (
    <nav className="flex-shrink-0 bg-white border-t border-gray-100 flex">
      {items.map(item => {
        const active = tab === item.id
        return (
          <button key={item.id} onClick={() => onSelectTab(item.id)}
            className="flex-1 flex flex-col items-center gap-0.5 py-2.5 relative active:scale-95 transition-transform">
            <span className="text-xl leading-none">{item.emoji}</span>
            <span className={`text-xs font-medium ${active ? 'text-indigo-600' : 'text-gray-400'}`}>
              {item.label}
            </span>
            {item.badge > 0 && (
              <span className="absolute top-1.5 right-1/2 translate-x-4 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-semibold rounded-full flex items-center justify-center px-1">
                {item.badge > 99 ? '99+' : item.badge}
              </span>
            )}
          </button>
        )
      })}
    </nav>
  )
}