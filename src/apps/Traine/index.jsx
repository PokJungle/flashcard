import { useState, useEffect, useCallback, startTransition } from 'react'
import { supabase } from '../../supabase'
import { useThemeColors } from '../../hooks/useThemeColors'
import BottomModal from '../../components/BottomModal'
import TabBar from '../../components/TabBar'
import Spinner from '../../components/Spinner'
import { Plus, X } from 'lucide-react'

const COLOR = '#10b981'
const TABS = [
  { id: 'todo', emoji: '🐌', label: 'À faire' },
  { id: 'done', emoji: '✅', label: 'Terminées' },
]

const EMOJIS = [
  '🛒','🧹','🔧','💊','📞','✉️','🏠','🚗','💰','📚',
  '🎁','🌱','🍳','👔','💻','🎯','🏋️','🐕','💡','🔑',
  '🧺','🪴','🎨','📦','🧴','🪥','🛁','🌿','🍷','🎵',
]

const EMPTY_FORM = { title: '', note: '', emoji: '' }

export default function Traine({ profile, dark }) {
  const [state, setState] = useState({
    tasks: [],
    allProfiles: [],
    loading: true
  })
  const [tab, setTab] = useState('todo')
  const [modal, setModal] = useState(null) // null | 'add' | task (pour edit)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const { tasks, allProfiles, loading } = state

  const { bg, card, border, border2, textPri, textSec, textMed } = useThemeColors(dark)
  const inputBg = dark ? '#0f0a1e' : '#ffffff'

  const parsePriorityBy = (t) => ({
    ...t,
    priority_by: typeof t.priority_by === 'string' ? JSON.parse(t.priority_by) : (t.priority_by || [])
  })

  const loadAll = useCallback(async () => {
    const [{ data: tasksData }, { data: profilesData }] = await Promise.all([
      supabase.from('traine_tasks').select('*').order('created_at', { ascending: true }),
      supabase.from('profiles').select('*'),
    ])
    
    // Use startTransition to prevent cascading renders warning
    startTransition(() => {
      setState({
        tasks: (tasksData || []).map(parsePriorityBy),
        allProfiles: profilesData || [],
        loading: false
      })
    })
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  const otherProfile    = allProfiles.find(p => p.id !== profile.id)
  const myPriorityCount = tasks.filter(t => !t.done && (t.priority_by || []).includes(profile.id)).length

  const visibleTasks = tasks
    .filter(t => tab === 'todo' ? !t.done : t.done)
    .sort((a, b) => {
      if (tab === 'done') return new Date(b.created_at) - new Date(a.created_at)
      const score = t => (
        ((t.priority_by || []).includes(profile.id) ? 1 : 0) +
        (otherProfile && (t.priority_by || []).includes(otherProfile.id) ? 1 : 0)
      )
      if (score(b) !== score(a)) return score(b) - score(a)
      return new Date(a.created_at) - new Date(b.created_at)
    })

  const openAdd = () => { setForm(EMPTY_FORM); setModal('add') }
  const openEdit = (task) => { setForm({ title: task.title, note: task.note || '', emoji: task.emoji || '' }); setModal(task) }
  const closeModal = () => { setModal(null); setForm(EMPTY_FORM) }

  const saveTask = async () => {
    if (!form.title.trim()) return
    setSaving(true)
    const payload = { title: form.title.trim(), note: form.note.trim() || null, emoji: form.emoji || null }
    if (modal === 'add') {
      const { data } = await supabase.from('traine_tasks').insert({
        ...payload, created_by: profile.id, priority_by: '[]',
      }).select().single()
      if (data) setState(prev => ({ ...prev, tasks: [...prev.tasks, parsePriorityBy(data)] }))
    } else {
      await supabase.from('traine_tasks').update(payload).eq('id', modal.id)
      setState(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === modal.id ? { ...t, ...payload } : t) }))
    }
    setSaving(false)
    closeModal()
  }

  const toggleDone = async (task) => {
    const done = !task.done
    await supabase.from('traine_tasks').update({ done }).eq('id', task.id)
    setState(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === task.id ? { ...t, done } : t) }))
  }

  const togglePriority = async (task) => {
    const has = (task.priority_by || []).includes(profile.id)
    if (!has && myPriorityCount >= 3) return
    const newPriorityBy = has
      ? task.priority_by.filter(id => id !== profile.id)
      : [...(task.priority_by || []), profile.id]
    await supabase.from('traine_tasks').update({ priority_by: JSON.stringify(newPriorityBy) }).eq('id', task.id)
    setState(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === task.id ? { ...t, priority_by: newPriorityBy } : t) }))
  }

  const deleteTask = async (id) => {
    await supabase.from('traine_tasks').delete().eq('id', id)
    setState(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== id) }))
  }

  const getProfile = (id) => allProfiles.find(p => p.id === id)

  const isEditing = modal && modal !== 'add'

  if (loading) return (
    <div className="flex justify-center py-16" style={{ background: bg }}>
      <Spinner color={COLOR} />
    </div>
  )

  return (
    <div className="h-full flex flex-col" style={{ background: bg }}>
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-4 max-w-lg mx-auto">

          {tab === 'todo' && (
            <p className="text-xs mb-4" style={{ color: textSec }}>
              {myPriorityCount}/3 priorités
              {myPriorityCount >= 3 && <span className="text-amber-500"> · max atteint</span>}
            </p>
          )}

          {visibleTasks.length === 0 && (
            <div className="text-center py-16">
              <div className="text-5xl mb-3">{tab === 'todo' ? '🐌' : '✅'}</div>
              <p className="font-medium mb-1" style={{ color: textMed }}>
                {tab === 'todo' ? 'Rien ne traîne !' : 'Aucune tâche terminée'}
              </p>
              <p className="text-sm" style={{ color: textSec }}>
                {tab === 'todo' ? 'Profite, ou ajoute quelque chose 👇' : ''}
              </p>
            </div>
          )}

          <div className="space-y-2">
            {visibleTasks.map(task => {
              const myPrio    = (task.priority_by || []).includes(profile.id)
              const otherPrio = otherProfile && (task.priority_by || []).includes(otherProfile.id)
              const bothPrio  = myPrio && otherPrio
              const creator   = getProfile(task.created_by)

              return (
                <div key={task.id}
                  className="rounded-2xl p-3 flex items-start gap-3 transition-all"
                  style={{
                    background: bothPrio ? (dark ? '#052e16' : '#f0fdf4') : card,
                    border: `0.5px solid ${bothPrio ? '#10b981' : myPrio ? (dark ? '#166534' : '#bbf7d0') : border}`,
                    boxShadow: bothPrio ? '0 0 0 1px #10b98130' : undefined,
                  }}>

                  {/* Priorité */}
                  {!task.done && (
                    <button onClick={() => togglePriority(task)}
                      className="flex-shrink-0 mt-0.5 active:scale-90 transition-transform">
                      <span className="text-lg" style={{ opacity: myPrio ? 1 : 0.2 }}>🔥</span>
                    </button>
                  )}

                  {/* Emoji tâche */}
                  {task.emoji && (
                    <span className="text-xl flex-shrink-0 mt-0.5">{task.emoji}</span>
                  )}

                  {/* Contenu — tap pour éditer */}
                  <button className="flex-1 min-w-0 text-left" onClick={() => !task.done && openEdit(task)}>
                    <p className="text-sm font-medium leading-snug"
                      style={{ color: textPri, textDecoration: task.done ? 'line-through' : 'none', opacity: task.done ? 0.5 : 1 }}>
                      {task.title}
                    </p>
                    {task.note && (
                      <p className="text-xs mt-0.5 leading-snug" style={{ color: textSec }}>{task.note}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      {creator && <span className="text-[10px]" style={{ color: textSec }}>{creator.avatar}</span>}
                      {otherPrio && !task.done && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                          style={{ background: dark ? '#064e3b' : '#d1fae5', color: '#10b981' }}>
                          🔥 {otherProfile.avatar}
                        </span>
                      )}
                    </div>
                  </button>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
                    <button onClick={() => deleteTask(task.id)}
                      className="transition-opacity active:opacity-100 p-0.5"
                      style={{ opacity: 0.2 }}>
                      <X size={14} style={{ color: textSec }} />
                    </button>
                    <button onClick={() => toggleDone(task)}
                      className="w-6 h-6 rounded-full border-2 flex items-center justify-center active:scale-90 transition-all"
                      style={{
                        borderColor: task.done ? COLOR : (dark ? '#374151' : '#d1d5db'),
                        background: task.done ? COLOR : 'transparent',
                      }}>
                      {task.done && <span className="text-white text-[10px] font-bold">✓</span>}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {tab === 'todo' && (
        <button onClick={openAdd}
          className="fixed bottom-20 right-4 w-14 h-14 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform z-10"
          style={{ background: COLOR }}>
          <Plus size={24} color="white" />
        </button>
      )}

      <TabBar tabs={TABS} active={tab} onChange={setTab} color={COLOR} dark={dark} />

      {/* Modal ajout / édition */}
      <BottomModal open={!!modal} onClose={closeModal} dark={dark}>
        <p className="font-bold text-base mb-4" style={{ color: textPri }}>
          {isEditing ? '✏️ Modifier la tâche' : '🐌 Nouvelle tâche'}
        </p>

        {/* Picker emoji */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          <button onClick={() => setForm(f => ({ ...f, emoji: '' }))}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all"
            style={{
              background: !form.emoji ? COLOR : (dark ? '#1f2937' : '#f3f4f6'),
              color: !form.emoji ? '#fff' : textSec,
              border: `1px solid ${!form.emoji ? COLOR : border2}`
            }}>
            ∅
          </button>
          {EMOJIS.map(e => (
            <button key={e} onClick={() => setForm(f => ({ ...f, emoji: e }))}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all active:scale-90"
              style={{
                background: form.emoji === e ? (dark ? '#052e16' : '#d1fae5') : (dark ? '#1f2937' : '#f3f4f6'),
                border: `1px solid ${form.emoji === e ? COLOR : 'transparent'}`
              }}>
              {e}
            </button>
          ))}
        </div>

        <input
          value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          onKeyDown={e => e.key === 'Enter' && saveTask()}
          placeholder="Quoi qui traîne ?"
          autoFocus
          className="w-full px-4 py-3 rounded-xl text-sm mb-3 focus:outline-none"
          style={{ background: inputBg, border: `1px solid ${border2}`, color: textPri }}
        />
        <input
          value={form.note}
          onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
          placeholder="Note (optionnel)"
          className="w-full px-4 py-3 rounded-xl text-sm mb-4 focus:outline-none"
          style={{ background: inputBg, border: `1px solid ${border2}`, color: textPri }}
        />
        <button onClick={saveTask} disabled={!form.title.trim() || saving}
          className="w-full py-3.5 rounded-full text-white font-semibold disabled:opacity-30 active:scale-95 transition-transform"
          style={{ background: COLOR }}>
          {saving ? 'Sauvegarde…' : isEditing ? 'Modifier' : 'Ajouter'}
        </button>
      </BottomModal>
    </div>
  )
}
