// Palette dark/light partagée par toutes les apps
// Usage : const { bg, card, border, border2, textPri, textSec, textMed } = useThemeColors(dark)

const COLORS = {
  dark: {
    bg:      '#0f0a1e',
    card:    '#1a1035',
    border:  '#2d1f5e',
    border2: '#2d1f5e',
    textPri: '#e9d5ff',
    textSec: '#a78bfa',
    textMed: '#c4b5fd',
  },
  light: {
    bg:      '#f9fafb',
    card:    '#ffffff',
    border:  '#f3f4f6',
    border2: '#e5e7eb',
    textPri: '#111827',
    textSec: '#9ca3af',
    textMed: '#4b5563',
  },
}

export function useThemeColors(dark) {
  return dark ? COLORS.dark : COLORS.light
}
