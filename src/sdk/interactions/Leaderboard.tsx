import { cn } from '../../ui/cn'

export interface LeaderboardEntry {
  name: string
  score: number
}

/**
 * Places, highest score first. Equal scores share a place and the next place is skipped: 10, 10, 7 → 1st, 1st, 3rd.
 * Ties keep the order they came in. The list passed in is not changed.
 */
export function rank(entries: readonly LeaderboardEntry[]): (LeaderboardEntry & { place: number })[] {
  const sorted = [...entries].sort((a, b) => b.score - a.score) // a stable sort keeps tied entries in order
  return sorted.map((entry) => ({ ...entry, place: sorted.findIndex((other) => other.score === entry.score) + 1 }))
}

export interface LeaderboardProps {
  entries: LeaderboardEntry[]
}

/** Team or player standings (standard §6). First place is highlighted; on a tie, everyone sharing it is. */
export function Leaderboard({ entries }: LeaderboardProps) {
  return (
    <ol aria-label="Standings" className="flex w-full flex-col gap-3">
      {rank(entries).map((entry, index) => {
        const first = entry.place === 1
        return (
          <li
            key={index}
            className={cn(
              'flex items-center gap-4 rounded-lg px-5 py-4 text-xl',
              first ? 'bg-primary text-primary-foreground' : 'bg-card text-card-foreground',
            )}
          >
            <span className="w-8 font-bold tabular-nums">{entry.place}</span>
            <span className="flex-1 font-semibold">{entry.name}</span>
            <span className="font-bold tabular-nums">{entry.score}</span>
          </li>
        )
      })}
    </ol>
  )
}
