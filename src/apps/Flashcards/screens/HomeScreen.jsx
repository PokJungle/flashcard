import { ChevronRight, BookOpen, Upload } from 'lucide-react'
import { THEMES, TC } from '../constants'
import UploadModal from '../components/UploadModal'

export default function HomeScreen({
  decks,
  startCuriosities,
  startDeck,
  openManage,
  showUpload, setShowUpload,
  uploadStatus,
  handleUploadJSON,
}) {
  const themesPresents = THEMES.filter(t => decks.some(d => d.theme === t.id))

  return (
    <div className="h-full bg-gray-50 pb-24 overflow-y-auto">
      <div className="px-5 py-5 max-w-lg mx-auto">

        {/* Curiosités */}
        <button
          onClick={startCuriosities}
          className="w-full mb-6 rounded-2xl p-5 text-left text-white active:scale-95 transition-transform shadow-lg"
          style={{ background: 'linear-gradient(135deg, #f093fb, #f5576c)' }}
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl">✨</span>
            <div>
              <p className="font-bold text-base">Curiosités du jour</p>
              <p className="text-white/75 text-xs mt-0.5">10 cartes · mix perso + thèmes</p>
            </div>
            <ChevronRight size={20} className="ml-auto text-white/75" />
          </div>
        </button>

        {/* Decks par thème */}
        {decks.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">🎴</div>
            <p className="text-gray-500 font-medium mb-1">Aucun jeu disponible</p>
            <p className="text-gray-400 text-sm">Clique sur + pour importer un fichier JSON</p>
          </div>
        ) : (
          themesPresents.map(t => (
            <div key={t.id} className="mb-6">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                {t.emoji} {t.label}
              </h2>
              <div className="space-y-2">
                {decks.filter(d => d.theme === t.id).map(deck => (
                  <div key={deck.id} className="w-full bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => startDeck(deck)}
                        className="flex items-center gap-3 flex-1 min-w-0 text-left active:scale-95 transition-transform"
                      >
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                          style={{ background: (TC[deck.theme] || '#7A7A8A') + '18' }}
                        >
                          {t.emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm truncate">{deck.name}</p>
                          {deck.description && (
                            <p className="text-xs text-gray-400 truncate mt-0.5">{deck.description}</p>
                          )}
                        </div>
                      </button>
                      <button
                        onClick={() => openManage(deck)}
                        className="p-2 text-gray-400 hover:text-gray-700 transition-colors flex-shrink-0"
                      >
                        ⚙️
                      </button>
                      <BookOpen size={15} style={{ color: TC[deck.theme] || '#7A7A8A' }} className="flex-shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* FAB Upload */}
      <button
        onClick={() => setShowUpload(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gray-900 text-white rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform z-40"
      >
        <Upload size={20} />
      </button>

      {showUpload && (
        <UploadModal
          uploadStatus={uploadStatus}
          onUpload={handleUploadJSON}
          onClose={() => setShowUpload(false)}
        />
      )}
    </div>
  )
}
