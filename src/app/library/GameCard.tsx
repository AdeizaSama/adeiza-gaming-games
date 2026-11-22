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
  /** `grid`: a tile in Browse or Custom game; `featured`: a wide card on the home page. */
  size?: 'grid' | 'featured'
}

/** One game or variant in the library: a whole-card link, picture on top. */
export function GameCard({ to, game, name, tagline, detail, image, back, size = 'grid' }: GameCardProps) {
  const featured = size === 'featured'
  return (
    <li className="flex">
      <Link
        to={to}
        state={{ back }}
        className="flex w-full flex-col overflow-hidden rounded-xl bg-card text-card-foreground shadow-sm transition-transform active:scale-[0.98] focus-visible:outline-3 focus-visible:outline-offset-2 motion-reduce:transition-none motion-reduce:active:scale-100"
      >
        <CardArt game={game} image={image} className={featured ? 'aspect-video' : 'aspect-[4/3]'} />
        <div className={cn('flex flex-1 flex-col gap-1', featured ? 'p-4' : 'p-3')}>
          <h3 className={cn('font-bold text-balance', featured ? 'text-2xl' : 'line-clamp-2 text-lg leading-snug')}>{name}</h3>
          <p className={cn('text-muted-foreground', !featured && 'line-clamp-2 text-sm')}>{tagline}</p>
          <p className={cn('mt-auto text-muted-foreground', featured ? 'text-sm' : 'text-xs')}>{detail}</p>
        </div>
      </Link>
    </li>
  )
}
