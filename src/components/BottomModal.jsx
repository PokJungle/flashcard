// Modal "bottom sheet" réutilisable — glisse depuis le bas de l'écran
// Usage :
//   <BottomModal open={bool} onClose={fn} cardBg={cardBg} maxHeight="85vh">
//     {children}
//   </BottomModal>

export default function BottomModal({ open, onClose, cardBg, maxHeight, children }) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-end z-50"
      onClick={onClose}
    >
      <div
        className="w-full rounded-t-3xl"
        style={{
          background: cardBg,
          maxHeight: maxHeight || '85vh',
          overflowY: 'auto',
        }}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}
