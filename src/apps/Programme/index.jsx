import { useState } from 'react'
import TabBar from '../../components/TabBar'
import useProgramme from './hooks/useProgramme'
import HomeScreen from './screens/HomeScreen'

const PROGRAMME_COLOR = '#6366f1'
const PROGRAMME_TABS = [
  { id: 'list',  emoji: '📋', label: 'Liste' },
  { id: 'month', emoji: '🗓️', label: 'Mois' },
]

export default function Programme({ profile, dark }) {
  const { events, loading, error, addEvent, deleteEvent } = useProgramme()
  const [view, setView] = useState('list')

  return (
    <div className="h-full flex flex-col" style={{ background: dark ? '#0f0a1e' : '#f9fafb' }}>
      {error && (
        <div className="mx-5 mt-4 rounded-xl px-4 py-3 text-sm"
          style={{ background: dark ? '#2d1a1a' : '#fff1f1', border: `1px solid ${dark ? '#7f1d1d' : '#fecaca'}`, color: '#ef4444' }}>
          {error}
        </div>
      )}
      <div className="flex-1 overflow-y-auto">
        <HomeScreen
          events={events}
          loading={loading}
          onAdd={addEvent}
          onDelete={deleteEvent}
          profile={profile}
          view={view}
          dark={dark}
        />
      </div>
      <TabBar tabs={PROGRAMME_TABS} active={view} onChange={setView} color={PROGRAMME_COLOR} dark={dark} />
    </div>
  )
}