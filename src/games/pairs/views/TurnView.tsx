import type { TeamTurnsViewProps } from '../../../sdk/formats/team-turns/views'
import { Countdown } from '../../../sdk/interactions/Countdown'
import { FlipCard } from '../../../sdk/interactions/FlipCard'
import { PickCard } from '../../../sdk/interactions/PickCard'
import { Button } from '../../../ui/button'
import type { PairsConfig } from '../config'
import { findCount, type PairsEvent, type PairsTurn } from '../machine'
import type { PairsItem } from '../schema'

/** "Card 2 of 10", or "Set 2 of 10" for tiles: which round of the turn this is. */
export function roundCount(turn: PairsTurn, config: PairsConfig): string {
  const number = turn.results.length + (turn.revealed && turn.round?.kind === 'pick' ? 0 : 1)
  return `${config.play === 'flip' ? 'Card' : 'Set'} ${Math.min(number, config.cards)} of ${config.cards}`
}

/** What players do with the tiles: find three words' partners, or the three not in a group. */
export function pickLabel(config: PairsConfig): string {
  return config.play === 'odd' ? `Find the ${findCount} that don't belong` : 'Find their partners'
}

/**
 * A Pairs turn, for both its phases (ADR 0020): the team (or the one player) and the clock at the top, then a flip card
 * or a set of tiles. After a set is checked, a button to the next set or the end of the turn.
 */
export function TurnView({ context, send }: TeamTurnsViewProps<PairsItem, PairsTurn, PairsEvent, PairsConfig>) {
  const { turn, config } = context
  const round = turn.round
  const last = turn.results.length >= config.cards
  return (
    // min-h-0: the tiles fill the play screen's height and no more (ADR 0013).
    <section className="flex min-h-0 flex-1 flex-col gap-4 p-4">
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xl font-semibold">{config.teams[context.current]}</p>
          <p className="text-sm text-muted-foreground">{roundCount(turn, config)}</p>
        </div>
        {/* Hidden on the last result, so time running out doesn't cut it short (as Trivia Night's, ADR 0015). */}
        {context.turnEndsAt !== null && !(turn.revealed && last) && <Countdown endsAt={context.turnEndsAt} onTimeUp={() => send({ type: 'time_up' })} />}
      </header>
      {round?.kind === 'flip' && (
        <FlipCard
          front={round.front}
          back={round.back}
          flipped={turn.revealed}
          onFlip={() => send({ type: 'flip' })}
          onKnew={() => send({ type: 'knew' })}
          onNotYet={() => send({ type: 'not_yet' })}
        />
      )}
      {round?.kind === 'pick' && (
        <>
          <PickCard
            label={pickLabel(config)}
            prompts={round.prompts}
            options={round.options}
            need={round.answers.length}
            picked={turn.picked}
            answers={round.answers}
            checked={turn.revealed}
            onPick={(index) => send({ type: 'pick', index })}
            onCheck={() => send({ type: 'check' })}
          />
          {turn.revealed && (
            <Button size="lg" onClick={() => send({ type: 'continue' })}>
              {last ? 'End turn' : 'Next set'}
            </Button>
          )}
        </>
      )}
    </section>
  )
}
