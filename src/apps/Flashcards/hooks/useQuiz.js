import { useState, useCallback } from 'react'
import { supabase } from '../../../supabase'
import { QUIZ_SOURCES_KEY } from '../constants'

const THEME_LABELS = {
  sciences:     '🔬 Sciences',
  histoire:     '🏛️ Histoire',
  geographie:   '🌍 Géographie',
  langues:      '💬 Langues',
  culture:      '🎨 Culture',
  sciences_nat: '🌿 Sciences nat.',
  math:         '📐 Maths',
  autre:        '✨ Autre',
}

function selectDiversified(questions, n) {
  if (questions.length <= n) return shuffle([...questions])
  const byTheme = {}
  for (const q of questions) {
    const t = q.theme || 'autre'
    if (!byTheme[t]) byTheme[t] = []
    byTheme[t].push(q)
  }
  for (const t in byTheme) byTheme[t] = shuffle(byTheme[t])
  const themes = Object.keys(byTheme).sort(() => Math.random() - 0.5)
  const result = []
  let i = 0
  while (result.length < n && i < n * themes.length + themes.length) {
    const t = themes[i % themes.length]
    if (byTheme[t]?.length > 0) result.push(byTheme[t].shift())
    i++
  }
  return result.slice(0, n)
}

/**
 * Génère 3 mauvaises réponses à partir d'un pool de valeurs.
 * Évite la bonne réponse et les doublons.
 */
function generateWrongAnswers(correct, pool, count = 3) {
  const candidates = pool
    .filter(v => v && v.trim() !== '' && v.toLowerCase() !== correct.toLowerCase())
    .sort(() => Math.random() - 0.5)
  return [...new Set(candidates)].slice(0, count)
}

/**
 * Mélange un tableau.
 */
const shuffle = arr => [...arr].sort(() => Math.random() - 0.5)

