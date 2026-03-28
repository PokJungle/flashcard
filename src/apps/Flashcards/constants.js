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

// Labels thèmes dérivés de THEMES (emoji + label) — source unique
export const THEME_LABELS = Object.fromEntries(THEMES.map(t => [t.id, `${t.emoji} ${t.label}`]))

// Modes du Quiz (Duo / Carré / Cash) — utilisés dans HomeQuiz et QuizScreen
export const QUIZ_MODES = [
  { id: 'duo',   label: 'Duo',   pts: 1, desc: '2 choix',     dots: 1, color: '#0C447C', border: '#85B7EB', bg: '#E6F1FB', dotFull: '#185FA5', dotEmpty: '#B5D4F4' },
  { id: 'carre', label: 'Carré', pts: 3, desc: '4 choix',     dots: 2, color: '#26215C', border: '#AFA9EC', bg: '#EEEDFE', dotFull: '#534AB7', dotEmpty: '#CECBF6' },
  { id: 'cash',  label: 'Cash',  pts: 5, desc: 'texte libre', dots: 3, color: '#412402', border: '#FAC775', bg: '#FAEEDA', dotFull: '#854F0B', dotEmpty: '#FAC775' },
]

// Couleurs d'ambiance par thème (utilisées dans QuizScreen)
export const QUIZ_THEME_COLORS = {
  geographie:   { bg: '#E6F1FB', border: '#B5D4F4', text: '#185FA5' },
  histoire:     { bg: '#FAECE7', border: '#F5C4B3', text: '#712B13' },
  sciences:     { bg: '#E1F5EE', border: '#9FE1CB', text: '#085041' },
  sciences_nat: { bg: '#EAF3DE', border: '#C0DD97', text: '#27500A' },
  culture:      { bg: '#FBEAF0', border: '#F4C0D1', text: '#72243E' },
  langues:      { bg: '#EEEDFE', border: '#CECBF6', text: '#3C3489' },
  math:         { bg: '#FAEEDA', border: '#FAC775', text: '#633806' },
  autre:        { bg: '#F1EFE8', border: '#D3D1C7', text: '#444441' },
}