import { useThemeColors } from '../../../../hooks/useThemeColors'

export default function CriterionForm({ form, onChange, onSave, onCancel, isNew, allCriteria = [], dark }) {
  const { border, textPri, textSec } = useThemeColors(dark)
  const inputBg = dark ? '#0f0a1e' : '#ffffff'
  const otherCriteria = allCriteria.filter(c => c.name !== form.name)

  return (
    <div className="px-3 pb-3 pt-2 space-y-2" style={{ borderTop: `1px solid ${border}` }}>
      <div className="flex gap-2">
        <input
          value={form.name}
          onChange={e => onChange(p => ({ ...p, name: e.target.value }))}
          placeholder="Nom du critère (ex: drapeau)"
          className="flex-1 text-sm px-3 py-2 rounded-xl focus:outline-none"
          style={{ background: inputBg, border: `1px solid ${border}`, color: textPri }}
        />
        <select
          value={form.type}
          onChange={e => onChange(p => ({ ...p, type: e.target.value }))}
          className="text-sm px-2 py-2 rounded-xl focus:outline-none"
          style={{ background: inputBg, border: `1px solid ${border}`, color: textPri }}>
          <option value="text">📝 texte</option>
          <option value="image">🖼️ image</option>
        </select>
      </div>
      <input
        value={form.question_title}
        onChange={e => onChange(p => ({ ...p, question_title: e.target.value }))}
        placeholder="Question posée (ex: Quel est ce pays ?)"
        className="w-full text-sm px-3 py-2 rounded-xl focus:outline-none"
        style={{ background: inputBg, border: `1px solid ${border}`, color: textPri }}
      />
      {form.interrogeable && otherCriteria.length > 0 && (
        <div>
          <label className="text-xs block mb-1" style={{ color: textSec }}>Réponse attendue en Quiz</label>
          <select
            value={form.quiz_answer_criterion_id || ''}
            onChange={e => onChange(p => ({ ...p, quiz_answer_criterion_id: e.target.value || null }))}
            className="w-full text-sm px-3 py-2 rounded-xl focus:outline-none"
            style={{ background: inputBg, border: `1px solid ${border}`, color: textPri }}>
            <option value="">— Non configuré —</option>
            {otherCriteria.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      )}
      <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: textPri }}>
        <input
          type="checkbox"
          checked={form.interrogeable}
          onChange={e => onChange(p => ({ ...p, interrogeable: e.target.checked }))}
          className="accent-indigo-500"
        />
        Utilisé comme question (interrogeable)
      </label>
      <div className="flex gap-2 pt-1">
        <button onClick={onSave} disabled={!form.name.trim()}
          className="flex-1 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-30"
          style={{ background: dark ? '#7c3aed' : '#111827' }}>
          {isNew ? 'Ajouter' : 'Sauvegarder'}
        </button>
        <button onClick={onCancel}
          className="px-4 py-2 rounded-xl text-sm"
          style={{ background: dark ? '#2d1f5e' : '#f3f4f6', color: textPri }}>
          Annuler
        </button>
      </div>
    </div>
  )
}
