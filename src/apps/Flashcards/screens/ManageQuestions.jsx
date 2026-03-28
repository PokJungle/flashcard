import { useState, useEffect } from 'react'
import { ArrowLeft, Plus, X } from 'lucide-react'
import { supabase } from '../../../supabase'
import { useThemeColors } from '../../../hooks/useThemeColors'
import BottomModal from '../../../components/BottomModal'

const EMPTY_FORM = { question: '', answer: '', wrong_answers: ['', '', ''] }

export default function ManageQuestions({ profile, onBack, dark }) {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading]     = useState(true)
  const [editing, setEditing]     = useState(null)
  const [form, setForm]           = useState(EMPTY_FORM)
  const [saving, setSaving]       = useState(false)

  useEffect(() => { load() }, [])

  const load = async () => {
    const { data } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('profile_id', profile.id)
      .order('created_at', { ascending: false })
    setQuestions(data || [])
    setLoading(false)
  }

  const openNew  = () => { setEditing({ id: null }); setForm(EMPTY_FORM) }
  const openEdit = (q) => {
    setEditing(q)
    const wa = q.wrong_answers || []
    setForm({ question: q.question, answer: q.answer, wrong_answers: [wa[0] || '', wa[1] || '', wa[2] || ''] })
  }

  const save = async () => {
    if (!form.question.trim() || !form.answer.trim()) return
    setSaving(true)
    const wrongs = form.wrong_answers.map(w => w.trim()).filter(Boolean)
    const payload = { question: form.question.trim(), answer: form.answer.trim(), wrong_answers: wrongs }
    if (editing?.id) {
      await supabase.from('quiz_questions').update(payload).eq('id', editing.id)
    } else {
      await supabase.from('quiz_questions').insert({ profile_id: profile.id, ...payload })
    }
    setEditing(null)
    await load()
    setSaving(false)
  }

  const remove = async (id) => {
    await supabase.from('quiz_questions').delete().eq('id', id)
    setQuestions(prev => prev.filter(q => q.id !== id))
  }

  const hasWrongs = (q) => q.wrong_answers?.filter(Boolean).length >= 2

  const { bg, card, border, textPri, textSec } = useThemeColors(dark)
  const inputBg = dark ? '#0f0a1e' : '#ffffff'
  const inputBorder = dark ? '#2d1f5e' : '#e5e7eb'

  return (
    <div className="flex flex-col h-full" style={{ background: bg }}>

      <div className="px-4 py-3 flex items-center gap-3 flex-shrink-0"
        style={{ background: card, borderBottom: `1px solid ${border}` }}>
        <button onClick={onBack} style={{ color: textSec }}>
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <p className="font-bold text-sm" style={{ color: textPri }}>Questions libres</p>
          <p className="text-xs" style={{ color: textSec }}>{questions.length} question{questions.length > 1 ? 's' : ''}</p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white active:scale-95 transition-transform"
          style={{ background: dark ? '#7c3aed' : '#111827' }}>
          <Plus size={13} /> Ajouter
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {loading ? (
          <div className="text-center py-12 text-sm" style={{ color: textSec }}>Chargement…</div>
        ) : questions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">✨</div>
            <p className="font-medium mb-1" style={{ color: dark ? '#c4b5fd' : '#6b7280' }}>Aucune question encore</p>
            <p className="text-sm mb-4" style={{ color: textSec }}>Ajoute tes propres questions pour le Quiz</p>
            <button onClick={openNew}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: dark ? '#7c3aed' : '#111827' }}>
              + Première question
            </button>
          </div>
        ) : (
          <div className="space-y-2 max-w-lg mx-auto">
            {questions.map(q => (
              <div key={q.id} className="rounded-2xl overflow-hidden"
                style={{ background: card, border: `1px solid ${border}` }}>
                <div className="flex items-start gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold leading-snug" style={{ color: textPri }}>{q.question}</p>
                    <p className="text-xs mt-0.5" style={{ color: dark ? '#86efac' : '#4b7c1e' }}>✓ {q.answer}</p>
                    {hasWrongs(q) ? (
                      <p className="text-xs mt-0.5" style={{ color: textSec }}>
                        ✗ {q.wrong_answers.filter(Boolean).join(' · ')}
                      </p>
                    ) : (
                      <p className="text-xs mt-0.5" style={{ color: '#BA7517' }}>
                        ⚠️ Mauvaises réponses manquantes
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 flex-shrink-0 mt-0.5">
                    <button onClick={() => openEdit(q)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-xs"
                      style={{ background: dark ? '#2d1f5e' : '#f3f4f6' }}>
                      ✏️
                    </button>
                    <button onClick={() => remove(q.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ background: dark ? '#3b1a1a' : '#fff1f1' }}>
                      <X size={13} className="text-red-400" />
                    </button>
                  </div>
                </div>

                {editing?.id === q.id && (
                  <QuestionForm
                    form={form}
                    onChange={setForm}
                    onSave={save}
                    onCancel={() => setEditing(null)}
                    saving={saving}
                    dark={dark}
                    inputBg={inputBg}
                    inputBorder={inputBorder}
                    textPri={textPri}
                    textSec={textSec}
                    border={border}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal nouvelle question */}
      <BottomModal open={editing?.id === null} onClose={() => setEditing(null)} cardBg={card}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg" style={{ color: textPri }}>✨ Nouvelle question</h2>
            <button onClick={() => setEditing(null)}>
              <X size={20} style={{ color: textSec }} />
            </button>
          </div>
          <QuestionForm
            form={form}
            onChange={setForm}
            onSave={save}
            onCancel={() => setEditing(null)}
            saving={saving}
            dark={dark}
            inputBg={inputBg}
            inputBorder={inputBorder}
            textPri={textPri}
            textSec={textSec}
            border={border}
          />
        </div>
      </BottomModal>
    </div>
  )
}

function QuestionForm({ form, onChange, onSave, onCancel, saving, dark, inputBg, inputBorder, textPri, textSec, border }) {
  const setWrong = (i, val) => {
    onChange(p => {
      const wa = [...p.wrong_answers]
      wa[i] = val
      return { ...p, wrong_answers: wa }
    })
  }

  const canSave = form.question.trim() && form.answer.trim() &&
    form.wrong_answers.filter(w => w.trim()).length >= 2

  return (
    <div className="px-4 pb-4 pt-3 space-y-2" style={{ borderTop: `1px solid ${border}` }}>
      <input
        value={form.question}
        onChange={e => onChange(p => ({ ...p, question: e.target.value }))}
        placeholder="La question…"
        className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
        style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: textPri }}
      />

      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold"
          style={{ color: '#27500A' }}>✓</span>
        <input
          value={form.answer}
          onChange={e => onChange(p => ({ ...p, answer: e.target.value }))}
          placeholder="La bonne réponse…"
          className="w-full pl-7 pr-3 py-2.5 rounded-xl text-sm focus:outline-none"
          style={{
            background: inputBg,
            border: `1px solid ${form.answer.trim() ? '#97C459' : inputBorder}`,
            color: textPri,
          }}
        />
      </div>

      <p className="text-xs pt-1" style={{ color: textSec }}>Mauvaises réponses (min. 2 pour le QCM)</p>
      {[0, 1, 2].map(i => (
        <div key={i} className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-red-400">✗</span>
          <input
            value={form.wrong_answers[i]}
            onChange={e => setWrong(i, e.target.value)}
            placeholder={`Mauvaise réponse ${i + 1}${i < 2 ? ' *' : ' (optionnelle)'}`}
            className="w-full pl-7 pr-3 py-2.5 rounded-xl text-sm focus:outline-none"
            style={{
              background: inputBg,
              border: `1px solid ${form.wrong_answers[i].trim() ? '#F09595' : inputBorder}`,
              color: textPri,
            }}
          />
        </div>
      ))}

      <div className="flex gap-2 pt-1">
        <button onClick={onSave} disabled={!canSave || saving}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-30 active:scale-95 transition-transform"
          style={{ background: dark ? '#7c3aed' : '#111827' }}>
          {saving ? 'Sauvegarde…' : 'Sauvegarder'}
        </button>
        <button onClick={onCancel}
          className="px-4 py-2.5 rounded-xl text-sm"
          style={{ background: dark ? '#2d1f5e' : '#f3f4f6', color: textPri }}>
          Annuler
        </button>
      </div>
    </div>
  )
}