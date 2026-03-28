import { useState } from 'react'
import { X } from 'lucide-react'
import { THEMES } from '../../constants'
import { useThemeColors } from '../../../../hooks/useThemeColors'
import BottomModal from '../../../../components/BottomModal'

export default function NewDeckModal({ onClose, onCreate, dark }) {
  const [name, setName]               = useState('')
  const [theme, setTheme]             = useState('autre')
  const [description, setDescription] = useState('')
  const [saving, setSaving]           = useState(false)

  const handleCreate = async () => {
    if (!name.trim()) return
    setSaving(true)
    await onCreate({ name, theme, description })
    setSaving(false)
  }

  const { card: cardBg, border, textPri, textSec } = useThemeColors(dark)
  const inputBg = dark ? '#0f0a1e' : '#ffffff'

  return (
    <BottomModal open onClose={onClose} dark={dark} cardBg={cardBg}>
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-bold text-lg" style={{ color: textPri }}>Nouveau deck</h2>
        <button onClick={onClose}><X size={20} style={{ color: textSec }} /></button>
      </div>
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Nom du deck *" autoFocus
        className="w-full px-4 py-3 rounded-2xl text-sm font-semibold mb-3 focus:outline-none"
        style={{ background: inputBg, border: `1px solid ${border}`, color: textPri }} />
      <select value={theme} onChange={e => setTheme(e.target.value)}
        className="w-full px-4 py-3 rounded-2xl text-sm mb-3 focus:outline-none"
        style={{ background: inputBg, border: `1px solid ${border}`, color: textPri }}>
        {THEMES.map(t => <option key={t.id} value={t.id}>{t.emoji} {t.label}</option>)}
      </select>
      <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (optionnelle)"
        className="w-full px-4 py-3 rounded-2xl text-sm mb-5 focus:outline-none"
        style={{ background: inputBg, border: `1px solid ${border}`, color: textPri }} />
      <button onClick={handleCreate} disabled={!name.trim() || saving}
        className="w-full py-4 rounded-2xl text-sm font-semibold text-white disabled:opacity-30 active:scale-95 transition-transform"
        style={{ background: dark ? '#7c3aed' : '#111827' }}>
        {saving ? 'Création…' : 'Créer le deck'}
      </button>
      <p className="text-center text-xs mt-3" style={{ color: textSec }}>
        Tu pourras ajouter les critères et cartes ensuite
      </p>
    </BottomModal>
  )
}
