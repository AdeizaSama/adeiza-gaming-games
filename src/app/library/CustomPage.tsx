import { games, images } from '../registry'
import { cardImage } from '../registry/images'
import { GameCard } from './GameCard'
import { CardGrid, LibraryLayout, players } from './LibraryLayout'

/** `/custom` (ADR 0021): every game, each opening its own setup with every setting (what "Make your own" was). */
export function CustomPage() {
  return (
    <LibraryLayout title="Custom game" description="Pick a game, then its packs and every setting yourself.">
      <CardGrid label="Games">
        {games.map((game) => (
          <GameCard
            key={game.meta.id}
            to={`/${game.meta.id}`}
            game={game}
            name={game.meta.name}
            tagline={game.meta.tagline}
            detail={players(game)}
            image={cardImage(images, game)}
            back={{ to: '/custom', label: 'Custom game' }}
          />
        ))}
      </CardGrid>
    </LibraryLayout>
  )
}
