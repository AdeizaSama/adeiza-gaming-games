import { useLocation, useSearchParams } from 'react-router'
import { categories } from '../../sdk/content/categories'
import { Button } from '../../ui/button'
import { images, variants } from '../registry'
import { cardImage } from '../registry/images'
import { GameCard } from './GameCard'
import { CardGrid, LibraryLayout, players } from './LibraryLayout'

/** The categories at least one variant is in, in the list's order: a filter that shows nothing isn't offered. */
const used = categories.filter(({ id }) => variants.some(({ variant }) => variant.categories.includes(id)))

/**
 * `/games` (ADR 0021): every variant in a two-column grid, with a filter by category. The category is in the address
 * (`?category=french`), so a setup's back link returns to it; one that isn't offered shows every game.
 */
export function BrowsePage() {
  const [params, setParams] = useSearchParams()
  const { search } = useLocation()
  const asked = params.get('category')
  const category = used.some(({ id }) => id === asked) ? asked : null
  const shown = category ? variants.filter(({ variant }) => variant.categories.includes(category)) : variants

  // `replace`: changing the filter isn't a new page, so Back still goes home, not through each filter tried.
  const pick = (id: string | null) => setParams(id ? { category: id } : {}, { replace: true })

  return (
    <LibraryLayout title="Browse games" description="Every way to play, by what it's like.">
      <div role="group" aria-label="Category" className="flex flex-wrap gap-2">
        {[{ id: null, label: 'All' }, ...used].map(({ id, label }) => (
          <Button
            key={id ?? 'all'}
            variant={category === id ? 'primary' : 'outline'}
            aria-pressed={category === id}
            className="h-11 rounded-full px-4 text-sm"
            onClick={() => pick(id)}
          >
            {label}
          </Button>
        ))}
      </div>
      <CardGrid label="Games">
        {shown.map(({ game, variant }) => (
          <GameCard
            key={`${game.meta.id}/${variant.id}`}
            to={`/${game.meta.id}/${variant.id}`}
            game={game}
            name={variant.name}
            tagline={variant.tagline}
            detail={`${game.meta.name} · ${players(game)}`}
            image={cardImage(images, game, variant.id)}
            back={{ to: `/games${search}`, label: 'Games' }}
          />
        ))}
      </CardGrid>
    </LibraryLayout>
  )
}
