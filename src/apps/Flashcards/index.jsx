import { useState, useEffect } from 'react'
import { Check, Upload, X } from 'lucide-react'
import { supabase } from '../../supabase'
import { TABS, SCREENS } from './constants'
import { useMemoire } from './hooks/useMemoire'
import { useStudySession } from './hooks/useStudySession'
import { useQuiz } from './hooks/useQuiz'
import HomeMemoire from './screens/HomeMemoire'
import StudyScreen from './screens/StudyScreen'
import SessionEnd from './screens/SessionEnd'
import ManageDeck from './screens/ManageDeck'
import HomeQuiz from './screens/HomeQuiz'
import QuizScreen from './screens/QuizScreen'
import QuizEnd from './screens/QuizEnd'
import ManageQuestions from './screens/ManageQuestions'
import TabBar from '../../components/TabBar'

const MEMOIRE_COLOR = '#4f46e5'

const MEMOIRE_TABS = (badge) => [
  { id: TABS.MEMOIRE, emoji: '🧠', label: 'Mémoire', badge },
  { id: TABS.QUIZ,    emoji: '⚡', label: 'Quiz',    badge: 0 },
]

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
  const [quizNb, setQuizNb]             = useState(10)

  const { decks, dueMap, progressMap, totalDue, loading: memoireLoading, reload } = useMemoire(profile)

  // Badge nav = dues uniquement sur les decks actifs du profil
  const activeTotalDue = (() => {
    try {
      const saved = JSON.parse(localStorage.getItem(`memoire-active-decks-${profile?.id}`) || 'null')
      if (saved === null) return totalDue
      return decks.filter(d => saved.includes(d.id)).reduce((s, d) => s + (dueMap[d.id]?.badge ?? dueMap[d.id] ?? 0), 0)
    } catch { return totalDue }
  })()
  const {
    session, currentItem, idx: studyIdx,
    loading: studyLoading, sessionReady, isFinished: studyFinished, sessionStats,
    startSession, rateItem, goNext: goNextStudy,
  } = useStudySession(profile)
  const {
    currentQuestion, idx: quizIdx, score, loading: quizLoading,
    sessionReady: quizReady, isFinished: quizFinished,
    startQuiz, answerQuestion, nextQuestion,
  } = useQuiz(profile)

  // Reload les dues quand la session se termine
  useEffect(() => {
    if (studyFinished) reload()
  }, [studyFinished])

  // ── Navigation Mémoire ─────────────────────────────────────
  const goHome = () => { setScreen(SCREENS.HOME); setActiveDeck(null); reload() }

  const handleStartDeck = async (deck, limit = null) => {
    setActiveDeck(deck)
    setScreen(SCREENS.STUDY)
    await startSession(deck, limit)
  }

  const handleManageDeck = (deck) => {
    setActiveDeck(deck)
    setScreen(SCREENS.MANAGE_DECK)
  }

  const handleRate  = async (rating) => { await rateItem(rating) }
  const handleSkip  = () => { goNextStudy() }

  // ── Navigation Quiz ────────────────────────────────────────
  const handleStartQuiz = async (nb) => {
    setQuizNb(nb)
    setScreen(SCREENS.QUIZ_PLAY)
    const ok = await startQuiz(nb)
    if (!ok) setScreen(SCREENS.HOME_QUIZ)
  }

  const handleAnswer = (chosen, pts, isCorrect) => { answerQuestion(chosen, pts, isCorrect) }

  const handleNextQuestion = () => { nextQuestion() }

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

      if (json.criteria && Array.isArray(json.criteria)) {
        const { data: insertedCriteria } = await supabase
          .from('deck_criteria')
          .insert(json.criteria.map((c, i) => ({
            deck_id: deck.id,
            name: c.name,
            type: c.type || 'text',
            question_title: c.question_title || `Quel est ${c.name} ?`,
            position: i,
            interrogeable: c.interrogeable !== false,
          }))).select()

        const criteriaMap = Object.fromEntries((insertedCriteria || []).map(c => [c.name, c.id]))

        for (const cardData of json.cards) {
          const { data: card } = await supabase
            .from('cards').insert({ deck_id: deck.id, front: '', back: '' }).select().single()
          const values = Object.entries(cardData.values || {})
            .filter(([name, value]) => criteriaMap[name] && value !== '' && value !== null && value !== undefined)
            .map(([name, value]) => ({ card_id: card.id, criterion_id: criteriaMap[name], value: String(value) }))
          if (values.length > 0) await supabase.from('card_values').insert(values)
        }
      } else if (json.cards && Array.isArray(json.cards)) {
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
      console.error('Import error:', err)
      setUploadStatus('error')
    }
    e.target.value = ''
  }

  // ── Render ─────────────────────────────────────────────────
  const renderContent = () => {
    // ── Onglet Mémoire ──────────────────────────────────────
    if (tab === TABS.MEMOIRE) {
      if (screen === SCREENS.HOME) {
        return (
          <HomeMemoire
            profile={profile}
            decks={decks}
            dueMap={dueMap}
            progressMap={progressMap}
            totalDue={totalDue}
            loading={memoireLoading}
            onStartDeck={handleStartDeck}
            onManageDeck={handleManageDeck}
            onShowUpload={() => setShowUpload(true)}
            onDeckCreated={(deck) => {
              reload()
              handleManageDeck(deck)
            }}
          />
        )
      }

      if (screen === SCREENS.STUDY) {
        if (studyFinished) {
          return (
            <SessionEnd
              deck={activeDeck}
              stats={sessionStats}
              profile={profile}
              onBack={goHome}
              onRestart={() => handleStartDeck(activeDeck)}
            />
          )
        }
        if (!sessionReady || studyLoading) return <Loader />
        return (
          <StudyScreen
            profile={profile}
            deck={activeDeck}
            session={session}
            currentItem={currentItem}
            idx={studyIdx}
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
            profile={profile}
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

    // ── Onglet Quiz ─────────────────────────────────────────
    if (tab === TABS.QUIZ) {
      if (screen === SCREENS.HOME || screen === SCREENS.HOME_QUIZ) {
        return (
          <HomeQuiz
            profile={profile}
            onStartQuiz={handleStartQuiz}
            onManageQuestions={() => setScreen(SCREENS.MANAGE_QUESTIONS)}
          />
        )
      }

      if (screen === SCREENS.QUIZ_PLAY) {
        if (quizLoading || !quizReady) return <Loader />
        if (quizFinished) {
          return (
            <QuizEnd
              score={score}
              total={quizIdx}
              onRestart={() => handleStartQuiz(quizNb)}
              onBack={() => setScreen(SCREENS.HOME_QUIZ)}
            />
          )
        }
        return (
          <QuizScreen
            currentQuestion={currentQuestion}
            idx={quizIdx}
            total={quizNb}
            score={score}
            onAnswer={handleAnswer}
            onNext={handleNextQuestion}
            onQuit={() => setScreen(SCREENS.HOME_QUIZ)}
          />
        )
      }

      if (screen === SCREENS.MANAGE_QUESTIONS) {
        return (
          <ManageQuestions
            profile={profile}
            onBack={() => setScreen(SCREENS.HOME_QUIZ)}
          />
        )
      }
    }

    return null
  }

  return (
    <div className="flex flex-col" style={{ height: '100%' }}>
      <div className="flex-1 flex flex-col min-h-0">
        {renderContent()}
      </div>

      <TabBar
        tabs={MEMOIRE_TABS(activeTotalDue ?? totalDue)}
        active={tab}
        onChange={(t) => { setTab(t); setScreen(SCREENS.HOME); setActiveDeck(null) }}
        color={MEMOIRE_COLOR}
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