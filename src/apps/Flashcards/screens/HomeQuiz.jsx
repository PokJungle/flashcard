import { useState, useEffect } from 'react'
import { Settings, Zap } from 'lucide-react'
import { supabase } from '../../../supabase'
import { THEMES, THEME_COLOR, QUIZ_SOURCES_KEY } from '../constants'

const THEME_MAP = Object.fromEntries(THEMES.map(t => [t.id, t]))

export default function HomeQuiz({ profile, onStartQuiz, onManageQuestions, dark }) {
  const [decks, setDecks]         = useState([])
  const [freeCount, setFreeCount] = useState(0)
  const [sources, setSources]     = useState({})
  const [nbQuestions, setNbQuestions] = useState(10)
  const [loading, setLoading]     = useState(true)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const [{ data: decksData }, { data: freeQs }] = await Promise.all([
      supabase.from('decks').select('id, name, theme').order('created_at'),
      supabase.from('quiz_questions').select('id').eq('profile_id', profile.id),
    ])
    setDecks(decksData || [])
    setFreeCount(freeQs?.length || 0)
    setSources(JSON.parse(localStorage.getItem(QUIZ_SOURCES_KEY) || '{}'))
    setLoading(false)
  }

  const toggleSource = (key) => {
    setSources(prev => {
      const next = { ...prev, [key]: prev[key] === false ? true : false }
      localStorage.setItem(QUIZ_SOURCES_KEY, JSON.stringify(next))
      return next
    })
  }

  const isChecked = (key) => sources[key] !== false
  const activeCount = [...decks.map(d => `deck_${d.id}`), 'quiz_questions'].filter(k => isChecked(k)).length

  const decksByTheme = decks.reduce((acc, d) => {
    if (!acc[d.theme]) acc[d.theme] = []
    acc[d.theme].push(d)
    return acc
  }, {})

  // Couleurs dark
  const bg      = dark ? '#0f0a1e' : '#f9fafb'
  const card    = dark ? '#1a1035' : '#ffffff'
  const border  = dark ? '#2d1f5e' : '#f3f4f6'
  const textPri = dark ? '#e9d5ff' : '#111827'
  const textSec = dark ? '#a78bfa' : '#9ca3af'
  const textMed = dark ? '#c4b5fd' : '#4b5563'

  return (
    <div className="flex-1 overflow-y-auto pb-6" style={{ background: bg }}>
      <div className="px-4 pt-4 max-w-lg mx-auto">

        {/* ── Hero ── */}
        <div
          onClick={() => onStartQuiz(nbQuestions)}
          className="rounded-3xl p-5 mb-4 cursor-pointer active:scale-95 transition-transform overflow-hidden relative"
          style={{ background: '#533AB7' }}>
          <div style={{
            position: 'absolute', width: 140, height: 140,
            borderRadius: '50%', background: 'rgba(255,255,255,0.06)',
            top: -40, right: -30, pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', width: 80, height: 80,
            borderRadius: '50%', background: 'rgba(255,255,255,0.06)',
            bottom: -20, left: 60, pointerEvents: 'none',
          }} />

          <div className="flex items-start justify-between mb-4 relative">
            <div>
              <p className="text-white font-bold text-lg leading-tight">Session rapide</p>
              <p className="text-white/60 text-sm mt-0.5">{nbQuestions} questions · Duo / Carré / Cash</p>
            </div>
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.15)' }}>
              <Zap size={18} color="white" />
            </div>
          </div>

          <div className="flex gap-2 relative">
            {[5, 10, 20, 30].map(n => (
              <button key={n}
                onClick={e => { e.stopPropagation(); setNbQuestions(n) }}
                className="flex-1 py-1.5 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: nbQuestions === n ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)',
                  color: nbQuestions === n ? 'white' : 'rgba(255,255,255,0.5)',
                  border: nbQuestions === n ? '1px solid rgba(255,255,255,0.3)' : '1px solid transparent',
                }}>
                {n}
              </button>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-2 relative">
            <div className="flex-1 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }} />
            <span className="text-white/80 text-xs font-medium">Lancer ▶</span>
          </div>
        </div>

        {/* ── Rappel système de points ── */}
        <div className="flex gap-2 mb-4">
          {[
            { label: 'Duo',   pts: '1 pt',  bg: '#E6F1FB', border: '#85B7EB', color: '#0C447C', dots: 1, dotFull: '#185FA5', dotEmpty: '#B5D4F4' },
            { label: 'Carré', pts: '3 pts', bg: '#EEEDFE', border: '#AFA9EC', color: '#26215C', dots: 2, dotFull: '#534AB7', dotEmpty: '#CECBF6' },
            { label: 'Cash',  pts: '5 pts', bg: '#FAEEDA', border: '#FAC775', color: '#412402', dots: 3, dotFull: '#854F0B', dotEmpty: '#FAC775' },
          ].map(m => (
            <div key={m.label} className="flex-1 rounded-2xl py-2.5 px-2 text-center"
              style={{
                background: dark ? 'rgba(255,255,255,0.06)' : m.bg,
                border: `1px solid ${dark ? 'rgba(255,255,255,0.1)' : m.border}`
              }}>
              <p className="text-xs font-bold mb-0.5" style={{ color: dark ? '#e9d5ff' : m.color }}>{m.label}</p>
              <p className="text-base font-bold leading-none mb-1.5" style={{ color: dark ? '#e9d5ff' : m.color }}>{m.pts}</p>
              <div style={{ display: 'flex', gap: 3, justifyContent: 'center' }}>
                {[1,2,3].map(i => (
                  <div key={i} style={{
                    width: 5, height: 5, borderRadius: '50%',
                    background: dark
                      ? (i <= m.dots ? '#a78bfa' : 'rgba(255,255,255,0.15)')
                      : (i <= m.dots ? m.dotFull : m.dotEmpty),
                  }} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* ── Sources ── */}
        <div className="rounded-2xl overflow-hidden mb-3"
          style={{ background: card, border: `1px solid ${border}` }}>
          <div className="px-4 py-3 flex items-center justify-between"
            style={{ borderBottom: `1px solid ${border}` }}>
            <p className="text-sm font-semibold" style={{ color: textPri }}>Sources</p>
            <span className="text-xs px-2 py-0.5 rounded-full"
              style={{
                background: activeCount > 0 ? (dark ? '#2d1f5e' : '#EEEDFE') : (dark ? '#1a1035' : '#f3f4f6'),
                color: activeCount > 0 ? (dark ? '#a5b4fc' : '#534AB7') : textSec,
              }}>
              {activeCount} active{activeCount > 1 ? 's' : ''}
            </span>
          </div>

          {loading ? (
            <div className="p-4 text-center text-sm" style={{ color: textSec }}>Chargement…</div>
          ) : (
            <div>
              {Object.entries(decksByTheme).map(([themeId, themeDecks]) => {
                const theme = THEME_MAP[themeId]
                const color = THEME_COLOR[themeId] || '#7A7A8A'
                return (
                  <div key={themeId}>
                    <div className="px-4 py-1.5 flex items-center gap-2"
                      style={{ background: dark ? color + '15' : color + '0a' }}>
                      <span style={{ fontSize: 13 }}>{theme?.emoji}</span>
                      <span className="text-xs font-semibold uppercase tracking-wide"
                        style={{ color }}>
                        {theme?.label}
                      </span>
                    </div>
                    {themeDecks.map(deck => (
                      <SourceRow
                        key={deck.id}
                        label={deck.name}
                        checked={isChecked(`deck_${deck.id}`)}
                        onToggle={() => toggleSource(`deck_${deck.id}`)}
                        color={color}
                        dark={dark}
                        textPri={textPri}
                        textSec={textSec}
                        border={border}
                      />
                    ))}
                  </div>
                )
              })}

              {/* Questions libres */}
              <div>
                <div className="px-4 py-1.5 flex items-center gap-2"
                  style={{ background: dark ? '#7A7A8A15' : '#7A7A8A0a' }}>
                  <span style={{ fontSize: 13 }}>✨</span>
                  <span className="text-xs font-semibold uppercase tracking-wide"
                    style={{ color: '#7A7A8A' }}>Questions libres</span>
                </div>
                <SourceRow
                  label={freeCount > 0 ? `${freeCount} question${freeCount > 1 ? 's' : ''}` : 'Aucune question'}
                  checked={isChecked('quiz_questions')}
                  onToggle={() => toggleSource('quiz_questions')}
                  color="#7A7A8A"
                  dark={dark}
                  textPri={textPri}
                  textSec={textSec}
                  border={border}
                  action={
                    <button onClick={e => { e.stopPropagation(); onManageQuestions() }}
                      className="p-1.5 transition-colors"
                      style={{ color: textSec }}>
                      <Settings size={14} />
                    </button>
                  }
                />
              </div>
            </div>
          )}
        </div>

        {freeCount === 0 && (
          <p className="text-center text-xs" style={{ color: textSec }}>
            Pas encore de questions libres —{' '}
            <button onClick={onManageQuestions} className="font-medium" style={{ color: '#534AB7' }}>
              en ajouter
            </button>
          </p>
        )}
      </div>
    </div>
  )
}

function SourceRow({ label, checked, onToggle, action, color = '#534AB7', dark, textPri, textSec, border }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 cursor-pointer"
      style={{ borderTop: `1px solid ${border}` }}
      onClick={onToggle}>
      <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all"
        style={{
          background: checked ? color : 'transparent',
          border: `2px solid ${checked ? color : (dark ? '#4338ca' : '#d1d5db')}`,
        }}>
        {checked && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
      <span className="flex-1 text-sm truncate"
        style={{ color: checked ? textPri : textSec, fontWeight: checked ? 500 : 400 }}>
        {label}
      </span>
      {action}
    </div>
  )
}