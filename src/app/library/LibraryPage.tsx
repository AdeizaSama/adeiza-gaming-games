import { LayoutGrid, Play, SlidersHorizontal, type LucideIcon } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation } from 'react-router'
import { describeSave, saveName, summarizeSave } from '../play/savedGame'
import { images } from '../registry'
import { cardImage } from '../registry/images'
import { ThemePicker } from '../theme/ThemePicker'
import { featured } from './featured'
import { GameCard } from './GameCard'
import { players } from './LibraryLayout'

/** The press effect every link-card on the home page shares. */
const press = 'transition-transform active:scale-[0.98] focus-visible:outline-3 focus-visible:outline-offset-2 motion-reduce:transition-none motion-reduce:active:scale-100'

/** One of the two big links under the featured games: an icon, a name and a line under it. */
function PageLink({ to, icon: Icon, name, description }: { to: string; icon: LucideIcon; name: string; description: string }) {
  return (
    <Link to={to} className={`flex flex-col gap-2 rounded-xl bg-card p-4 text-card-foreground shadow-sm ${press}`}>
      <Icon aria-hidden className="size-8 text-primary" />
      <span className="text-xl font-bold">{name}</span>
      <span className="text-sm text-muted-foreground">{description}</span>
    </Link>
  )
}

/**
 * The home page (ADR 0021): the saved game to continue, if there is one; the two featured variants; then Browse
 * games and Custom game, each a page of its own.
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
        <Link to={`/${unfinished.game.meta.id}/play`} className={`flex items-center gap-4 rounded-xl bg-primary p-5 text-primary-foreground shadow-sm ${press}`}>
          <Play aria-hidden className="size-10 shrink-0" />
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-bold">Continue {saveName(unfinished)}</h2>
            <p>{describeSave(unfinished)}</p>
          </div>
        </Link>
      )}

      <section className="flex flex-col gap-4">
        <h2 id="featured" className="text-2xl font-bold">
          Featured
        </h2>
        <ul aria-labelledby="featured" className="flex flex-col gap-3">
          {featured.map(({ game, variant }) => (
            <GameCard
              key={`${game.meta.id}/${variant.id}`}
              size="row"
              to={`/${game.meta.id}/${variant.id}`}
              game={game}
              name={variant.name}
              tagline={variant.tagline}
              detail={`${game.meta.name} · ${players(game)}`}
              image={cardImage(images, game, variant.id)}
              back={{ to: '/', label: 'Home' }}
            />
          ))}
        </ul>
      </section>

      <nav aria-label="More games" className="grid grid-cols-2 gap-3">
        <PageLink to="/games" icon={LayoutGrid} name="Browse games" description="Every way to play, by what it's like." />
        <PageLink to="/custom" icon={SlidersHorizontal} name="Custom game" description="Pick the packs and every setting yourself." />
      </nav>
    </main>
  )
}
