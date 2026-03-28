// Spinner de chargement réutilisable
// Usage :
//   <Spinner />                          // spinner orange par défaut
//   <Spinner color="#a78bfa" />          // couleur custom
//   <Spinner size={32} />                // taille custom (défaut 32px)
//   <Spinner fullPage dark={dark} />     // centré plein écran avec fond

import { useThemeColors } from '../hooks/useThemeColors'

export default function Spinner({ color, size = 32, fullPage = false, dark = false }) {
  const { bg } = useThemeColors(dark)
  const spinnerColor = color || '#f97316'

  const spinner = (
    <div
      className="rounded-full animate-spin"
      style={{
        width: size,
        height: size,
        border: `3px solid ${spinnerColor}33`,
        borderTopColor: spinnerColor,
      }}
    />
  )

  if (fullPage) {
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        style={{ background: bg }}
      >
        {spinner}
      </div>
    )
  }

  return spinner
}
