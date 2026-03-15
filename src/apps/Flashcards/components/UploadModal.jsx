import { Upload, Check } from 'lucide-react'

export default function UploadModal({ uploadStatus, onUpload, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={onClose}>
      <div className="bg-white w-full rounded-t-3xl p-6" onClick={e => e.stopPropagation()}>
        <h2 className="font-bold text-lg text-gray-900 mb-2">Importer un jeu</h2>
        <p className="text-gray-400 text-sm mb-5">Sélectionne un fichier JSON</p>

        {uploadStatus === 'success' ? (
          <div className="flex items-center gap-2 text-green-600 font-semibold justify-center py-4">
            <Check size={20} /> Jeu importé !
          </div>
        ) : uploadStatus === 'error' ? (
          <p className="text-red-500 text-center py-4">Erreur — vérifie le format</p>
        ) : (
          <label className="block w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-center text-gray-500 cursor-pointer hover:border-gray-400 transition-colors">
            <Upload size={24} className="mx-auto mb-2 text-gray-400" />
            {uploadStatus === 'loading' ? 'Import en cours…' : 'Touche pour choisir un fichier'}
            <input type="file" accept=".json" className="hidden" onChange={onUpload} />
          </label>
        )}
      </div>
    </div>
  )
}
