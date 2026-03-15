import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Flashcards from './apps/Flashcards/index.jsx'
import Meteo from './apps/Meteo/index.jsx'
import Grimoire from './apps/Grimoire/index.jsx'
import { ArrowLeft } from 'lucide-react'

const APPS = [
  {
    id: 'flashcards',
    name: 'Mémoire de Singe',
    emoji: '🐒',
    description: 'Apprendre par répétition espacée',
    color: '#6A9BCC',
    component: Flashcards,
  },
  {
    id: 'meteo',
    name: 'Parapluie ou Claquettes ?',
    emoji: '🌦️',
    description: 'Météo agrégée multi-modèles',
    color: '#4CAF82',
    component: Meteo,
  },
  {
    id: 'recettes',
    name: 'Le Grimoire Gourmand',
    emoji: '📖',
    description: 'Trouver et sauvegarder des recettes',
    color: '#E67E22',
    component: Grimoire,
  },
]

export default function App() {
  const [activeApp, setActiveApp] = useState(null)
  const [profiles, setProfiles] = useState([])
  const [profile, setProfile] = useState(null)
  const [screen, setScreen] = useState('profiles') // profiles | hub

  useEffect(() => {
    supabase.from('profiles').select('*').then(({ data }) => {
      setProfiles(data || [])
      const saved = localStorage.getItem('flashcard-profile')
      if (saved) {
        const p = (data || []).find(p => p.id === saved)
        if (p) { setProfile(p); setScreen('hub') }
      }
    })
  }, [])

  const selectProfile = (p) => {
    setProfile(p)
    localStorage.setItem('flashcard-profile', p.id)
    setScreen('hub')
  }

  // Si une app est active, on lui passe le contrôle
  if (activeApp) {
    const app = APPS.find(a => a.id === activeApp)
    const Component = app.component
    return (
      <div className="h-screen flex flex-col overflow-hidden">
        <div className="bg-white border-b border-gray-100 px-5 py-3 flex items-center justify-between flex-shrink-0">
          <button
            onClick={() => setActiveApp(null)}
            className="w-9 h-9 flex items-center justify-center bg-gray-100 rounded-xl text-gray-500 hover:text-gray-900 active:scale-95 transition-all"
          >
            🏠
          </button>
          <div className="text-center">
            <p className="text-sm font-bold text-gray-900">{app.emoji} {app.name}</p>
            <p className="text-xs text-gray-400">{profile?.avatar} {profile?.name}</p>
          </div>
          <div className="w-9" />
        </div>
        <div className="flex-1 overflow-y-auto">
          <Component profile={profile} />
        </div>
      </div>
    )
  }

  // ─── PROFILS ──────────────────────────────────────────────────────────────
  if (screen === 'profiles') return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6">
      <div className="text-5xl mb-4">🏠</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Mes Apps</h1>
      <p className="text-gray-400 text-sm mb-10">Qui est-ce ?</p>
      <div className="w-full max-w-xs space-y-3">
        {profiles.map(p => (
          <button key={p.id} onClick={() => selectProfile(p)}
            className="w-full bg-white rounded-2xl p-4 border border-gray-100 flex items-center gap-4 shadow-sm active:scale-95 transition-transform">
            <span className="text-3xl">{p.avatar}</span>
            <span className="font-semibold text-gray-900 text-lg">{p.name}</span>
          </button>
        ))}
      </div>
    </div>
  )

  // ─── HUB ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 px-5 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">🏠 Mes Apps</h1>
            <p className="text-xs text-gray-400">{profile?.avatar} {profile?.name}</p>
          </div>
          <button
            onClick={() => { setProfile(null); setScreen('profiles') }}
            className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
          >
            Changer
          </button>
        </div>
      </div>

      <div className="px-5 py-6 max-w-lg mx-auto">
        <div className="grid grid-cols-2 gap-4">
          {APPS.map(app => (
            <button key={app.id} onClick={() => setActiveApp(app.id)}
              className="bg-white rounded-2xl p-5 border border-gray-100 text-left shadow-sm active:scale-95 transition-transform">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-3"
                style={{ background: app.color + '18' }}>
                {app.emoji}
              </div>
              <p className="font-bold text-gray-900 text-sm">{app.name}</p>
              <p className="text-xs text-gray-400 mt-0.5 leading-snug">{app.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}