export function useQuiz(profile) {
  const [questions, setQuestions]   = useState([])  // liste des questions préparées
  const [idx, setIdx]               = useState(0)
  const [score, setScore]           = useState({ points: 0, correct: 0, wrong: 0 })
  const [loading, setLoading]       = useState(false)
  const [sessionReady, setSessionReady] = useState(false)

  const isFinished = sessionReady && idx >= questions.length

  // ── Charger et préparer une session Quiz ──────────────────
  const startQuiz = useCallback(async (nbQuestions = 10) => {
    setLoading(true)
    setSessionReady(false)
    setScore({ points: 0, correct: 0, wrong: 0 })

    // Lire les sources cochées depuis localStorage
    const savedSources = JSON.parse(localStorage.getItem(QUIZ_SOURCES_KEY) || '{}')

    const allQuestions = []

    // ── 1. Questions depuis les decks cochés ──────────────
    const { data: decks } = await supabase.from('decks').select('id, name, theme')
    const { data: allCriteria } = await supabase
      .from('deck_criteria')
      .select('*')
      .order('position')

    for (const deck of (decks || [])) {
      // Vérifier si ce deck est coché (défaut = true si jamais configuré)
      const sourceKey = `deck_${deck.id}`
      if (savedSources[sourceKey] === false) continue

      const criteria = (allCriteria || []).filter(
        c => c.deck_id === deck.id && c.interrogeable !== false && c.name !== 'verso'
      )
      if (!criteria.length) continue

      const { data: cards } = await supabase
        .from('cards').select('id').eq('deck_id', deck.id)
      if (!cards?.length) continue

      const cardIds = cards.map(c => c.id)

      const { data: values } = await supabase
        .from('card_values')
        .select('card_id, criterion_id, value')
        .in('card_id', cardIds)

      // valuesMap[cardId][criterionId] = value
      const valuesMap = {}
      for (const v of (values || [])) {
        if (!v.value?.trim()) continue
        if (!valuesMap[v.card_id]) valuesMap[v.card_id] = {}
        valuesMap[v.card_id][v.criterion_id] = v.value
      }

      // Pool de réponses par critère — inclure TOUS les critères du deck
      // (y compris les non-interrogeables qui peuvent être des réponses cibles)
      const allDeckCriteriaForPool = (allCriteria || []).filter(c => c.deck_id === deck.id)
      const poolByCrit = {}
      for (const crit of allDeckCriteriaForPool) {
        poolByCrit[crit.id] = Object.values(valuesMap)
          .map(cv => cv[crit.id])
          .filter(Boolean)
      }

      // Critère image pour contexte visuel
      const imgCrit = (allCriteria || []).find(
        c => c.deck_id === deck.id && c.type === 'image'
      )

      // Tous les critères du deck pour retrouver le critère réponse par id
      const allDeckCriteria = (allCriteria || []).filter(c => c.deck_id === deck.id)

      // Générer une question par critère interrogeable configuré
      for (const card of cards) {
        const cardVals = valuesMap[card.id] || {}

        for (const questionCrit of criteria) {
          // Doit avoir un quiz_answer_criterion_id configuré
          if (!questionCrit.quiz_answer_criterion_id) continue

          const answerCrit = allDeckCriteria.find(c => c.id === questionCrit.quiz_answer_criterion_id)
          if (!answerCrit) continue

          const questionValue = cardVals[questionCrit.id]
          const answer        = cardVals[answerCrit.id]
          if (!questionValue?.trim() || !answer?.trim()) continue

          // Mauvaises réponses = autres valeurs du critère réponse
          const wrongs = generateWrongAnswers(answer, poolByCrit[answerCrit.id] || [])
          if (wrongs.length < 2) continue

          // Si questionCrit est image → l'image IS la question
          // Si answerCrit est image → les options sont des images
          const questionIsImage = questionCrit.type === 'image'
          const answerIsImage   = answerCrit.type === 'image'

          allQuestions.push({
            type:          'deck',
            deckId:        deck.id,
            deckName:      deck.name,
            theme:         deck.theme,
            themeName:     THEME_LABELS[deck.theme] || deck.name,
            question:      questionCrit.question_title || `Quel est ${questionCrit.name} ?`,
            questionValue: questionIsImage ? null : questionValue,   // texte affiché sous la question
            imageUrl:      questionIsImage ? questionValue : null,   // image affichée comme question
            answer,
            options:       shuffle([answer, ...wrongs.slice(0, 3)]),
            optionsAreImages: answerIsImage,                         // les options sont des URLs
            hint:          questionIsImage ? null : questionValue,
          })
        }
      }
    }

    // ── 2. Questions libres cochées ───────────────────────
    if (savedSources['quiz_questions'] !== false) {
      const { data: freeQs } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('profile_id', profile.id)

      for (const q of (freeQs || [])) {
        // Utiliser les mauvaises réponses définies manuellement
        const wrongs = (q.wrong_answers || []).filter(Boolean)
        if (wrongs.length < 2) continue  // skip si pas assez de distracteurs

        allQuestions.push({
          type:      'free',
          theme:     'autre',
          themeName: '✨ Questions libres',
          question:  q.question,
          answer:    q.answer,
          options:   shuffle([q.answer, ...wrongs.slice(0, 3)]),
          imageUrl:  null,
          hint:      null,
          optionsAreImages: false,
        })
      }
    }

    if (!allQuestions.length) {
      setLoading(false)
      return false  // rien à afficher
    }

    // Sélection diversifiée par thème (évite de répéter le même thème)
    const selected = selectDiversified(allQuestions, nbQuestions)
    setQuestions(selected)
    setIdx(0)
    setSessionReady(true)
    setLoading(false)
    return true
  }, [profile])

  const answerQuestion = useCallback((chosen, pts, isCorrect) => {
    setScore(s => ({
      points:  s.points  + (isCorrect ? (pts || 1) : 0),
      correct: s.correct + (isCorrect ? 1 : 0),
      wrong:   s.wrong   + (isCorrect ? 0 : 1),
    }))
    return isCorrect
  }, [])

  const nextQuestion = useCallback(() => {
    setIdx(i => i + 1)
  }, [])

  const currentQuestion = sessionReady && idx < questions.length ? questions[idx] : null

  return {
    questions, currentQuestion, idx,
    score, loading, sessionReady, isFinished,
    startQuiz, answerQuestion, nextQuestion,
  }
}