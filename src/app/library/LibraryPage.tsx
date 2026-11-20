import { Play } from 'lucide-react'
import { createElement, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { describeSave, saveName, summarizeSave } from '../play/savedGame'
import { games, variants, type AnyGame } from '../registry'
import { ThemePicker } from '../theme/ThemePicker'
import { gameIcon } from './gameIcon'

/** The look of every card on the home page: a whole-card link. */
const cardClass =
  'flex items-center gap-4 rounded-xl bg-card p-5 text-card-foreground shadow-sm transition-transform active:scale-[0.98] focus-visible:outline-3 focus-visible:outline-offset-2 motion-reduce:transition-none motion-reduce:active:scale-100'

/** One card: the game's icon, a name, a line under it, and a small line about who it's for. */
function Card({ to, game, name, tagline, detail }: { to: string; game: AnyGame; name: string; tagline: string; detail: string }) {
  return (
    <li>
      <Link to={to} className={cardClass}>
        {/* createElement, not <Icon />: the icon is looked up by name, and React wants components it can see. */}
        {createElement(gameIcon(game.meta.icon), { 'aria-hidden': true, className: 'size-12 shrink-0 text-primary' })}
        <div className="flex flex-col gap-1">
          <h3 className="text-2xl font-bold">{name}</h3>
          <p className="text-muted-foreground">{tagline}</p>
          <p className="text-sm text-muted-foreground">{detail}</p>
        </div>
      </Link>
    </li>
  )
}

/** "2–20 players". */
const players = (game: AnyGame) => `${game.meta.players.min}–${game.meta.players.max} players`

/**
 * The home page (ADR 0018): the saved game to continue, if there is one; then every variant, each a link to its
 * setup; then "Make your own", every game, each a link to its own setup with every setting.
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
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold">Ku Zo Wasa</h1>
          <p className="text-lg text-muted-foreground">Party games for one phone.</p>
        </div>
        <ThemePicker />
      </header>

      {discarded && (
        <div role="status" className="rounded-xl border-line border-warning p-4">
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
            <h2 className="text-2xl font-bold">Continue {saveName(unfinished)}</h2>
            <p>{describeSave(unfinished)}</p>
          </div>
        </Link>
      )}

      <ul aria-label="Ways to play" className="flex flex-col gap-4">
        {variants.map(({ game, variant }) => (
          <Card
            key={`${game.meta.id}/${variant.id}`}
            to={`/${game.meta.id}/${variant.id}`}
            game={game}
            name={variant.name}
            tagline={variant.tagline}
            detail={`${game.meta.name} · ${players(game)}`}
          />
        ))}
      </ul>
      <section className="flex flex-col gap-4">
        <div>
          <h2 id="make-your-own" className="text-2xl font-bold">
            Make your own
          </h2>
          <p className="text-muted-foreground">Pick the packs and every setting yourself.</p>
        </div>
        <ul aria-labelledby="make-your-own" className="flex flex-col gap-4">
          {games.map((game) => (
            <Card key={game.meta.id} to={`/${game.meta.id}`} game={game} name={game.meta.name} tagline={game.meta.tagline} detail={players(game)} />
          ))}
        </ul>
      </section>
    </main>
  )
}
