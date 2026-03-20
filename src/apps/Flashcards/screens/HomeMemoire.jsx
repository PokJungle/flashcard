import { Upload, Settings, BookOpen } from 'lucide-react'
import { THEMES, THEME_COLOR, SCREENS } from '../constants'

export default function HomeMemoire({
  decks, dueMap, totalDue, loading,
  onStartDeck, onManageDeck,
  onShowUpload,
}) {
  const themesPresents = THEMES.filter(t => decks.some(d => d.theme === t.id))

  return (
    <div className="flex-1 overflow-y-auto pb-4">
      <div className="px-4 pt-4 max-w-lg mx-auto">

        {/* Bannière globale */}
        {totalDue > 0 && (
          <div className="mb-4 rounded-2xl px-4 py-3 flex items-center gap-3"
            style={{ background: '#E6F1FB', border: '0.5px solid #B5D4F4' }}>
            <span className="text-xl">🧠</span>
            <div>
              <p className="text-sm font-semibold" style={{ color: '#185FA5' }}>
                {totalDue} critère{totalDue > 1 ? 's' : ''} à réviser
              </p>
              <p className="text-xs" style={{ color: '#378ADD' }}>
                Sur l'ensemble de tes decks
              </p>
            </div>
          </div>
        )}

        {/* État vide */}
        {!loading && decks.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">🎴</div>
            <p className="text-gray-500 font-medium mb-1">Aucun jeu disponible</p>
            <p className="text-gray-400 text-sm">Importe un fichier JSON ou crée un deck</p>
          </div>
        )}

        {/* Decks par thème */}
        {themesPresents.map(t => (
          <div key={t.id} className="mb-6">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
              {t.emoji} {t.label}
            </h2>
            <div className="space-y-2">
              {decks.filter(d => d.theme === t.id).map(deck => {
                const due      = dueMap[deck.id] ?? 0
                const color    = THEME_COLOR[deck.theme] || '#7A7A8A'
                const dueColor = due > 0 ? '#185FA5' : null

                return (
                  <div key={deck.id}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-3 px-4 py-3">

                      {/* Icône thème */}
                      <button
                        onClick={() => onStartDeck(deck)}
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 active:scale-95 transition-transform"
                        style={{ background: color + '18' }}>
                        {t.emoji}
                      </button>

                      {/* Infos */}
                      <button
                        onClick={() => onStartDeck(deck)}
                        className="flex-1 min-w-0 text-left active:scale-95 transition-transform">
                        <p className="font-semibold text-gray-900 text-sm truncate">
                          {deck.name}
                        </p>
                        {deck.description && (
                          <p className="text-xs text-gray-400 truncate mt-0.5">
                            {deck.description}
                          </p>
                        )}
                        {/* Barre de progression */}
                        <DeckProgress deckId={deck.id} color={color} />
                      </button>

                      {/* Badge dues */}
                      {due > 0 ? (
                        <span className="text-xs font-semibold px-2 py-1 rounded-lg flex-shrink-0"
                          style={{ background: '#E6F1FB', color: '#185FA5' }}>
                          {due} {due === 1 ? 'due' : 'dues'}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300 flex-shrink-0">À jour</span>
                      )}

                      {/* Bouton manage */}
                      <button
                        onClick={() => onManageDeck(deck)}
                        className="p-1.5 text-gray-300 hover:text-gray-600 transition-colors flex-shrink-0">
                        <Settings size={15} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* FAB import */}
      <button
        onClick={onShowUpload}
        className="fixed bottom-20 right-5 w-13 h-13 bg-gray-900 text-white rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform z-40"
        style={{ width: 52, height: 52 }}>
        <Upload size={20} />
      </button>
    </div>
  )
}

// Barre de progression : % de critères au niveau ≥ 3 (bien maîtrisés)
// Simplifiée : affichée via props futures — placeholder pour l'instant
function DeckProgress({ color }) {
  // TODO: calculer via les données de progression passées en props
  // Pour l'instant on n'affiche rien si pas de données
  return null
}