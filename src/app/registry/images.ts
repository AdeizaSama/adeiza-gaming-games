import type { AnyGame } from '.'

/**
 * Pictures for the library's cards (ADR 0021), found by file name in each game's `images/` folder:
 * `game.webp` for the game, `<variant-id>.webp` for a variant. WebP, AVIF, PNG or JPEG.
 */
export const imageExtensions = ['webp', 'avif', 'png', 'jpg', 'jpeg'] as const

/** One game's pictures, by name without the extension (`game`, or a variant's id), each the address to load it from. */
export type GameImages = Record<string, string>

export interface ImageIndex {
  /** Each game's pictures, by game id. */
  byGame: Record<string, GameImages>
  /** Files named after nothing, or two files with the same name: a test fails on any. */
  problems: string[]
}

/**
 * Sorts image files (path → address, from `import.meta.glob`) by game and name, and lists the ones that belong to
 * nothing. A path looks like `../../games/charades/images/naija-back-to-school.webp`.
 */
export function indexImages(files: Record<string, string>, games: readonly AnyGame[]): ImageIndex {
  const byGame: Record<string, GameImages> = {}
  const problems: string[] = []
  for (const [path, url] of Object.entries(files)) {
    const match = /games\/([^/]+)\/images\/([^/]+)\.([a-z]+)$/.exec(path)
    const game = match && games.find((candidate) => candidate.meta.id === match[1])
    if (!match || !game) {
      problems.push(`${path}: not in a game's images folder`)
      continue
    }
    const [, gameId, name] = match
    const names = ['game', ...game.variants.map((variant) => variant.id)]
    if (!names.includes(name)) {
      problems.push(`${path}: name it game, or after one of ${game.meta.name}'s variants: ${names.slice(1).join(', ')}`)
      continue
    }
    const images = (byGame[gameId] ??= {})
    if (images[name]) problems.push(`${path}: ${gameId} already has a picture called ${name}`)
    else images[name] = url
  }
  return { byGame, problems }
}

/** A card's picture: the variant's own, else its game's, else none (the card draws its own, ADR 0021). */
export function cardImage(index: ImageIndex, game: AnyGame, variantId?: string): string | undefined {
  const images = index.byGame[game.meta.id] ?? {}
  return (variantId !== undefined ? images[variantId] : undefined) ?? images.game
}
