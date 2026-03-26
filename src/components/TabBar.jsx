// src/components/TabBar.jsx

export default function TabBar({ tabs, active, onChange, color = '#6366f1' }) {
  return (
    <nav className="flex-shrink-0 bg-white border-t border-gray-100 flex">
      {tabs.map(item => {
        const isActive = active === item.id
        return (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className="flex-1 flex flex-col items-center gap-0.5 py-2.5 relative active:scale-95 transition-transform"
          >
            <span className="text-xl leading-none">{item.emoji}</span>
            <span
              className="text-xs font-medium"
              style={{ color: isActive ? color : '#9ca3af' }}
            >
              {item.label}
            </span>
            {item.badge > 0 && (
              <span className="absolute top-1.5 right-1/2 translate-x-4 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-semibold rounded-full flex items-center justify-center px-1">
                {item.badge > 99 ? '99+' : item.badge}
              </span>
            )}
          </button>
        )
      })}
    </nav>
  )
}
