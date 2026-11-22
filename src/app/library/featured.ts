import { variants, type ListedVariant } from '../registry'

/**
 * The two variants the home page features (ADR 0021), by game and variant id. Listed here, not in the variant files,
 * so no pull request can feature its own variant by itself. A test checks both exist.
 */
export const featuredIds = [
  { game: 'charades', variant: 'naija-back-to-school' },
  { game: 'trivia-night', variant: 'back-to-school' },
] as const

/** The featured variants that exist, in the order above. */
export const featured: readonly ListedVariant[] = featuredIds.flatMap(
  (ids) => variants.find(({ game, variant }) => game.meta.id === ids.game && variant.id === ids.variant) ?? [],
)
