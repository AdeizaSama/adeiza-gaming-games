import { Countdown } from '../../../sdk/interactions/Countdown'
import { FlashCard } from '../../../sdk/interactions/FlashCard'
import type { TeamTurnsViewProps } from '../../../sdk/formats/team-turns/views'
import type { CharadesEvent, CharadesTurn } from '../machine'
import type { CharadesItem } from '../schema'

/** A Charades turn: the team and the timer at the top, the card with Skip and Got it below. */
export function TurnView({ context, send }: TeamTurnsViewProps<CharadesItem, CharadesTurn, CharadesEvent>) {
  return (
    <section className="flex min-h-dvh flex-col gap-4 p-4">
      <header className="flex items-center justify-between">
        <p className="text-xl font-semibold">{context.config.teams[context.current]}</p>
        {context.turnEndsAt !== null && (
          <Countdown endsAt={context.turnEndsAt} onTimeUp={() => send({ type: 'time_up' })} />
        )}
      </header>
      {context.item && (
        <FlashCard
          text={context.item.text}
          hint="Describe it"
          onGot={() => send({ type: 'got' })}
          onSkip={() => send({ type: 'skip' })}
        />
      )}
    </section>
  )
}
