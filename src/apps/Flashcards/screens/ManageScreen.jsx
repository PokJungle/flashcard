import { ArrowLeft, Camera, X } from 'lucide-react'

export default function ManageScreen({
  manageDeck,
  manageDeckCards,
  cardImages,
  editingCard, setEditingCard,
  editCardFront, setEditCardFront,
  editCardBack, setEditCardBack,
  manageImgCard, setManageImgCard,
  manageCardImages,
  imgUrlInput, setImgUrlInput,
  uploadingCard, setUploadingCard,
  setScreen,
  deleteCard,
  saveEditCard,
  deleteDeck,
  openManageImages,
  deleteCardImage,
  handleImageUpload,
  setCardImages,
  supabase,
}) {
  return (
    <>
      <div className="h-full bg-gray-50 overflow-y-auto">

        {/* Header */}
        <div className="bg-white border-b border-gray-100 px-5 py-4 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => setScreen('home')} className="text-gray-400 hover:text-gray-700">
              <ArrowLeft size={20} />
            </button>
            <div className="flex-1">
              <p className="font-bold text-gray-900">{manageDeck.name}</p>
              <p className="text-xs text-gray-400">{manageDeckCards.length} cartes</p>
            </div>
            <button
              onClick={() => { setEditingCard({ id: null }); setEditCardFront(''); setEditCardBack('') }}
              className="px-3 py-1.5 bg-gray-900 text-white rounded-full text-xs font-semibold active:scale-95 transition-transform"
            >
              + Carte
            </button>
            <button
              onClick={() => deleteDeck(manageDeck)}
              className="px-3 py-1.5 bg-red-50 text-red-500 rounded-full text-xs font-semibold active:scale-95 transition-transform"
            >
              🗑️ Supprimer
            </button>
          </div>
        </div>

        {/* Liste des cartes */}
        <div className="px-5 py-4 max-w-lg mx-auto space-y-3">
          {manageDeckCards.map(card => {
            const imgs = cardImages[card.id] || []
            return (
              <div key={card.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 p-4">
                  {imgs[0] ? (
                    <img src={imgs[0]} alt={card.front} className="w-14 h-14 object-cover rounded-xl flex-shrink-0" />
                  ) : (
                    <div className="w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">🃏</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{card.front}</p>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{card.back}</p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => { setEditingCard(card); setEditCardFront(card.front); setEditCardBack(card.back) }}
                      className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center text-sm"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => openManageImages(card)}
                      className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center text-sm relative"
                    >
                      📷
                      {imgs.length > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 text-white rounded-full text-xs flex items-center justify-center">
                          {imgs.length}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => deleteCard(card.id)}
                      className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center"
                    >
                      <X size={14} className="text-red-400" />
                    </button>
                  </div>
                </div>

                {/* Édition inline */}
                {editingCard?.id === card.id && (
                  <div className="px-4 pb-4 border-t border-gray-50 pt-3 space-y-2">
                    <input
                      value={editCardFront} onChange={e => setEditCardFront(e.target.value)}
                      placeholder="Question / recto"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-gray-400 text-sm"
                    />
                    <textarea
                      value={editCardBack} onChange={e => setEditCardBack(e.target.value)}
                      placeholder="Réponse / verso" rows={2}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-gray-400 text-sm resize-none"
                    />
                    <div className="flex gap-2">
                      <button onClick={saveEditCard} className="flex-1 py-2 bg-gray-900 text-white rounded-xl text-sm font-semibold">
                        Sauvegarder
                      </button>
                      <button onClick={() => setEditingCard(null)} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm">
                        Annuler
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Modal gestion images */}
        {manageImgCard && (
          <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={() => setManageImgCard(null)}>
            <div className="bg-white w-full rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg">📷 {manageImgCard.front}</h2>
                <button onClick={() => setManageImgCard(null)}><X size={20} className="text-gray-400" /></button>
              </div>

              {manageCardImages.length > 0 ? (
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {manageCardImages.map((img, i) => (
                    <div key={i} className="relative">
                      <img src={img.url} alt="" className="w-full h-24 object-cover rounded-xl" />
                      <button
                        onClick={() => deleteCardImage(img)}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shadow"
                      >
                        <X size={12} className="text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm text-center py-4 mb-4">Aucune photo pour cette carte</p>
              )}

              <label className="flex items-center gap-3 w-full py-3.5 px-4 bg-gray-900 text-white rounded-2xl mb-3 cursor-pointer active:scale-95 transition-transform">
                <Camera size={18} />
                <span className="font-semibold text-sm">Uploader une photo</span>
                <input
                  type="file" accept="image/*" className="hidden"
                  onChange={async (e) => {
                    setUploadingCard(manageImgCard.id)
                    await handleImageUpload(e)
                    const { data } = await supabase.from('card_images').select('*').eq('card_id', manageImgCard.id)
                    // manageCardImages is updated via the hook
                  }}
                />
              </label>

              <div className="flex gap-2">
                <input
                  value={imgUrlInput} onChange={e => setImgUrlInput(e.target.value)}
                  placeholder="Coller une URL d'image…"
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none text-sm"
                />
                <button
                  onClick={async () => {
                    if (!imgUrlInput.trim()) return
                    await supabase.from('card_images').insert({ card_id: manageImgCard.id, url: imgUrlInput.trim() })
                    const { data } = await supabase.from('card_images').select('*').eq('card_id', manageImgCard.id)
                    setCardImages(prev => ({ ...prev, [manageImgCard.id]: data.map(i => i.url) }))
                    setImgUrlInput('')
                  }}
                  disabled={!imgUrlInput.trim()}
                  className="px-4 py-3 bg-gray-100 text-gray-900 rounded-xl text-sm font-semibold disabled:opacity-30"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal nouvelle carte */}
      {editingCard?.id === null && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={() => setEditingCard(null)}>
          <div className="bg-white w-full rounded-t-3xl p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg">✨ Nouvelle carte</h2>
              <button onClick={() => setEditingCard(null)}><X size={20} className="text-gray-400" /></button>
            </div>
            <input
              value={editCardFront} onChange={e => setEditCardFront(e.target.value)}
              placeholder="Question / recto"
              className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-gray-400 text-sm mb-3"
            />
            <textarea
              value={editCardBack} onChange={e => setEditCardBack(e.target.value)}
              placeholder="Réponse / verso" rows={3}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-gray-400 text-sm resize-none mb-4"
            />
            <button
              onClick={saveEditCard} disabled={!editCardFront.trim()}
              className="w-full py-3.5 bg-gray-900 text-white rounded-full font-semibold text-sm disabled:opacity-30"
            >
              Ajouter la carte
            </button>
          </div>
        </div>
      )}
    </>
  )
}
