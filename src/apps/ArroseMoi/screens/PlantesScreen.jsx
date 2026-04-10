export default function PlantesScreen({
  plantes,
  onEdit,
  onAdd,
  textPri,
  textSec,
  card,
  border,
}) {
  if (plantes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <div className="text-6xl mb-4">🪴</div>
        <p className="font-semibold text-base mb-2" style={{ color: textPri }}>Aucune plante</p>
        <p className="text-sm mb-6" style={{ color: textSec }}>Ajoute ta première plante pour démarrer.</p>
        <button
          onClick={onAdd}
          className="px-6 py-3 rounded-full text-white font-semibold active:scale-95 transition-transform"
          style={{ background: '#22c55e' }}>
          + Ajouter ma première plante
        </button>
      </div>
    )
  }

  return (
    <div className="px-4 py-4 max-w-lg mx-auto">
      <div className="space-y-2">
        {plantes.map(plante => (
          <button
            key={plante.id}
            onClick={() => onEdit(plante)}
            className="w-full rounded-2xl p-4 flex items-center gap-3 text-left active:scale-95 transition-transform"
            style={{ background: card, border: `0.5px solid ${border}` }}>
            <span className="text-3xl flex-shrink-0">{plante.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm" style={{ color: textPri }}>{plante.nom}</p>
              <p className="text-xs mt-0.5" style={{ color: textSec }}>
                {plante.piece} · tous les {plante.frequence_j === 1 ? 'jour' : `${plante.frequence_j} jours`}
              </p>
              {plante.note && (
                <p className="text-xs mt-0.5 truncate" style={{ color: textSec }}>{plante.note}</p>
              )}
            </div>
            <span className="text-xs flex-shrink-0" style={{ color: textSec }}>›</span>
          </button>
        ))}
      </div>

      {/* Bouton flottant + */}
      <button
        onClick={onAdd}
        className="fixed bottom-20 right-4 w-14 h-14 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform z-10 text-white text-2xl font-bold"
        style={{ background: '#22c55e' }}>
        +
      </button>
    </div>
  )
}
