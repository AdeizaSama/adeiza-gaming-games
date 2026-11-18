import type { TeamTurnsViewProps } from '../../../sdk/formats/team-turns/views'
import { Countdown } from '../../../sdk/interactions/Countdown'
import { PromptCard } from '../../../sdk/interactions/PromptCard'
import { Button } from '../../../ui/button'
import type { NameTenConfig } from '../config'
import type { NameTenEvent, NameTenTurn } from '../machine'
import type { NameTenItem } from '../schema'

/**
 * A Name Ten turn, on the judge's phone: the team and the timer at the top, the category and the board of answers to
 * tick as the team says them, and a way to end the turn early if the team gives up.
 */
export function TurnView({ context, send }: TeamTurnsViewProps<NameTenItem, NameTenTurn, NameTenEvent, NameTenConfig>) {
  const { board, got } = context.turn
  return (
    // min-h-0: the board fills the play screen's height and no more (ADR 0013).
    <section className="flex min-h-0 flex-1 flex-col gap-4 p-4">
      <header className="flex items-center justify-between">
        <p className="text-xl font-semibold">{context.config.teams[context.current]}</p>
        {context.turnEndsAt !== null && <Countdown endsAt={context.turnEndsAt} onTimeUp={() => send({ type: 'time_up' })} />}
      </header>
      {context.item && (
        <PromptCard
          prompt={context.item.category}
          answers={board.map((text, index) => ({ text, on: got[index] }))}
          onToggle={(index) => send({ type: 'toggle', index })}
        />
      )}
      <Button variant="outline" onClick={() => send({ type: 'lock_in' })}>
        End turn early
      </Button>
    </section>
  )
}
