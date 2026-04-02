import { useState } from 'react'
import { List, Swords, Search } from 'lucide-react'
import WatchlistScreen from './screens/WatchlistScreen'
import MatchScreen from './screens/MatchScreen'
import DiscoverScreen from './screens/DiscoverScreen'
import { useWatchlist } from './hooks/useWatchlist'
import { useVetos } from './hooks/useVetos'

const TABS = [
  { id: 'watchlist', label: 'Ma liste', Icon: List },
  { id: 'match', label: 'Match', Icon: Swords },
  { id: 'discover', label: 'Découvrir', Icon: Search },
]

const C = {
  bg: '#0d0620',
  tabBar: '#16082e',
  border: '#2d1059',
  amber: '#f59e0b',
  violet: '#7c3aed',
  inactive: '#6b4fa0',
}

export default function Tisane({ profile }) {
  const [tab, setTab] = useState('watchlist')
  const watchlist = useWatchlist(profile)
  const vetos = useVetos(profile)

  const watchlistIds = watchlist.items.map(i => `${i.tmdb_id}-${i.media_type}`)

  return (
    <div className="flex flex-col" style={{ minHeight: '100%', background: C.bg }}>
      {/* Contenu scrollable */}
      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: 72 }}>
        {tab === 'watchlist' && (
          <WatchlistScreen
            items={watchlist.items}
            loading={watchlist.loading}
            profile={profile}
            onAdvanceEpisode={watchlist.advanceEpisode}
            onAdvanceSeason={watchlist.advanceSeason}
            onMarkWatched={watchlist.markWatched}
            vetos={vetos}
          />
        )}
        {tab === 'match' && (
          <MatchScreen
            items={watchlist.items}
            profile={profile}
            onVote={watchlist.vote}
            onAddFromGlobal={watchlist.addAndVote}
            vetos={vetos}
          />
        )}
        {tab === 'discover' && (
          <DiscoverScreen
            profile={profile}
            onAdd={watchlist.addItem}
            watchlistIds={watchlistIds}
          />
        )}
      </div>

      {/* TabBar fixe en bas */}
      <div className="fixed bottom-0 left-0 right-0 z-20 flex"
        style={{ background: C.tabBar, borderTop: `0.5px solid ${C.border}` }}>
        {TABS.map(({ id, label, Icon }) => {
          const active = tab === id
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              className="flex-1 flex flex-col items-center py-3 gap-0.5 transition-all active:scale-95"
              style={{ color: active ? C.amber : C.inactive }}>
              <Icon size={21} strokeWidth={active ? 2.5 : 1.5} />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
