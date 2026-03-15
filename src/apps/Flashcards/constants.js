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

export const TC = Object.fromEntries(THEMES.map(t => [t.id, t.color]))

export const shuffle = arr => [...arr].sort(() => Math.random() - 0.5)

export function nextReview(level, rating) {
  const newLevel = rating === 'easy' ? level + 2 : rating === 'medium' ? level + 1 : Math.max(0, level - 1)
  const days = rating === 'easy' ? Math.pow(2, newLevel) : rating === 'medium' ? newLevel + 1 : 0.25
  const next = new Date()
  next.setTime(next.getTime() + days * 24 * 60 * 60 * 1000)
  return { newLevel, next }
}

export async function compressImage(file, maxPx = 800, quality = 0.7) {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height))
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w; canvas.height = h
      canvas.getContext('2d').drawImage(img, 0, 0, w, h)
      canvas.toBlob(blob => { URL.revokeObjectURL(url); resolve(blob) }, 'image/jpeg', quality)
    }
    img.src = url
  })
}
