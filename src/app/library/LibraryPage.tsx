import { Link } from 'react-router'
import { games } from '../registry'
import { gameIcon } from './gameIcon'

/** The home page: every game in the registry, each a link to its setup screen. */
export function LibraryPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-8 p-6">
      <header>
        <h1 className="text-4xl font-bold">Ku Zo Wasa</h1>
        <p className="text-lg text-muted-foreground">Party games for one phone.</p>
      </header>
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
