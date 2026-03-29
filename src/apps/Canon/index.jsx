import TabBar from '../../components/TabBar'
import { useCanon } from './hooks/useCanon'
import CaveScreen from './screens/CaveScreen'
import JournalScreen from './screens/JournalScreen'
import { useState } from 'react'

const COLOR = '#9b1c1c'

const TABS = [
  { id: 'cave',    emoji: '🏚️', label: 'Cave' },
  { id: 'journal', emoji: '📓', label: 'Journal' },
]

export default function Canon({ profile, dark }) {
  const [tab, setTab] = useState('cave')
  const hook = useCanon(profile)

  return (
    <div className="h-full flex flex-col" style={{ background: dark ? '#0f0a1e' : '#f9fafb' }}>
      <div className="flex-1 overflow-y-auto">
        {tab === 'cave' && (
          <CaveScreen hook={hook} dark={dark} profile={profile} />
        )}
        {tab === 'journal' && (
          <JournalScreen hook={hook} dark={dark} profile={profile} />
        )}
      </div>
      <TabBar tabs={TABS} active={tab} onChange={setTab} color={COLOR} dark={dark} />
    </div>
  )
}
