import { Camera, ExternalLink } from 'lucide-react'
import { useThemeColors } from '../../../../hooks/useThemeColors'

export default function CardForm({ criteria, form, onChange, onSave, onCancel, saving, onImageUpload, uploadingCriterion, dark }) {
  const { border, textPri, textSec } = useThemeColors(dark)
  const inputBg = dark ? '#0f0a1e' : '#ffffff'

  return (
    <div className="px-3 pb-3 pt-1 space-y-2" style={{ borderTop: `1px solid ${border}` }}>
      {criteria.map(c => (
        <div key={c.id}>
          <label className="text-xs mb-1 block capitalize" style={{ color: textSec }}>{c.name}</label>
          {c.type === 'image' ? (
            <div className="space-y-1.5">
              {form[c.id] && (
                <img src={form[c.id]} alt="" className="h-20 object-contain rounded-xl"
                  style={{ border: `1px solid ${border}` }} />
              )}
              <div className="flex gap-2">
                <label className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm cursor-pointer active:scale-95 transition-transform"
                  style={{ background: dark ? '#2d1f5e' : '#f3f4f6', color: textPri }}>
                  <Camera size={14} />
                  {uploadingCriterion === c.id ? 'Upload…' : 'Photo'}
                  <input type="file" accept="image/*" capture="environment" className="hidden"
                    onChange={e => onImageUpload(e, c.id)} />
                </label>
                <input
                  value={form[c.id] || ''}
                  onChange={e => onChange(p => ({ ...p, [c.id]: e.target.value }))}
                  placeholder="ou coller une URL…"
                  className="flex-1 text-xs px-3 py-2 rounded-xl focus:outline-none"
                  style={{ background: inputBg, border: `1px solid ${border}`, color: textPri }}
                />
              </div>
              {form[c.id] && (
                <a href={`https://fr.wikipedia.org/wiki/${encodeURIComponent(form[c.id])}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-blue-400">
                  <ExternalLink size={11} /> Chercher sur Wikipédia
                </a>
              )}
            </div>
          ) : (
            <input
              value={form[c.id] || ''}
              onChange={e => onChange(p => ({ ...p, [c.id]: e.target.value }))}
              placeholder={c.question_title || c.name}
              className="w-full text-sm px-3 py-2 rounded-xl focus:outline-none"
              style={{ background: inputBg, border: `1px solid ${border}`, color: textPri }}
            />
          )}
        </div>
      ))}
      <div className="flex gap-2 pt-1">
        <button onClick={onSave} disabled={saving}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 active:scale-95 transition-transform"
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
