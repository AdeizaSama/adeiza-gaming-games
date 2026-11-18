import type { TeamTurnsViewProps } from '../../../sdk/formats/team-turns/views'
import { FlashCard } from '../../../sdk/interactions/FlashCard'
import type { NameTenConfig } from '../config'
import { maxSkips, type NameTenEvent, type NameTenTurn } from '../machine'
import type { NameTenItem } from '../schema'

/** "3 skips left", "1 skip left", or that there are none. */
export function skipsLeftText(skips: number): string {
  const left = maxSkips - skips
  if (left === 0) return 'No skips left: play this one.'
  return `${left} ${left === 1 ? 'skip' : 'skips'} left. A skipped category doesn't come back.`
}

/**
 * Before the turn (ADR 0014): the judge shows the team its category, never the answers. The team plays it, starting
 * the clock, or skips to the next, up to three times.
 */
export function CategoryView({ context, send }: TeamTurnsViewProps<NameTenItem, NameTenTurn, NameTenEvent, NameTenConfig>) {
  const { skips } = context.turn
  return (
    <section className="flex flex-1 flex-col gap-4 p-4">
      <p className="text-center text-xl font-semibold">{context.config.teams[context.current]}, here's your category</p>
      {context.item && (
        <FlashCard
          text={context.item.category}
          hint="Category"
          gotLabel="Play this"
          skipLabel="Skip"
          skipDisabled={skips >= maxSkips}
          onGot={() => send({ type: 'play' })}
          onSkip={() => send({ type: 'skip' })}
        />
      )}
      <p className="text-center text-muted-foreground" aria-live="polite">
        {skipsLeftText(skips)}
      </p>
    </section>
  )
}
