export const THEMES = [
  { id: 'sciences',     label: 'Sciences',        emoji: '🔬', color: '#4CAF82' },
  { id: 'histoire',     label: 'Histoire',         emoji: '🏛️', color: '#C0784A' },
  { id: 'geographie',   label: 'Géographie',       emoji: '🌍', color: '#6A9BCC' },
  { id: 'langues',      label: 'Langues',          emoji: '💬', color: '#9B6ACC' },
  { id: 'culture',      label: 'Culture générale', emoji: '🎨', color: '#CC6A8A' },
  { id: 'sciences_nat', label: 'Sciences nat.',    emoji: '🌿', color: '#7BBF44' },
  { id: 'math',         label: 'Mathématiques',    emoji: '📐', color: '#CCA46A' },
  { id: 'autre',        label: 'Autre',            emoji: '✨', color: '#7A7A8A' },
]

export const THEME_COLOR = Object.fromEntries(THEMES.map(t => [t.id, t.color]))

export const TABS = {
  MEMOIRE: 'memoire',
  QUIZ: 'quiz',
}

export const SCREENS = {
  HOME:             'home',
  STUDY:            'study',
  SESSION_END:      'session_end',
  MANAGE_DECK:      'manage_deck',
  HOME_QUIZ:        'home_quiz',
  QUIZ_PLAY:        'quiz_play',
  QUIZ_END:         'quiz_end',
  MANAGE_QUESTIONS: 'manage_questions',
}

// Clé localStorage pour les sources Quiz cochées
export const QUIZ_SOURCES_KEY = 'memoire-singe-quiz-sources'