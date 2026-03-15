import { Camera } from 'lucide-react'

export default function ImageModal({ card, imgUrlInput, setImgUrlInput, onSaveUrl, onUpload, onClose }) {
  if (!card) return null
  return (
    <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={onClose}>
      <div className="bg-white w-full rounded-t-3xl p-6" onClick={e => e.stopPropagation()}>
        <h2 className="font-bold text-lg text-gray-900 mb-1">Ajouter une image</h2>
        <p className="text-gray-400 text-sm mb-5">{card.front}</p>

        <label className="flex items-center gap-3 w-full py-3.5 px-4 bg-gray-900 text-white rounded-2xl mb-3 cursor-pointer active:scale-95 transition-transform">
          <Camera size={18} />
          <span className="font-semibold text-sm">Uploader une photo</span>
          <input
            type="file" accept="image/*" capture="environment" className="hidden"
            onChange={onUpload}
          />
        </label>

        <div className="mb-3">
          <input
            value={imgUrlInput}
            onChange={e => setImgUrlInput(e.target.value)}
            placeholder="Coller une URL d'image…"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-gray-400 text-sm mb-2"
          />
          <button
            onClick={onSaveUrl}
            disabled={!imgUrlInput.trim()}
            className="w-full py-3 bg-gray-100 text-gray-900 rounded-xl font-semibold text-sm disabled:opacity-30 active:scale-95 transition-transform"
          >
            Enregistrer l'URL
          </button>
        </div>

        <a
          href={`https://fr.wikipedia.org/wiki/${encodeURIComponent(card.front)}`}
          target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 text-blue-500 text-sm font-medium"
        >
          🔍 Chercher "{card.front}" sur Wikipedia
        </a>
      </div>
    </div>
  )
}
