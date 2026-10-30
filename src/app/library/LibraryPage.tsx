import { Play } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation } from 'react-router'
import { describeSave, summarizeSave } from '../play/savedGame'
import { games } from '../registry'
import { gameIcon } from './gameIcon'

/**
 * The home page: the saved game to continue, if there is one, then every game in the registry, each a link to its
 * setup screen.
 */
export function LibraryPage() {
  const location = useLocation()
  // Read once when the page opens: reading can delete a save that can't be used any more (ADR 0006).
  const [saved] = useState(() => summarizeSave())
  // A save the play page had to throw away arrives as navigation state; one found here, from the read above.
  const discarded: string | undefined = location.state?.discarded ?? (saved.status === 'discarded' ? saved.reason : undefined)
  const unfinished = saved.status === 'ok' && !saved.summary.finished ? saved.summary : undefined

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-8 p-6">
      <header>
        <h1 className="text-4xl font-bold">Ku Zo Wasa</h1>
        <p className="text-lg text-muted-foreground">Party games for one phone.</p>
      </header>

      {discarded && (
        <div role="status" className="rounded-xl border-2 border-warning p-4">
          <p className="font-semibold">Your last game couldn't be restored.</p>
          <p className="text-sm text-muted-foreground">Because {discarded}.</p>
        </div>
      )}

      {unfinished && (
        <Link
          to={`/${unfinished.game.meta.id}/play`}
          className="flex items-center gap-4 rounded-xl bg-primary p-5 text-primary-foreground shadow-sm transition-transform active:scale-[0.98] focus-visible:outline-3 focus-visible:outline-offset-2 motion-reduce:transition-none motion-reduce:active:scale-100"
        >
          <Play aria-hidden className="size-10 shrink-0" />
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-bold">Continue {unfinished.game.meta.name}</h2>
            <p>{describeSave(unfinished)}</p>
          </div>
        </Link>
      )}

      <ul className="flex flex-col gap-4">
        {games.map(({ meta }) => {
          const Icon = gameIcon(meta.icon)
          return (
            <li key={meta.id}>
              <Link
                to={`/${meta.id}`}
                className="flex items-center gap-4 rounded-xl bg-card p-5 text-card-foreground shadow-sm transition-transform active:scale-[0.98] focus-visible:outline-3 focus-visible:outline-offset-2 motion-reduce:transition-none motion-reduce:active:scale-100"
              >
                <Icon aria-hidden className="size-12 shrink-0 text-primary" />
                <div className="flex flex-col gap-1">
                  <h2 className="text-2xl font-bold">{meta.name}</h2>
                  <p className="text-muted-foreground">{meta.tagline}</p>
                  <p className="text-sm text-muted-foreground">
                    {meta.players.min}–{meta.players.max} players
                  </p>
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
    </main>
  )
}
