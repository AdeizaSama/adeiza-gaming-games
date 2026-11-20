import { MessageCircle, Music, PersonStanding } from 'lucide-react'
import { Countdown } from '../../../sdk/interactions/Countdown'
import { FlashCard, type FlashCardTone } from '../../../sdk/interactions/FlashCard'
import type { TeamTurnsViewProps } from '../../../sdk/formats/team-turns/views'
import type { CharadesConfig } from '../config'
import type { CharadesEvent, CharadesTurn } from '../machine'
import type { CharadesItem, CharadesMode } from '../schema'

/** What the card says in Mix it up. In Describe mode every card is described, so it says nothing. */
export const modeHints: Record<CharadesMode, string> = { describe: 'Describe it', act: 'Act it out', sing: 'Sing or hum it' }

/**
 * How each mode looks in Mix it up, so players see at a glance how to clue the card: an icon (which works for
 * everyone, color-blind players included) and a theme color. Not green or red: those mean got it and skipped.
 */
export const modeLooks: Record<CharadesMode, { icon: typeof MessageCircle; tone: FlashCardTone }> = {
  describe: { icon: MessageCircle, tone: 'secondary' },
  act: { icon: PersonStanding, tone: 'warning' },
  sing: { icon: Music, tone: 'primary' },
}

/** A Charades turn: the team and the timer at the top, the card with Skip and Got it below. */
export function TurnView({ context, send }: TeamTurnsViewProps<CharadesItem, CharadesTurn, CharadesEvent, CharadesConfig>) {
  return (
    <section className="flex flex-1 flex-col gap-4 p-4">
      <header className="flex items-center justify-between">
        <p className="text-xl font-semibold">{context.config.teams[context.current]}</p>
        {context.turnEndsAt !== null && (
          <Countdown endsAt={context.turnEndsAt} onTimeUp={() => send({ type: 'time_up' })} />
        )}
      </header>
      {context.item && (
        <FlashCard
          text={context.item.text}
          {...(context.config.mode === 'mix' && { hint: modeHints[context.turn.mode], ...modeLooks[context.turn.mode] })}
          onGot={() => send({ type: 'got' })}
          onSkip={() => send({ type: 'skip' })}
        />
      )}
    </section>
  )
}
