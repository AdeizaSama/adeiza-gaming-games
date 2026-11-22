import { createElement } from 'react'
import { Link } from 'react-router'
import { cn } from '../../ui/cn'
import type { AnyGame } from '../registry'
import { gameIcon } from './gameIcon'

/**
 * Where a setup page's back link goes, passed along by the card that opened it (ADR 0021): the page the player was
 * on, and what to call it.
 */
export interface BackLink {
  to: string
  label: string
}

/**
 * The stand-in pictures' colors: two theme colors each, so they follow the theme. Each game always gets the same
 * pair (by its id), so neighbouring cards differ and a game looks the same everywhere.
 */
const standIns = [
  'from-primary to-secondary',
  'from-secondary to-primary',
  'from-primary to-success',
  'from-warning to-primary',
] as const

/** The stand-in colors for a game: a small sum of its id's letters picks one. */
export function standIn(gameId: string): (typeof standIns)[number] {
  const sum = [...gameId].reduce((total, letter) => total + letter.charCodeAt(0), 0)
  return standIns[sum % standIns.length]
}

/**
 * A card's picture: the image if there is one, else the game's icon on a gradient of theme colors. Decoration only
 * (`alt=""`, `aria-hidden`): the card's name says what it is.
 */
export function CardArt({ game, image, className }: { game: AnyGame; image?: string; className?: string }) {
  return (
    <div className={cn('relative overflow-hidden', className)}>
      {image ? (
        <img src={image} alt="" loading="lazy" decoding="async" className="size-full object-cover" />
      ) : (
        <div aria-hidden data-stand-in className={cn('flex size-full items-center justify-center bg-linear-to-br', standIn(game.meta.id))}>
          {/* createElement, not <Icon />: the icon is looked up by name, and React wants components it can see. */}
          {createElement(gameIcon(game.meta.icon), { 'aria-hidden': true, className: 'size-1/3 text-primary-foreground opacity-90' })}
        </div>
      )}
    </div>
  )
}

export interface GameCardProps {
  to: string
  game: AnyGame
  name: string
  tagline: string
  /** A small line under the tagline: the game and players. */
  detail: string
  image?: string
  /** Where the setup page's back link returns to. */
  back: BackLink
  /**
   * `grid`: a tile in Browse or Custom game, picture on top. `row`: a short card on the home page, picture on the
   * left, so the featured games leave room for the links under them.
   */
  size?: 'grid' | 'row'
}

/** One game or variant in the library: a whole-card link with its picture. */
export function GameCard({ to, game, name, tagline, detail, image, back, size = 'grid' }: GameCardProps) {
  const row = size === 'row'
  return (
    <li className="flex">
      <Link
        to={to}
        state={{ back }}
        className={cn(
          'flex w-full overflow-hidden rounded-xl bg-card text-card-foreground shadow-sm transition-transform active:scale-[0.98] focus-visible:outline-3 focus-visible:outline-offset-2 motion-reduce:transition-none motion-reduce:active:scale-100',
          row ? 'min-h-28 flex-row' : 'flex-col',
        )}
      >
        {/* In a row, the picture is a square as tall as the card: a 4:3 picture is cut to fit from the middle. */}
        <CardArt game={game} image={image} className={row ? 'w-28 shrink-0 self-stretch' : 'aspect-[4/3]'} />
        <div className="flex min-w-0 flex-1 flex-col gap-1 p-3">
          <h3 className="line-clamp-2 text-lg leading-snug font-bold text-balance">{name}</h3>
          <p className="line-clamp-2 text-sm text-muted-foreground">{tagline}</p>
          <p className="mt-auto text-xs text-muted-foreground">{detail}</p>
        </div>
      </Link>
    </li>
  )
}
