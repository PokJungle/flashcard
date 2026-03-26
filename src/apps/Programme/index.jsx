import { useState } from 'react'
import TabBar from '../../components/TabBar'
import useProgramme from './hooks/useProgramme'
import HomeScreen from './screens/HomeScreen'

const PROGRAMME_COLOR = '#6366f1' // indigo-500

const PROGRAMME_TABS = [
  { id: 'list',  emoji: '📋', label: 'Liste' },
  { id: 'month', emoji: '🗓️', label: 'Mois' },
]

export default function Programme({ profile }) {
  const { events, loading, error, addEvent, deleteEvent } = useProgramme()
  const [view, setView] = useState('list')

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {error && (
        <div className="mx-5 mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
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
        />
      </div>
      <TabBar tabs={PROGRAMME_TABS} active={view} onChange={setView} color={PROGRAMME_COLOR} />
    </div>
  )
}