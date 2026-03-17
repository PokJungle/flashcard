import useProgramme from './hooks/useProgramme'
import HomeScreen from './screens/HomeScreen'

export default function Programme({ profile }) {
  const { events, loading, error, addEvent, deleteEvent } = useProgramme()

  return (
    <div className="min-h-full bg-gray-50">
      {error && (
        <div className="mx-5 mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}
      <HomeScreen
        events={events}
        loading={loading}
        onAdd={addEvent}
        onDelete={deleteEvent}
        profile={profile}
      />
    </div>
  )
}