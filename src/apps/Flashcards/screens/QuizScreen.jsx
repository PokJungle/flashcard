import { useState, useEffect, useRef } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useThemeColors } from '../../../hooks/useThemeColors'

// ── Algo Cash ─────────────────────────────────────────────
function normalize(s) {
  return s.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[''`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function levenshtein(a, b) {
  const m = a.length, n = b.length
  const d = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => i === 0 ? j : j === 0 ? i : 0)
  )
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      d[i][j] = a[i-1] === b[j-1] ? d[i-1][j-1] : 1 + Math.min(d[i-1][j], d[i][j-1], d[i-1][j-1])
  return d[m][n]
}

function cashThreshold(len) {
  if (len <= 3)  return 0
  if (len <= 6)  return 1
  if (len <= 12) return 2
  return 3
}

function checkCash(input, answer) {
  const inp = normalize(input)
  const ans = normalize(answer)
  if (inp === ans) return { ok: true, exact: true, dist: 0 }
  const dist = levenshtein(inp, ans)
  const thr  = cashThreshold(ans.length)
  if (dist <= thr) return { ok: true, exact: false, dist }
  if (ans.includes(',') || ans.includes(';')) {
    const parts = ans.split(/[,;]/).map(p => p.trim()).filter(Boolean)
    for (const part of parts) {
      const d = levenshtein(inp, part)
      if (d <= cashThreshold(part.length)) return { ok: true, exact: d === 0, dist: d, partial: true }
    }
    if (ans.includes(inp) && inp.length >= 3) return { ok: true, exact: false, dist: 0, partial: true }
  }
  const presque = dist <= thr + 2
  return { ok: false, exact: false, dist, presque }
}

// ── Config modes ───────────────────────────────────────────
const MODES = [
  { id: 'duo',   label: 'Duo',   pts: 1, desc: '2 choix',     dots: 1, color: '#0C447C', border: '#85B7EB', bg: '#E6F1FB', dotFull: '#185FA5', dotEmpty: '#B5D4F4' },
  { id: 'carre', label: 'Carré', pts: 3, desc: '4 choix',     dots: 2, color: '#26215C', border: '#AFA9EC', bg: '#EEEDFE', dotFull: '#534AB7', dotEmpty: '#CECBF6' },
  { id: 'cash',  label: 'Cash',  pts: 5, desc: 'texte libre', dots: 3, color: '#412402', border: '#FAC775', bg: '#FAEEDA', dotFull: '#854F0B', dotEmpty: '#FAC775' },
]

const THEME_COLORS = {
  geographie:   { bg: '#E6F1FB', border: '#B5D4F4', text: '#185FA5' },
  histoire:     { bg: '#FAECE7', border: '#F5C4B3', text: '#712B13' },
  sciences:     { bg: '#E1F5EE', border: '#9FE1CB', text: '#085041' },
  sciences_nat: { bg: '#EAF3DE', border: '#C0DD97', text: '#27500A' },
  culture:      { bg: '#FBEAF0', border: '#F4C0D1', text: '#72243E' },
  langues:      { bg: '#EEEDFE', border: '#CECBF6', text: '#3C3489' },
  math:         { bg: '#FAEEDA', border: '#FAC775', text: '#633806' },
  autre:        { bg: '#F1EFE8', border: '#D3D1C7', text: '#444441' },
}

export default function QuizScreen({
  currentQuestion, idx, total, score,
  onAnswer, onNext, onQuit, dark,
}) {
  const [phase, setPhase]           = useState('pick')
  const [mode, setMode]             = useState(null)
  const [chosen, setChosen]         = useState(null)
  const [cashInput, setCashInput]   = useState('')
  const [cashResult, setCashResult] = useState(null)
  const [visible, setVisible]       = useState(true)
  const [stableOptions, setStableOptions] = useState({ duo: [], carre: [] })
  const inputRef = useRef()

  useEffect(() => {
    setVisible(false)
    const t = setTimeout(() => {
      setPhase('pick')
      setMode(null)
      setChosen(null)
      setCashInput('')
      setCashResult(null)
      setVisible(true)
    }, 120)
    return () => clearTimeout(t)
  }, [idx])

  useEffect(() => {
    if (!currentQuestion) return
    const { options, answer } = currentQuestion
    const wrong = options.filter(o => o !== answer)
    setStableOptions({
      duo:   [answer, wrong[0]].sort(() => Math.random() - 0.5),
      carre: options,
    })
  }, [idx])

  useEffect(() => {
    if (phase === 'answer' && mode?.id === 'cash') {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [phase, mode])

  if (!currentQuestion) return null

  const { question, questionValue, options, answer, imageUrl, hint, themeName, theme, optionsAreImages } = currentQuestion
  const themeStyle = THEME_COLORS[theme] || THEME_COLORS.autre
  const modeObj    = MODES.find(m => m.id === mode?.id)
  const pts        = modeObj?.pts || 0
  const duoOptions   = stableOptions.duo.length   ? stableOptions.duo   : [answer, options.find(o => o !== answer)]
  const carreOptions = stableOptions.carre.length ? stableOptions.carre : options

  const selectMode = (m) => { setMode(m); setPhase('answer') }

  const handleChooseOption = (opt) => {
    if (phase !== 'answer') return
    setChosen(opt)
    setPhase('result')
    onAnswer(opt, pts, opt === answer)
  }

  const handleSubmitCash = () => {
    if (!cashInput.trim()) return
    const result = checkCash(cashInput, answer)
    setCashResult(result)
    setPhase('result')
    onAnswer(cashInput, pts, result.ok)
  }

  const handleNext = () => {
    setVisible(false)
    setTimeout(() => onNext(), 120)
  }

  // Couleurs dark
  const { bg, card, border, textPri, textSec } = useThemeColors(dark)
  const optBg   = dark ? '#2d1f5e' : '#f9fafb'
  const optBorder = dark ? '#4338ca' : '#f3f4f6'

  const optStyle = (opt) => {
    if (phase !== 'result') return { background: optBg, borderColor: optBorder, color: textPri }
    if (opt === answer) return { background: '#EAF3DE', borderColor: '#97C459', color: '#27500A' }
    if (opt === chosen) return { background: '#FCEBEB', borderColor: '#F09595', color: '#791F1F' }
    return { background: optBg, borderColor: optBorder, color: textSec }
  }

  return (
    <div className="flex flex-col h-full"
      style={{ background: bg, opacity: visible ? 1 : 0, transition: 'opacity 0.12s' }}>

      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-3 flex-shrink-0"
        style={{ background: card, borderBottom: `1px solid ${border}` }}>
        <button onClick={onQuit} style={{ color: textSec }}><ArrowLeft size={20} /></button>
        <div className="flex-1">
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: dark ? '#2d1f5e' : '#f3f4f6' }}>
            <div className="h-full rounded-full transition-all duration-400"
              style={{ width: `${(idx / total) * 100}%`, background: themeStyle.text }} />
          </div>
        </div>
        <span className="text-xs font-medium" style={{ color: textSec }}>{idx + 1}/{total}</span>
      </div>

      {/* Score */}
      <div className="flex justify-center gap-3 px-4 pt-3 flex-shrink-0">
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
          style={{ background: dark ? '#14291a' : '#EAF3DE', color: dark ? '#86efac' : '#27500A' }}>✓ {score.points} pts</span>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
          style={{ background: dark ? '#2d1a1a' : '#FCEBEB', color: dark ? '#fca5a5' : '#791F1F' }}>✗ {score.wrong}</span>
      </div>

      {/* Contenu */}
      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-2">

        {/* Bannière thème */}
        {themeName && (
          <div className="rounded-2xl px-4 py-2.5 mb-3 flex items-center gap-2"
            style={{
              background: dark ? 'rgba(255,255,255,0.06)' : themeStyle.bg,
              border: `1px solid ${dark ? 'rgba(255,255,255,0.1)' : themeStyle.border}`
            }}>
            <span className="text-sm font-semibold" style={{ color: dark ? '#e9d5ff' : themeStyle.text }}>{themeName}</span>
          </div>
        )}

        {/* Image */}
        {imageUrl && (
          <div className="flex justify-center mb-3">
            <img src={imageUrl} alt=""
              className="rounded-2xl object-contain"
              style={{ maxHeight: 140, maxWidth: '100%', background: card, border: `1px solid ${border}` }} />
          </div>
        )}

        {/* Carte question */}
        <div className="rounded-2xl px-5 py-4 mb-4 text-center shadow-sm"
          style={{ background: card, border: `1px solid ${border}` }}>
          <p className="text-xs font-medium uppercase tracking-wide mb-1"
            style={{ color: dark ? textSec : themeStyle.text }}>{question}</p>
          {questionValue && (
            <p className="text-xl font-bold" style={{ color: dark ? '#e9d5ff' : (themeStyle.color || '#26215C') }}>{questionValue}</p>
          )}
        </div>

        {/* ── PHASE PICK ── */}
        {phase === 'pick' && (
          <>
            <p className="text-xs text-center mb-3" style={{ color: textSec }}>Choisis ton mode</p>
            <div className="grid grid-cols-3 gap-2.5">
              {MODES.map(m => (
                <button key={m.id} onClick={() => selectMode(m)}
                  className="rounded-2xl text-center active:scale-95 transition-transform py-3 px-2"
                  style={{
                    background: dark ? 'rgba(255,255,255,0.06)' : m.bg,
                    border: `1.5px solid ${dark ? 'rgba(255,255,255,0.1)' : m.border}`
                  }}>
                  <p className="text-sm font-bold mb-1" style={{ color: dark ? '#e9d5ff' : m.color }}>{m.label}</p>
                  <p className="text-2xl font-bold leading-none mb-2" style={{ color: dark ? '#e9d5ff' : m.color }}>{m.pts}</p>
                  <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginBottom: 4 }}>
                    {[1, 2, 3].map(i => (
                      <div key={i} style={{
                        width: 7, height: 7, borderRadius: '50%',
                        background: dark
                          ? (i <= m.dots ? '#a78bfa' : 'rgba(255,255,255,0.15)')
                          : (i <= m.dots ? m.dotFull : m.dotEmpty),
                      }} />
                    ))}
                  </div>
                  <p className="text-xs" style={{ color: dark ? 'rgba(255,255,255,0.4)' : m.color + 'aa' }}>{m.desc}</p>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── PHASE ANSWER — QCM ── */}
        {phase === 'answer' && mode?.id !== 'cash' && (
          <>
            <div className="flex justify-center mb-3">
              <span className="text-xs font-semibold px-3 py-1 rounded-full"
                style={{ background: modeObj.bg, color: modeObj.color, border: `1px solid ${modeObj.border}` }}>
                {modeObj.label} · {modeObj.pts} pt{modeObj.pts > 1 ? 's' : ''}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {(mode.id === 'duo' ? duoOptions : carreOptions).map((opt, i) => (
                <button key={i} onClick={() => handleChooseOption(opt)}
                  className="rounded-2xl border overflow-hidden active:scale-95 transition-all flex items-center justify-center"
                  style={{
                    background: optBg,
                    borderColor: optBorder,
                    minHeight: optionsAreImages ? 80 : 'auto',
                    padding: optionsAreImages ? 4 : '14px 12px',
                  }}>
                  {optionsAreImages
                    ? <img src={opt} alt="" className="w-full object-contain" style={{ maxHeight: 72 }} />
                    : <span className="text-sm font-semibold" style={{ color: textPri }}>{opt}</span>
                  }
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── PHASE ANSWER — Cash ── */}
        {phase === 'answer' && mode?.id === 'cash' && (
          <>
            <div className="flex justify-center mb-3">
              <span className="text-xs font-semibold px-3 py-1 rounded-full"
                style={{ background: '#FAEEDA', color: '#633806', border: '1px solid #FAC775' }}>
                Cash · 5 pts
              </span>
            </div>
            <input ref={inputRef} value={cashInput}
              onChange={e => setCashInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && cashInput.trim() && handleSubmitCash()}
              placeholder="Ta réponse…"
              className="w-full px-4 py-3.5 rounded-2xl border text-base font-semibold text-center mb-1 focus:outline-none"
              style={{
                background: dark ? '#0f0a1e' : '#ffffff',
                borderColor: '#FAC775',
                color: textPri,
              }}
            />
            <p className="text-xs text-center mb-3" style={{ color: textSec }}>Accents et casse ignorés · petites fautes tolérées</p>
            <button onClick={handleSubmitCash} disabled={!cashInput.trim()}
              className="w-full py-4 rounded-2xl text-sm font-semibold text-white disabled:opacity-30 active:scale-95 transition-transform"
              style={{ background: '#854F0B' }}>
              Valider
            </button>
          </>
        )}

        {/* ── PHASE RESULT — QCM ── */}
        {phase === 'result' && mode?.id !== 'cash' && (
          <>
            <div className="grid grid-cols-2 gap-2.5 mb-3">
              {(mode.id === 'duo' ? duoOptions : carreOptions).map((opt, i) => (
                <div key={i}
                  className="rounded-2xl border overflow-hidden flex items-center justify-center"
                  style={{ ...optStyle(opt), minHeight: optionsAreImages ? 80 : 'auto', padding: optionsAreImages ? 4 : '14px 12px' }}>
                  {optionsAreImages
                    ? <img src={opt} alt="" className="w-full object-contain"
                        style={{ maxHeight: 72, opacity: opt !== answer && opt !== chosen ? 0.35 : 1 }} />
                    : <span className="text-sm font-semibold">{opt}</span>
                  }
                </div>
              ))}
            </div>
            <div className="rounded-xl px-4 py-3 text-sm font-medium text-center mb-3"
              style={chosen === answer
                ? { background: dark ? '#14291a' : '#EAF3DE', color: '#27500A' }
                : { background: dark ? '#2d1a1a' : '#FCEBEB', color: '#791F1F' }}>
              {chosen === answer
                ? `✓ Bonne réponse ! +${pts} pt${pts > 1 ? 's' : ''}`
                : `✗ La réponse était : ${answer}`}
            </div>
          </>
        )}

        {/* ── PHASE RESULT — Cash ── */}
        {phase === 'result' && mode?.id === 'cash' && cashResult && (
          <>
            <div className="mb-3 px-4 py-3 rounded-2xl border text-base font-semibold text-center"
              style={{ background: optBg, borderColor: optBorder, color: textPri }}>
              "{cashInput}"
            </div>
            {cashResult.exact ? (
              <div className="rounded-xl px-4 py-3 text-sm font-medium text-center mb-3"
                style={{ background: dark ? '#14291a' : '#EAF3DE', color: '#27500A' }}>
                ✓ Parfait ! +5 pts
              </div>
            ) : cashResult.ok ? (
              <div className="rounded-xl px-4 py-3 mb-3" style={{ background: dark ? '#2d2a1e' : '#FAEEDA' }}>
                <p className="text-sm font-medium text-center" style={{ color: '#633806' }}>
                  {cashResult.partial ? '✓ Réponse partielle acceptée · +5 pts' : `✓ Accepté (${cashResult.dist} erreur${cashResult.dist > 1 ? 's' : ''}) · +5 pts`}
                </p>
                <p className="text-base font-bold text-center mt-1" style={{ color: dark ? '#fde68a' : '#412402' }}>
                  Réponse complète : {answer}
                </p>
              </div>
            ) : cashResult.presque ? (
              <div className="rounded-xl px-4 py-3 mb-3" style={{ background: dark ? '#1e1b4b' : '#EEEDFE' }}>
                <p className="text-sm font-medium text-center" style={{ color: '#534AB7' }}>⚡ Presque ! Mais pas de points</p>
                <p className="text-base font-bold text-center mt-1" style={{ color: dark ? '#c4b5fd' : '#26215C' }}>La réponse était : {answer}</p>
              </div>
            ) : (
              <div className="rounded-xl px-4 py-3 mb-3" style={{ background: dark ? '#2d1a1a' : '#FCEBEB' }}>
                <p className="text-sm font-medium text-center" style={{ color: '#791F1F' }}>✗ Pas tout à fait…</p>
                <p className="text-base font-bold text-center mt-1" style={{ color: dark ? '#fca5a5' : '#501313' }}>La réponse était : {answer}</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Bouton suivant */}
      <div className="px-4 pb-6 flex-shrink-0">
        {phase === 'result' ? (
          <button onClick={handleNext}
            className="w-full py-4 text-white rounded-2xl text-sm font-semibold active:scale-95 transition-transform"
            style={{ background: themeStyle.text }}>
            Question suivante →
          </button>
        ) : (
          <div style={{ height: 52 }} />
        )}
      </div>
    </div>
  )
}