import { Settings, Check, X } from 'lucide-react'
import { useThemeColors } from '../../../../hooks/useThemeColors'

export default function DeckCard({ deck, themeEmoji, due, criteria, color, active, filterMode, dark, onStart, onManage, onToggle }) {
  const hasProgress = active && criteria.some(c => c.total > 0)
  const globalPct   = hasProgress
    ? Math.round(criteria.reduce((s, c) => s + c.pct, 0) / criteria.length)
    : 0

  const { card: cardBg, textPri, textSec } = useThemeColors(dark)
  const cardBorder = dark ? (active ? '#2d1f5e' : '#1e1040') : (active ? '#f3f4f6' : '#e5e7eb')

  return (
    <div className="rounded-2xl border shadow-sm overflow-hidden relative transition-opacity"
      style={{ background: cardBg, borderColor: cardBorder, opacity: active ? 1 : 0.5 }}>

      {globalPct > 0 && (
        <div className="absolute top-0 left-0 bottom-0 rounded-2xl transition-all duration-700 pointer-events-none"
          style={{ width: `${globalPct}%`, background: globalPct >= 80 ? 'rgba(99,153,34,0.12)' : color + '28' }}
        />
      )}

      <div className="relative">
        <div className="flex items-center gap-3 px-4 pt-3 pb-2">

          {filterMode ? (
            <button onClick={onToggle}
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all active:scale-95"
              style={{ background: active ? color + '18' : (dark ? '#2d1f5e' : '#f3f4f6') }}>
              {active
                ? <Check size={16} style={{ color }} />
                : <X size={16} style={{ color: textSec }} />
              }
            </button>
          ) : (
            <button onClick={onStart}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 active:scale-95 transition-transform"
              style={{ background: color + '18' }}>
              {themeEmoji}
            </button>
          )}

          <button onClick={filterMode ? onToggle : onStart}
            className="flex-1 min-w-0 text-left active:scale-95 transition-transform">
            <p className="font-semibold text-sm truncate" style={{ color: active ? textPri : textSec }}>
              {deck.name}
            </p>
            {deck.description && (
              <p className="text-xs truncate mt-0.5" style={{ color: textSec }}>{deck.description}</p>
            )}
          </button>

          {!filterMode && (() => {
            const badge = due?.badge ?? due ?? 0
            return badge > 0 ? (
              <span className="text-xs font-semibold px-2 py-1 rounded-lg flex-shrink-0"
                style={{ background: dark ? '#1a2744' : '#E6F1FB', color: dark ? '#93c5fd' : '#185FA5' }}>
                {badge}
              </span>
            ) : active ? (
              <span className="text-xs flex-shrink-0" style={{ color: dark ? '#4338ca' : '#d1d5db' }}>À jour</span>
            ) : null
          })()}

          {filterMode && (
            <span className="text-xs font-medium px-2 py-1 rounded-lg flex-shrink-0"
              style={{
                background: active ? color + '15' : (dark ? '#2d1f5e' : '#f3f4f6'),
                color: active ? color : textSec,
              }}>
              {active ? 'actif' : 'inactif'}
            </span>
          )}

          {!filterMode && (
            <button onClick={onManage} className="p-1.5 transition-colors flex-shrink-0" style={{ color: textSec }}>
              <Settings size={15} />
            </button>
          )}
        </div>

        {hasProgress && (
          <div className="px-4 pb-3 space-y-1.5">
            {criteria.map(crit => (
              <div key={crit.criterionId} className="flex items-center gap-2">
                <span className="text-xs capitalize flex-shrink-0" style={{ minWidth: 68, color: textSec }}>
                  {crit.type === 'image' ? '🖼️' : '📝'} {crit.name}
                </span>
                <div className="flex-1 h-1.5 rounded-full overflow-hidden"
                  style={{ background: dark ? '#2d1f5e' : '#f3f4f6' }}>
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${crit.pct}%`,
                      background: crit.pct >= 80 ? '#639922' : crit.pct >= 40 ? color : color + '88',
                    }} />
                </div>
                <span className="text-xs tabular-nums flex-shrink-0"
                  style={{
                    minWidth: 28, textAlign: 'right',
                    color: crit.pct >= 80 ? '#639922' : crit.pct >= 40 ? color : (dark ? '#4338ca' : '#d1d5db'),
                  }}>
                  {crit.pct}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
